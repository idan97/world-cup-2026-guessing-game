import prisma from '../db';
import type { Stage, Outcome } from '@prisma/client';
import logger from '../logger';

/**
 * סוגי נתוני הסימולציה
 */
export interface SimulatedMatchResult {
  matchId: string;
  team1Score: number;
  team2Score: number;
  winnerId?: string | null;
}

export interface SimulationInput {
  leagueId: string;
  simulatedResults: SimulatedMatchResult[];
  actualTopScorer?: string | null;
}

export interface LeaderboardEntry {
  formId: string;
  userId: string;
  nickname: string;
  totalPoints: number;
  rank: number;
  breakdown: {
    matchPoints: number;
    advancePoints: number;
    topScorerPoints: number;
  };
  tiebreakers: {
    exactResults: number;
    correctDecisions: number;
    correctChampion: boolean;
    correctTopScorer: boolean;
    correctAdvances: Record<string, number>;
  };
}

/**
 * חישוב טבלת ניקוד מדומה עבור ליגה
 * @param input נתוני הסימולציה - תוצאות מדומות
 * @returns טבלת ניקוד מלאה עם דירוג
 */
export async function simulateLeagueScoring(
  input: SimulationInput,
): Promise<LeaderboardEntry[]> {
  const { leagueId, simulatedResults, actualTopScorer } = input;

  logger.info(
    { leagueId, resultsCount: simulatedResults.length },
    'Starting simulation for league',
  );

  // שלב 1: אימות ליגה וקבלת כל החברים
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      members: {
        include: {
          user: {
            include: {
              form: true,
            },
          },
        },
      },
    },
  });

  if (!league) {
    throw new Error('League not found');
  }

  // שלב 2: אימות תוצאות המשחקים
  const matchIds = simulatedResults.map((r) => r.matchId);
  const matches = await prisma.match.findMany({
    where: {
      id: {
        in: matchIds,
      },
    },
  });

  if (matches.length !== matchIds.length) {
    const foundIds = matches.map((m) => m.id);
    const missingIds = matchIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Invalid match IDs: ${missingIds.join(', ')}`);
  }

  // שלב 3: יצירת מפת תוצאות מדומות (לא משנים את ה-DB)
  // אנחנו צריכים "להעמיד פנים" שהמשחקים הסתיימו עם התוצאות המדומות
  const simulatedMatchMap = new Map<string, SimulatedMatchResult>();
  simulatedResults.forEach((result) => {
    simulatedMatchMap.set(result.matchId, result);
  });

  // שלב 4: חישוב ניקוד לכל טופס בליגה
  const leaderboardEntries: LeaderboardEntry[] = [];

  for (const member of league.members) {
    const form = member.user.form;
    if (!form) {
      continue; // דלג על משתמשים ללא טופס
    }

    try {
      // חישוב ניקוד מדומה
      const scoreResult = await calculateSimulatedScore(
        form.id,
        simulatedMatchMap,
        actualTopScorer,
      );

      // חישוב שוברי שוויון מדומים
      const tiebreakers = await calculateSimulatedTiebreakers(
        form.id,
        simulatedMatchMap,
        actualTopScorer,
      );

      leaderboardEntries.push({
        formId: form.id,
        userId: member.userId,
        nickname: form.nickname,
        totalPoints: scoreResult.totalPoints,
        rank: 0, // נקבע בהמשך
        breakdown: scoreResult.breakdown,
        tiebreakers,
      });
    } catch (error) {
      logger.error(
        { error, formId: form.id, userId: member.userId },
        'Error calculating simulated score for form',
      );
      // ממשיכים לטופס הבא במקרה של שגיאה
    }
  }

  // שלב 5: מיון לפי ניקוד ושוברי שוויון
  leaderboardEntries.sort((a, b) => {
    // ניקוד כללי
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // שובר 1: פגיעות מדויקות
    if (a.tiebreakers.exactResults !== b.tiebreakers.exactResults) {
      return b.tiebreakers.exactResults - a.tiebreakers.exactResults;
    }

    // שובר 2: פגיעות בהכרעה
    if (a.tiebreakers.correctDecisions !== b.tiebreakers.correctDecisions) {
      return b.tiebreakers.correctDecisions - a.tiebreakers.correctDecisions;
    }

    // שובר 3: אלופה
    if (a.tiebreakers.correctChampion !== b.tiebreakers.correctChampion) {
      return a.tiebreakers.correctChampion ? -1 : 1;
    }

    // שובר 4: מלך שערים
    if (a.tiebreakers.correctTopScorer !== b.tiebreakers.correctTopScorer) {
      return a.tiebreakers.correctTopScorer ? -1 : 1;
    }

    // שובר 5-8: עליות נכונות (גמר > חצי > רבע > שמינית)
    const stageOrder = ['F', 'SF', 'QF', 'R16'];
    for (const stage of stageOrder) {
      const aAdvances = a.tiebreakers.correctAdvances[stage] || 0;
      const bAdvances = b.tiebreakers.correctAdvances[stage] || 0;
      if (aAdvances !== bAdvances) {
        return bAdvances - aAdvances;
      }
    }

    return 0;
  });

  // שלב 6: קביעת דירוגים
  leaderboardEntries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  logger.info(
    { leagueId, entriesCount: leaderboardEntries.length },
    'Simulation completed successfully',
  );

  return leaderboardEntries;
}

/**
 * חישוב ניקוד מדומה לטופס יחיד
 * משתמשים בתוצאות מדומות במקום תוצאות אמיתיות
 */
async function calculateSimulatedScore(
  formId: string,
  simulatedMatchMap: Map<string, SimulatedMatchResult>,
  actualTopScorer: string | null = null,
): Promise<{
  totalPoints: number;
  breakdown: {
    matchPoints: number;
    advancePoints: number;
    topScorerPoints: number;
  };
}> {
  let totalPoints = 0;
  let matchPoints = 0;
  let advancePoints = 0;
  let topScorerPoints = 0;

  // 1. חישוב ניקוד ממשחקים עם תוצאות מדומות
  const matchPicks = await prisma.matchPick.findMany({
    where: { formId },
    include: { match: true },
  });

  for (const pick of matchPicks) {
    const simulatedResult = simulatedMatchMap.get(pick.matchId);
    if (!simulatedResult) {
      continue; // אם אין תוצאה מדומה למשחק זה, מדלגים
    }

    const points = calculateMatchScoreFromSimulation(pick, simulatedResult);
    matchPoints += points;
  }
  totalPoints += matchPoints;

  // 2. חישוב ניקוד מהעלאות (מורכב יותר - צריך לבנות עץ נוקאאוט מדומה)
  // לצורך הדמיה, נשתמש רק בניקוד מהמשחקים
  // בעתיד ניתן להרחיב את זה לכלול חישוב העלאות מלא

  // 3. חישוב ניקוד ממלך השערים
  if (actualTopScorer) {
    const topScorerPick = await prisma.topScorerPick.findUnique({
      where: { formId },
    });

    if (topScorerPick) {
      const predictedName = topScorerPick.playerName.trim().toLowerCase();
      const actualName = actualTopScorer.trim().toLowerCase();
      if (predictedName === actualName) {
        topScorerPoints = 8; // TOP_SCORER_POINTS
      }
    }
  }
  totalPoints += topScorerPoints;

  return {
    totalPoints,
    breakdown: {
      matchPoints,
      advancePoints,
      topScorerPoints,
    },
  };
}

/**
 * חישוב ניקוד למשחק בודד על בסיס תוצאה מדומה
 */
function calculateMatchScoreFromSimulation(
  pick: {
    match: { stage: Stage };
    predOutcome: Outcome;
    predScoreA: number;
    predScoreB: number;
  },
  simulatedResult: SimulatedMatchResult,
): number {
  const match = pick.match;

  // מטריצת הניקוד
  const SCORING_MATRIX = {
    GROUP: { decision: 1, exactResult: 3 },
    R32: { decision: 3, exactResult: 3 },
    R16: { decision: 3, exactResult: 3 },
    QF: { decision: 5, exactResult: 3 },
    SF: { decision: 7, exactResult: 3 },
    F: { decision: 9, exactResult: 3 },
  };

  const scoring = SCORING_MATRIX[match.stage as Stage];
  let points = 0;

  // קביעת ההכרעה המדומה
  let actualOutcome: Outcome;
  if (simulatedResult.team1Score > simulatedResult.team2Score) {
    actualOutcome = 'W';
  } else if (simulatedResult.team1Score < simulatedResult.team2Score) {
    actualOutcome = 'L';
  } else {
    actualOutcome = 'D';
  }

  const predictedOutcome = pick.predOutcome;

  // בדיקה אם ניחש את ההכרעה
  if (actualOutcome === predictedOutcome) {
    points += scoring.decision;

    // בדיקה אם ניחש גם את התוצאה המדויקת
    if (
      simulatedResult.team1Score === pick.predScoreA &&
      simulatedResult.team2Score === pick.predScoreB
    ) {
      points += scoring.exactResult;
    }
  }

  return points;
}

/**
 * חישוב שוברי שוויון מדומים
 */
/**
 * קבלת כל הניבויים של כל המשתתפים בליגה
 * לצורך חישוב בזמן אמת בצד הלקוח
 */
export async function getAllLeaguePredictions(leagueId: string): Promise<{
  forms: Array<{
    formId: string;
    nickname: string;
    userId: string;
    predictions: Array<{
      matchId: string;
      predScoreA: number;
      predScoreB: number;
      predOutcome: string;
    }>;
    topScorerName: string | null;
  }>;
}> {
  // אימות ליגה וקבלת חברים
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!league) {
    throw new Error('League not found');
  }

  // קבלת כל הטפסים של חברי הליגה
  const userIds = league.members.map((m) => m.userId);
  const forms = await prisma.form.findMany({
    where: {
      ownerId: { in: userIds },
    },
    include: {
      matchPicks: true,
      topScorerPicks: true,
    },
  });

  const result = forms.map((form) => ({
    formId: form.id,
    nickname: form.nickname,
    userId: form.ownerId,
    predictions: form.matchPicks.map((pick) => ({
      matchId: pick.matchId,
      predScoreA: pick.predScoreA,
      predScoreB: pick.predScoreB,
      predOutcome: pick.predOutcome,
    })),
    topScorerName: form.topScorerPicks[0]?.playerName || null,
  }));

  logger.info(
    { leagueId, formsCount: result.length },
    'Retrieved all league predictions',
  );

  return { forms: result };
}

async function calculateSimulatedTiebreakers(
  formId: string,
  simulatedMatchMap: Map<string, SimulatedMatchResult>,
  actualTopScorer: string | null = null,
): Promise<{
  exactResults: number;
  correctDecisions: number;
  correctChampion: boolean;
  correctTopScorer: boolean;
  correctAdvances: Record<string, number>;
}> {
  const matchPicks = await prisma.matchPick.findMany({
    where: { formId },
    include: { match: true },
  });

  let exactResults = 0;
  let correctDecisions = 0;

  // ספירת פגיעות במשחקים
  for (const pick of matchPicks) {
    const simulatedResult = simulatedMatchMap.get(pick.matchId);
    if (!simulatedResult) {
      continue;
    }

    // קביעת ההכרעה המדומה
    let actualOutcome: Outcome;
    if (simulatedResult.team1Score > simulatedResult.team2Score) {
      actualOutcome = 'W';
    } else if (simulatedResult.team1Score < simulatedResult.team2Score) {
      actualOutcome = 'L';
    } else {
      actualOutcome = 'D';
    }

    if (actualOutcome === pick.predOutcome) {
      correctDecisions++;

      if (
        simulatedResult.team1Score === pick.predScoreA &&
        simulatedResult.team2Score === pick.predScoreB
      ) {
        exactResults++;
      }
    }
  }

  // בדיקת אלופה (מדומה)
  // נניח שמשחק הגמר הוא עם stage='F'
  const finalMatch = await prisma.match.findFirst({
    where: { stage: 'F' },
  });
  let correctChampion = false;
  if (finalMatch) {
    const finalResult = simulatedMatchMap.get(finalMatch.id);
    if (finalResult?.winnerId) {
      // TODO: Derive champion from final match winner prediction
      correctChampion = false;
    }
  }

  // בדיקת מלך השערים
  let correctTopScorer = false;
  if (actualTopScorer) {
    const topScorerPick = await prisma.topScorerPick.findUnique({
      where: { formId },
    });
    if (topScorerPick) {
      const predictedName = topScorerPick.playerName.trim().toLowerCase();
      const actualName = actualTopScorer.trim().toLowerCase();
      correctTopScorer = predictedName === actualName;
    }
  }

  // לצורך הדמיה - לא מחשבים עליות (מורכב מדי)
  const correctAdvances: Record<string, number> = {
    F: 0,
    SF: 0,
    QF: 0,
    R16: 0,
  };

  return {
    exactResults,
    correctDecisions,
    correctChampion,
    correctTopScorer,
    correctAdvances,
  };
}
