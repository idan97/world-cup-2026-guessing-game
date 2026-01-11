/**
 * Bracket Calculation Service
 *
 * Calculates knockout bracket teams based on group stage results.
 * Used for both:
 * 1. Admin flow: Auto-assign R32 teams when group stage complete
 * 2. User flow: Preview R32 teams based on predictions
 */

import prisma from '../db';
import { Team } from '@prisma/client';
import {
  rankThirdPlaceTeams,
  resolveThirdPlaceAssignments,
} from '../utils/thirdPlaceResolver';
import logger from '../logger';

// ============================================
// TYPES
// ============================================

interface MatchResult {
  matchId: string;
  team1Score: number;
  team2Score: number;
}

interface GroupStanding {
  position: number;
  team: Team | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface R32Match {
  matchNumber: number;
  team1Code: string;
  team2Code: string;
  team1: Team | null;
  team2: Team | null;
}

interface KnockoutBracket {
  groupStandings: Record<string, GroupStanding[]>;
  thirdPlaceRanking: string[];
  thirdPlaceAssignments: Record<number, string>;
  r32Matches: R32Match[];
}

// ============================================
// CONSTANTS
// ============================================

const ALL_GROUPS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
] as const;

/**
 * R32 mapping based on FIFA World Cup 2026 format
 * Maps match numbers to team position codes (e.g., "1A" = 1st place Group A)
 */
const R32_MAPPING = [
  { match: 73, team1: '2A', team2: '2B' },
  { match: 74, team1: '1E', team2: '3rd' },
  { match: 75, team1: '1F', team2: '2C' },
  { match: 76, team1: '1C', team2: '2F' },
  { match: 77, team1: '1I', team2: '3rd' },
  { match: 78, team1: '2E', team2: '2I' },
  { match: 79, team1: '1A', team2: '3rd' },
  { match: 80, team1: '1L', team2: '3rd' },
  { match: 81, team1: '1D', team2: '3rd' },
  { match: 82, team1: '1G', team2: '3rd' },
  { match: 83, team1: '2K', team2: '2L' },
  { match: 84, team1: '1H', team2: '2J' },
  { match: 85, team1: '1B', team2: '3rd' },
  { match: 86, team1: '1J', team2: '2H' },
  { match: 87, team1: '1K', team2: '3rd' },
  { match: 88, team1: '2D', team2: '2G' },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Initialize empty standings for a team
 */
function createEmptyStanding(team: Team): GroupStanding {
  return {
    position: 0,
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

/**
 * Update standings for a single match result
 */
function updateStandingsForMatch(
  team1Standing: GroupStanding,
  team2Standing: GroupStanding,
  team1Score: number,
  team2Score: number,
): void {
  // Update played count
  team1Standing.played++;
  team2Standing.played++;

  // Update goals
  team1Standing.goalsFor += team1Score;
  team1Standing.goalsAgainst += team2Score;
  team2Standing.goalsFor += team2Score;
  team2Standing.goalsAgainst += team1Score;

  // Update points and W/D/L
  if (team1Score > team2Score) {
    team1Standing.wins++;
    team1Standing.points += 3;
    team2Standing.losses++;
  } else if (team1Score < team2Score) {
    team2Standing.wins++;
    team2Standing.points += 3;
    team1Standing.losses++;
  } else {
    team1Standing.draws++;
    team2Standing.draws++;
    team1Standing.points++;
    team2Standing.points++;
  }

  // Update goal difference
  team1Standing.goalDiff = team1Standing.goalsFor - team1Standing.goalsAgainst;
  team2Standing.goalDiff = team2Standing.goalsFor - team2Standing.goalsAgainst;
}

/**
 * Sort standings by FIFA rules: points > goal diff > goals for
 */
function sortStandings(standings: GroupStanding[]): GroupStanding[] {
  return standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDiff !== a.goalDiff) {
      return b.goalDiff - a.goalDiff;
    }
    return b.goalsFor - a.goalsFor;
  });
}

/**
 * Resolve team from position code (e.g., "1A", "2B", "3rd")
 */
function resolveTeamFromCode(
  code: string,
  groupStandings: Record<string, GroupStanding[]>,
  thirdPlaceAssignments: Record<number, string>,
  matchNumber: number,
): Team | null {
  if (code === '3rd') {
    const groupLetter = thirdPlaceAssignments[matchNumber];
    if (!groupLetter) {
      return null;
    }
    return groupStandings[groupLetter]?.[2]?.team || null;
  }

  // Format: "1A", "2B", etc.
  const position = parseInt(code[0]!);
  const groupLetter = code[1]!;
  return groupStandings[groupLetter]?.[position - 1]?.team || null;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Calculate group standings from match results
 * Fetches matches and teams in parallel for better performance
 */
export async function calculateGroupStandingsFromResults(
  matchResults: MatchResult[],
): Promise<Record<string, GroupStanding[]>> {
  // Fetch matches and teams in parallel
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      where: {
        stage: 'GROUP',
        id: { in: matchResults.map((r) => r.matchId) },
      },
      include: {
        team1: true,
        team2: true,
      },
    }),
    prisma.team.findMany({
      where: { groupLetter: { not: null } },
    }),
  ]);

  // Initialize standings map for all groups
  const standings: Record<string, Map<string, GroupStanding>> = {};
  for (const groupLetter of ALL_GROUPS) {
    standings[groupLetter] = new Map();
  }

  // Initialize standings for each team
  for (const team of teams) {
    if (team.groupLetter && standings[team.groupLetter]) {
      standings[team.groupLetter]!.set(team.id, createEmptyStanding(team));
    }
  }

  // Process all match results
  for (const result of matchResults) {
    const match = matches.find((m) => m.id === result.matchId);
    if (!match?.team1?.groupLetter || !match.team2) {
      continue;
    }

    const groupLetter = match.team1.groupLetter;
    const team1Standing = standings[groupLetter]?.get(match.team1.id);
    const team2Standing = standings[groupLetter]?.get(match.team2.id);

    if (team1Standing && team2Standing) {
      updateStandingsForMatch(
        team1Standing,
        team2Standing,
        result.team1Score,
        result.team2Score,
      );
    }
  }

  // Sort and assign positions for each group
  const sortedStandings: Record<string, GroupStanding[]> = {};
  for (const groupLetter of ALL_GROUPS) {
    const groupStandingsMap = standings[groupLetter];
    if (!groupStandingsMap) {
      continue;
    }

    const groupStandings = Array.from(groupStandingsMap.values());
    const sorted = sortStandings(groupStandings);

    // Assign positions (1-indexed)
    sorted.forEach((standing, idx) => {
      standing.position = idx + 1;
    });

    sortedStandings[groupLetter] = sorted;
  }

  return sortedStandings;
}

/**
 * Calculate third place ranking and assignments
 */
export async function calculateThirdPlaceAssignments(
  groupStandings: Record<string, GroupStanding[]>,
): Promise<{
  rankedGroups: string[];
  assignments: Record<number, string>;
}> {
  // Extract third place teams
  const thirdPlaceTeams = Object.entries(groupStandings)
    .map(([groupLetter, standings]) => {
      const thirdPlace = standings[2]; // Position 3 (0-indexed)
      if (!thirdPlace) {
        return null;
      }

      return {
        groupLetter,
        points: thirdPlace.points,
        goalDiff: thirdPlace.goalDiff,
        goalsFor: thirdPlace.goalsFor,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  // Rank third place teams (top 8)
  const rankedGroups = rankThirdPlaceTeams(thirdPlaceTeams);

  // Resolve assignments to R32 matches
  const assignments = resolveThirdPlaceAssignments(rankedGroups);

  return { rankedGroups, assignments };
}

/**
 * Calculate R32 teams based on group standings and third place assignments
 */
export async function calculateR32Teams(
  groupStandings: Record<string, GroupStanding[]>,
  thirdPlaceAssignments: Record<number, string>,
): Promise<R32Match[]> {
  return R32_MAPPING.map((mapping) => ({
    matchNumber: mapping.match,
    team1Code: mapping.team1,
    team2Code: mapping.team2,
    team1: resolveTeamFromCode(
      mapping.team1,
      groupStandings,
      thirdPlaceAssignments,
      mapping.match,
    ),
    team2: resolveTeamFromCode(
      mapping.team2,
      groupStandings,
      thirdPlaceAssignments,
      mapping.match,
    ),
  }));
}

/**
 * Main function: Calculate complete knockout bracket
 * Orchestrates the entire bracket calculation process
 */
export async function calculateKnockoutBracket(
  matchResults: MatchResult[],
): Promise<KnockoutBracket> {
  // Step 1: Calculate group standings from match results
  const groupStandings = await calculateGroupStandingsFromResults(matchResults);

  // Step 2: Calculate third place rankings and assignments
  const { rankedGroups, assignments } =
    await calculateThirdPlaceAssignments(groupStandings);

  // Step 3: Determine R32 matchups
  const r32Matches = await calculateR32Teams(groupStandings, assignments);

  logger.info(
    {
      thirdPlaceRanking: rankedGroups,
      r32MatchCount: r32Matches.length,
      teamsAssigned: r32Matches.filter((m) => m.team1 && m.team2).length,
    },
    'Knockout bracket calculated',
  );

  return {
    groupStandings,
    thirdPlaceRanking: rankedGroups,
    thirdPlaceAssignments: assignments,
    r32Matches,
  };
}

/**
 * Assign calculated teams to R32 matches in database (admin use only)
 * Uses transaction to batch all updates for better performance
 */
export async function assignTeamsToR32Matches(
  r32Matches: R32Match[],
): Promise<void> {
  await prisma.$transaction(
    r32Matches.map((r32Match) =>
      prisma.match.updateMany({
        where: { matchNumber: r32Match.matchNumber },
        data: {
          team1Id: r32Match.team1?.id || null,
          team2Id: r32Match.team2?.id || null,
        },
      }),
    ),
  );

  const assignedCount = r32Matches.filter((m) => m.team1 && m.team2).length;
  logger.info(
    {
      totalMatches: r32Matches.length,
      fullyAssigned: assignedCount,
      partiallyAssigned: r32Matches.length - assignedCount,
    },
    'R32 teams assigned to matches in database',
  );
}
