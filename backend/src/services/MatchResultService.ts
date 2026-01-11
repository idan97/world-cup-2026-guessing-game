/**
 * Match Result Service
 *
 * Handles updating match results and automatically updating group standings,
 * third place rankings, and knockout stage team assignments.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchResult {
  matchId: string;
  team1Score: number;
  team2Score: number;
}

interface GroupStandingUpdate {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

/**
 * Updates a match result and triggers all necessary cascading updates
 */
export async function updateMatchResult(result: MatchResult): Promise<void> {
  const { matchId, team1Score, team2Score } = result;

  // Get the match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  if (match.isFinished) {
    throw new Error(`Match ${matchId} is already finished`);
  }

  // Determine winner
  let winnerId: string | null = null;
  if (team1Score > team2Score && match.team1Id) {
    winnerId = match.team1Id;
  } else if (team2Score > team1Score && match.team2Id) {
    winnerId = match.team2Id;
  }

  // Update match
  await prisma.match.update({
    where: { id: matchId },
    data: {
      team1Score,
      team2Score,
      winnerId,
      isFinished: true,
      playedAt: new Date(),
    },
  });

  console.log(
    `✅ Match ${match.matchNumber} result updated: ${team1Score}-${team2Score}`
  );

  // If it's a group stage match, update group standings
  if (match.stage === 'GROUP' && match.team1Id && match.team2Id) {
    await updateGroupStandingsFromMatch(
      match.team1Id,
      match.team2Id,
      team1Score,
      team2Score
    );

    // Check if group stage is complete
    const isGroupStageComplete = await checkGroupStageComplete();
    if (isGroupStageComplete) {
      console.log('🎊 Group stage complete! Updating third place rankings...');
      await updateThirdPlaceRankings();
      await assignR32ThirdPlaceTeams();
    }
  }

  // If it's a knockout match, assign winner to next match
  if (match.stage !== 'GROUP' && winnerId) {
    await assignWinnerToNextMatch(match.matchNumber, winnerId);
  }
}

/**
 * Updates group standings based on a match result
 */
async function updateGroupStandingsFromMatch(
  team1Id: string,
  team2Id: string,
  team1Score: number,
  team2Score: number
): Promise<void> {
  // Get both teams to know their groups
  const [team1, team2] = await Promise.all([
    prisma.team.findUnique({ where: { id: team1Id } }),
    prisma.team.findUnique({ where: { id: team2Id } }),
  ]);

  if (!team1 || !team2 || !team1.groupLetter || !team2.groupLetter) {
    throw new Error('Teams not found or not assigned to groups');
  }

  // Get current standings for both teams
  const [team1Standing, team2Standing] = await Promise.all([
    prisma.groupStanding.findFirst({
      where: {
        groupLetter: team1.groupLetter,
        teamId: team1Id,
      },
    }),
    prisma.groupStanding.findFirst({
      where: {
        groupLetter: team2.groupLetter,
        teamId: team2Id,
      },
    }),
  ]);

  if (!team1Standing || !team2Standing) {
    throw new Error('Group standings not found for teams');
  }

  // Calculate new values
  const team1Update: GroupStandingUpdate = {
    played: team1Standing.played + 1,
    wins: team1Standing.wins,
    draws: team1Standing.draws,
    losses: team1Standing.losses,
    goalsFor: team1Standing.goalsFor + team1Score,
    goalsAgainst: team1Standing.goalsAgainst + team2Score,
    goalDiff: team1Standing.goalDiff + (team1Score - team2Score),
    points: team1Standing.points,
  };

  const team2Update: GroupStandingUpdate = {
    played: team2Standing.played + 1,
    wins: team2Standing.wins,
    draws: team2Standing.draws,
    losses: team2Standing.losses,
    goalsFor: team2Standing.goalsFor + team2Score,
    goalsAgainst: team2Standing.goalsAgainst + team1Score,
    goalDiff: team2Standing.goalDiff + (team2Score - team1Score),
    points: team2Standing.points,
  };

  // Determine points and W/D/L
  if (team1Score > team2Score) {
    // Team 1 wins
    team1Update.wins++;
    team1Update.points += 3;
    team2Update.losses++;
  } else if (team2Score > team1Score) {
    // Team 2 wins
    team2Update.wins++;
    team2Update.points += 3;
    team1Update.losses++;
  } else {
    // Draw
    team1Update.draws++;
    team1Update.points++;
    team2Update.draws++;
    team2Update.points++;
  }

  // Update standings
  await Promise.all([
    prisma.groupStanding.update({
      where: { id: team1Standing.id },
      data: team1Update,
    }),
    prisma.groupStanding.update({
      where: { id: team2Standing.id },
      data: team2Update,
    }),
  ]);

  console.log(`📊 Updated standings for Group ${team1.groupLetter}`);

  // Re-sort the group
  await sortGroupStandings(team1.groupLetter);
}

/**
 * Sorts teams in a group by points, goal diff, goals for
 */
async function sortGroupStandings(groupLetter: string): Promise<void> {
  // Get all standings for this group with teamId not null
  const standings = await prisma.groupStanding.findMany({
    where: {
      groupLetter,
      teamId: { not: null },
    },
    include: {
      team: true,
    },
  });

  // Sort by: points DESC, goalDiff DESC, goalsFor DESC
  const sorted = standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Update positions using transaction to avoid unique constraint conflicts
  // First set all to temporary positions (negative values)
  await prisma.$transaction(async (tx) => {
    // Step 1: Set all to temporary positions
    for (let i = 0; i < sorted.length; i++) {
      const standing = sorted[i];
      if (!standing) continue;

      await tx.groupStanding.update({
        where: { id: standing.id },
        data: { position: -(i + 1) },
      });
    }

    // Step 2: Set all to correct positions
    for (let i = 0; i < sorted.length; i++) {
      const standing = sorted[i];
      if (!standing) continue;

      await tx.groupStanding.update({
        where: { id: standing.id },
        data: { position: i + 1 },
      });
    }
  });

  console.log(`🔄 Sorted Group ${groupLetter} standings`);
}

/**
 * Checks if all group stage matches are complete
 */
async function checkGroupStageComplete(): Promise<boolean> {
  const groupMatches = await prisma.match.findMany({
    where: { stage: 'GROUP' },
  });

  return groupMatches.every((m) => m.isFinished);
}

/**
 * Updates third place rankings after group stage is complete
 */
async function updateThirdPlaceRankings(): Promise<void> {
  // Get all 3rd place teams
  const thirdPlaceStandings = await prisma.groupStanding.findMany({
    where: {
      position: 3,
      teamId: { not: null },
    },
    include: {
      team: true,
    },
  });

  // Sort by: points DESC, goalDiff DESC, goalsFor DESC
  const sorted = thirdPlaceStandings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Take top 8 and assign ranks
  for (let i = 0; i < Math.min(8, sorted.length); i++) {
    const standing = sorted[i];
    if (!standing) continue;

    await prisma.thirdPlaceRanking.update({
      where: { groupLetter: standing.groupLetter },
      data: {
        teamId: standing.teamId,
        rank: i + 1,
        points: standing.points,
        goalDiff: standing.goalDiff,
        goalsFor: standing.goalsFor,
      },
    });
  }

  console.log(`🥉 Updated third place rankings (top 8 teams advance)`);
}

/**
 * Assigns third place teams to R32 matches based on rankings
 */
async function assignR32ThirdPlaceTeams(): Promise<void> {
  // Import the resolver
  const { resolveThirdPlaceAssignments } = await import(
    '../utils/thirdPlaceResolver'
  );

  // Get the 8 qualified third place teams in rank order
  const qualifiedThirdPlace = await prisma.thirdPlaceRanking.findMany({
    where: {
      rank: { lte: 8, not: null },
    },
    orderBy: { rank: 'asc' },
  });

  const rankedGroups = qualifiedThirdPlace.map((t) => t.groupLetter);

  // Get assignments
  const assignments = resolveThirdPlaceAssignments(rankedGroups);

  // Update R32 matches with third place codes
  for (const [matchNumberStr, groupLetter] of Object.entries(assignments)) {
    const matchNumber = parseInt(matchNumberStr);

    // Find the third place team from this group
    const thirdPlaceTeam = await prisma.groupStanding.findFirst({
      where: {
        groupLetter,
        position: 3,
      },
    });

    if (!thirdPlaceTeam?.teamId) continue;

    // Find which position in the match needs this team (team1 or team2)
    const match = await prisma.match.findUnique({
      where: { matchNumber },
    });

    if (!match) continue;

    // Check if team1Code or team2Code contains '3-'
    const updateData: { team1Id?: string; team2Id?: string } = {};
    if (match.team1Code.startsWith('3-')) {
      updateData.team1Id = thirdPlaceTeam.teamId;
    }
    if (match.team2Code.startsWith('3-')) {
      updateData.team2Id = thirdPlaceTeam.teamId;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.match.update({
        where: { matchNumber },
        data: updateData,
      });
      console.log(
        `🎯 Assigned Group ${groupLetter} 3rd place to Match ${matchNumber}`
      );
    }
  }
}

/**
 * Assigns winner of a knockout match to the next round match
 */
async function assignWinnerToNextMatch(
  matchNumber: number,
  winnerId: string
): Promise<void> {
  // Find next match that references this match
  const winnerCode = `W${matchNumber}`;

  const nextMatches = await prisma.match.findMany({
    where: {
      OR: [{ team1Code: winnerCode }, { team2Code: winnerCode }],
    },
  });

  for (const nextMatch of nextMatches) {
    const updateData: { team1Id?: string; team2Id?: string } = {};

    if (nextMatch.team1Code === winnerCode) {
      updateData.team1Id = winnerId;
    }
    if (nextMatch.team2Code === winnerCode) {
      updateData.team2Id = winnerId;
    }

    await prisma.match.update({
      where: { id: nextMatch.id },
      data: updateData,
    });

    console.log(`🎯 Assigned winner to Match ${nextMatch.matchNumber}`);
  }
}

/**
 * Initializes group standings for a team (called when team is assigned to a match)
 */
export async function initializeTeamInGroupStanding(
  teamId: string,
  groupLetter: string,
  initialPosition: number
): Promise<void> {
  // Check if team already has a standing
  const existing = await prisma.groupStanding.findFirst({
    where: {
      teamId,
      groupLetter,
    },
  });

  if (existing) return;

  // Find an empty position or create new one
  const emptyPosition = await prisma.groupStanding.findFirst({
    where: {
      groupLetter,
      teamId: null,
    },
    orderBy: { position: 'asc' },
  });

  if (emptyPosition) {
    await prisma.groupStanding.update({
      where: { id: emptyPosition.id },
      data: { teamId },
    });
  } else {
    await prisma.groupStanding.create({
      data: {
        groupLetter,
        position: initialPosition,
        teamId,
      },
    });
  }
}

export default {
  updateMatchResult,
  initializeTeamInGroupStanding,
};
