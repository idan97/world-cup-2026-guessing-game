import prisma from '../db';
import type { Stage, Outcome, Match, MatchPick } from '@prisma/client';

/**
 * מטריצת ניקוד למונדיאל 2026
 * 
 * לכל שלב:
 * - decision: נקודות על ניחוש נכון של ההכרעה (W/D/L או מנצח)
 * - exactResult: נקודות נוספות על ניחוש מדויק של התוצאה
 * - advance: נקודות על ניחוש נכון של קבוצה שעולה לשלב הבא
 */
const SCORING_MATRIX = {
  GROUP: {
    decision: 1,      // ניחוש נכון של הכרעה
    exactResult: 3,   // ניחוש מדויק של תוצאה
    advance: 2,       // עלייה ל-R32
  },
  R32: {
    decision: 3,
    exactResult: 3,
    advance: 2,       // עלייה ל-R16
  },
  R16: {
    decision: 3,
    exactResult: 3,
    advance: 4,       // עלייה לרבע גמר
  },
  QF: {
    decision: 5,
    exactResult: 3,
    advance: 6,       // עלייה לחצי גמר
  },
  SF: {
    decision: 7,
    exactResult: 3,
    advance: 8,       // עלייה לגמר
  },
  F: {
    decision: 9,
    exactResult: 3,
    advance: 0,       // אין שלב הבא
  },
} as const;

const TOP_SCORER_POINTS = 8;

/**
 * קובע מהי ההכרעה (תוצאה) של משחק לפי הניקוד
 */
function determineOutcome(team1Score: number, team2Score: number): Outcome {
  if (team1Score > team2Score) return 'W';
  if (team1Score < team2Score) return 'L';
  return 'D';
}

/**
 * מחשב ניקוד למשחק בודד
 * @param match המשחק האמיתי (עם תוצאה)
 * @param pick הניחוש של המשתמש
 * @returns מספר הנקודות שהמשתמש זכה במשחק זה
 */
export function calculateMatchScore(
  match: Match,
  pick: MatchPick
): number {
  // אם המשחק לא הסתיים, אין ניקוד
  if (!match.isFinished || match.team1Score === null || match.team2Score === null) {
    return 0;
  }

  const stage = match.stage;
  const scoring = SCORING_MATRIX[stage];
  
  let points = 0;

  // בדיקה אם ניחש את ההכרעה
  const actualOutcome = determineOutcome(match.team1Score, match.team2Score);
  const predictedOutcome = pick.predOutcome;

  if (actualOutcome === predictedOutcome) {
    points += scoring.decision;

    // בדיקה אם ניחש גם את התוצאה המדויקת (רק אם ההכרעה נכונה)
    if (
      match.team1Score === pick.predScoreA &&
      match.team2Score === pick.predScoreB
    ) {
      points += scoring.exactResult;
    }
  }

  return points;
}

/**
 * מחשב ניקוד על העלאת קבוצות לשלב הבא
 * @param formId מזהה הטופס
 * @param stage השלב שבודקים בו (R32, R16, QF, SF, F)
 * @returns מספר הנקודות שהמשתמש זכה על העלאות נכונות
 */
export async function calculateAdvanceScore(
  formId: string,
  stage: Exclude<Stage, 'GROUP'>
): Promise<number> {
  // מביאים את הניחושים של המשתמש לשלב זה
  const userAdvancePicks = await prisma.advancePick.findMany({
    where: { formId, stage },
  });

  // מביאים את הקבוצות שבאמת עלו לשלב זה
  // נניח שזה מיוצג ב-matches שבשלב זה, כאשר team1Id ו-team2Id מלאים
  const stageMatches = await prisma.match.findMany({
    where: { stage },
  });

  // אוסף את כל הקבוצות שמשחקות בשלב זה
  const actualTeamsInStage = new Set<string>();
  stageMatches.forEach((match) => {
    if (match.team1Id) actualTeamsInStage.add(match.team1Id);
    if (match.team2Id) actualTeamsInStage.add(match.team2Id);
  });

  // ספירה של כמה קבוצות המשתמש ניחש נכון
  let correctAdvances = 0;
  userAdvancePicks.forEach((pick) => {
    if (actualTeamsInStage.has(pick.teamId)) {
      correctAdvances++;
    }
  });

  // השלב הקודם קובע כמה נקודות מקבלים על עלייה
  const previousStage = getPreviousStage(stage);
  if (!previousStage) return 0;

  const scoring = SCORING_MATRIX[previousStage];
  return correctAdvances * scoring.advance;
}

/**
 * מחשב ניקוד על ניחוש מלך השערים
 * @param formId מזהה הטופס
 * @param actualTopScorer שם מלך השערים האמיתי (null אם עדיין לא נקבע)
 * @returns מספר הנקודות (8 אם נכון, 0 אם לא)
 */
export async function calculateTopScorerScore(
  formId: string,
  actualTopScorer: string | null
): Promise<number> {
  if (!actualTopScorer) return 0;

  const pick = await prisma.topScorerPick.findUnique({
    where: { formId },
  });

  if (!pick) return 0;

  // השוואה case-insensitive
  const predictedName = pick.playerName.trim().toLowerCase();
  const actualName = actualTopScorer.trim().toLowerCase();

  return predictedName === actualName ? TOP_SCORER_POINTS : 0;
}

/**
 * מחשב את הניקוד הכולל לטופס
 * @param formId מזהה הטופס
 * @param actualTopScorer שם מלך השערים האמיתי (null אם עדיין לא נקבע)
 * @returns אובייקט עם פירוט הניקוד
 */
export async function calculateTotalScore(
  formId: string,
  actualTopScorer: string | null = null
): Promise<{
  totalPoints: number;
  breakdown: {
    matchPoints: number;
    advancePoints: number;
    topScorerPoints: number;
  };
  detailedBreakdown: {
    byStage: Record<Stage, number>;
    advancesByStage: Record<string, number>;
  };
}> {
  let totalPoints = 0;
  const byStage: Record<Stage, number> = {
    GROUP: 0,
    R32: 0,
    R16: 0,
    QF: 0,
    SF: 0,
    F: 0,
  };
  const advancesByStage: Record<string, number> = {};

  // 1. חישוב ניקוד ממשחקים
  const matchPicks = await prisma.matchPick.findMany({
    where: { formId },
    include: { match: true },
  });

  let matchPoints = 0;
  for (const pick of matchPicks) {
    const points = calculateMatchScore(pick.match, pick);
    matchPoints += points;
    byStage[pick.match.stage] += points;
  }
  totalPoints += matchPoints;

  // 2. חישוב ניקוד מהעלאות
  const stages: Exclude<Stage, 'GROUP'>[] = ['R32', 'R16', 'QF', 'SF', 'F'];
  let advancePoints = 0;

  for (const stage of stages) {
    const points = await calculateAdvanceScore(formId, stage);
    advancePoints += points;
    advancesByStage[stage] = points;
  }
  totalPoints += advancePoints;

  // 3. חישוב ניקוד ממלך השערים
  const topScorerPoints = await calculateTopScorerScore(formId, actualTopScorer);
  totalPoints += topScorerPoints;

  return {
    totalPoints,
    breakdown: {
      matchPoints,
      advancePoints,
      topScorerPoints,
    },
    detailedBreakdown: {
      byStage,
      advancesByStage,
    },
  };
}

/**
 * מחזיר את השלב הקודם (לצורך חישוב נקודות עלייה)
 */
function getPreviousStage(stage: Stage): Stage | null {
  const stageOrder: Stage[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'F'];
  const index = stageOrder.indexOf(stage);
  if (index <= 0) return null;
  const prevStage = stageOrder[index - 1];
  return prevStage ?? null;
}

/**
 * מחשב סטטיסטיקות לשוברי שוויון
 * @param formId מזהה הטופס
 * @param actualTopScorer שם מלך השערים האמיתי (null אם עדיין לא נקבע)
 * @returns סטטיסטיקות לשוברי שוויון
 */
export async function calculateTiebreakers(
  formId: string,
  actualTopScorer: string | null = null
): Promise<{
  exactResults: number;        // פגיעות מדויקות בתוצאה
  correctDecisions: number;     // פגיעות בהכרעה
  correctChampion: boolean;     // פגיעה באלופה
  correctTopScorer: boolean;    // פגיעה במלך השערים
  correctAdvances: Record<string, number>; // עליית קבוצות נכונה לפי שלב
}> {
  const matchPicks = await prisma.matchPick.findMany({
    where: { formId },
    include: { match: true },
  });

  let exactResults = 0;
  let correctDecisions = 0;

  // ספירת פגיעות במשחקים
  for (const pick of matchPicks) {
    const match = pick.match;
    if (!match.isFinished || match.team1Score === null || match.team2Score === null) {
      continue;
    }

    const actualOutcome = determineOutcome(match.team1Score, match.team2Score);
    if (actualOutcome === pick.predOutcome) {
      correctDecisions++;

      if (match.team1Score === pick.predScoreA && match.team2Score === pick.predScoreB) {
        exactResults++;
      }
    }
  }

  // בדיקת אלופה
  const finalMatch = await prisma.match.findFirst({
    where: { stage: 'F' },
  });
  let correctChampion = false;
  if (finalMatch?.winnerId) {
    const championPick = await prisma.advancePick.findFirst({
      where: { formId, stage: 'F', teamId: finalMatch.winnerId },
    });
    correctChampion = !!championPick;
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

  // ספירת עליות נכונות לפי שלב
  const correctAdvances: Record<string, number> = {
    F: 0,
    SF: 0,
    QF: 0,
    R16: 0,
  };

  const advanceStages: Exclude<Stage, 'GROUP'>[] = ['R16', 'QF', 'SF', 'F'];
  for (const stage of advanceStages) {
    const userPicks = await prisma.advancePick.findMany({
      where: { formId, stage },
    });

    const stageMatches = await prisma.match.findMany({
      where: { stage },
    });

    const actualTeams = new Set<string>();
    stageMatches.forEach((m) => {
      if (m.team1Id) actualTeams.add(m.team1Id);
      if (m.team2Id) actualTeams.add(m.team2Id);
    });

    let count = 0;
    userPicks.forEach((pick) => {
      if (actualTeams.has(pick.teamId)) count++;
    });

    correctAdvances[stage] = count;
  }

  return {
    exactResults,
    correctDecisions,
    correctChampion,
    correctTopScorer,
    correctAdvances,
  };
}

/**
 * מעדכן את הניקוד של טופס ב-DB
 * @param formId מזהה הטופס
 * @param actualTopScorer שם מלך השערים האמיתי
 */
export async function updateFormScore(
  formId: string,
  actualTopScorer: string | null = null
): Promise<void> {
  const result = await calculateTotalScore(formId, actualTopScorer);
  
  await prisma.form.update({
    where: { id: formId },
    data: { totalPoints: result.totalPoints },
  });

  // שמירת רצת ניקוד (audit trail)
  await prisma.scoringRun.create({
    data: {
      formId,
      delta: result.totalPoints,
      details: result.detailedBreakdown,
    },
  });
}

/**
 * מעדכן את הניקוד של כל הטפסים בליגה
 * @param leagueId מזהה הליגה (optional - אם לא מסופק, מעדכן את כל הטפסים)
 * @param actualTopScorer שם מלך השערים האמיתי
 */
export async function updateAllScores(
  actualTopScorer: string | null = null,
  leagueId?: string
): Promise<void> {
  let forms;

  if (leagueId) {
    // מביא את כל הטפסים של חברי הליגה
    const members = await prisma.leagueMember.findMany({
      where: { leagueId },
      include: { user: { include: { form: true } } },
    });
    forms = members.map((m) => m.user.form).filter((f) => f !== null);
  } else {
    // מביא את כל הטפסים
    forms = await prisma.form.findMany();
  }

  // מעדכן כל טופס
  for (const form of forms) {
    if (form) {
      await updateFormScore(form.id, actualTopScorer);
    }
  }
}

