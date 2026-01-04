/**
 * Third Place Resolver
 * 
 * When group stage is complete, 8 teams from 3rd place will advance to R32.
 * The assignment of which 3rd place team plays in which R32 match depends
 * on the combination of groups that have 3rd place teams advancing.
 * 
 * This utility reads the pre-computed assignments from third_place_assignments.json
 */

import thirdPlaceData from '../../docs/third_place_assignments.json';

// Type for the JSON structure
type ThirdPlaceAssignmentData = {
  [combination: string]: {
    combination: string;
    match_74?: string;
    match_74_alt?: string;
    match_77?: string;
    match_79?: string;
    match_80?: string;
    match_82?: string;
    match_83?: string;
    match_85?: string;
    match_86?: string;
    match_87?: string;
  };
};

const assignments = thirdPlaceData as ThirdPlaceAssignmentData;

/**
 * Given the 8 third place teams sorted by their ranking (best to worst),
 * returns which group's 3rd place team plays in each R32 match
 * 
 * @param rankedThirdPlaceGroups - Array of 8 group letters sorted by ranking
 * @returns Record of matchNumber to groupLetter
 * 
 * @example
 * resolveThirdPlaceAssignments(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
 * // Returns: { 74: 'J', 77: 'G', 79: 'E', 80: 'K', 82: 'H', 83: 'E', 85: 'F', 86: 'I', 87: 'L' }
 */
export function resolveThirdPlaceAssignments(
  rankedThirdPlaceGroups: string[]
): Record<number, string> {
  if (rankedThirdPlaceGroups.length !== 8) {
    throw new Error(
      `Expected 8 third place groups, got ${rankedThirdPlaceGroups.length}`
    );
  }

  // Create combination string by sorting alphabetically
  const combination = rankedThirdPlaceGroups.slice().sort().join('');
  
  const assignment = assignments[combination];
  
  if (!assignment) {
    throw new Error(
      `No third place assignment found for combination: ${combination}`
    );
  }

  // Map the assignments to match numbers
  const result: Record<number, string> = {};
  
  if (assignment.match_74) result[74] = assignment.match_74;
  if (assignment.match_77) result[77] = assignment.match_77;
  if (assignment.match_79) result[79] = assignment.match_79;
  if (assignment.match_80) result[80] = assignment.match_80;
  if (assignment.match_82) result[82] = assignment.match_82;
  if (assignment.match_83) result[83] = assignment.match_83;
  if (assignment.match_85) result[85] = assignment.match_85;
  if (assignment.match_86) result[86] = assignment.match_86;
  if (assignment.match_87) result[87] = assignment.match_87;
  
  return result;
}

/**
 * Determines the 8 third place teams that advance based on group standings
 * 
 * @param groupStandings - All third place teams with their stats
 * @returns Sorted array of group letters (best to worst)
 */
export function rankThirdPlaceTeams(
  thirdPlaceTeams: Array<{
    groupLetter: string;
    points: number;
    goalDiff: number;
    goalsFor: number;
  }>
): string[] {
  // Sort by: 1) Points, 2) Goal Diff, 3) Goals For
  const sorted = thirdPlaceTeams.slice().sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  // Take top 8
  return sorted.slice(0, 8).map((team) => team.groupLetter);
}

/**
 * Helper to parse team code (like '3-ABCDEF') to determine which 3rd place team
 * 
 * @param teamCode - Code like '1A', '2B', '3-ABCDEF'
 * @param thirdPlaceAssignments - The resolved assignments from resolveThirdPlaceAssignments
 * @param matchNumber - The match number
 * @returns The group letter if it's a 3rd place code, null otherwise
 */
export function parseTeamCode(
  teamCode: string,
  thirdPlaceAssignments: Record<number, string> | null,
  matchNumber: number
): { position: number; groupLetter: string } | null {
  // Simple codes like '1A', '2B'
  if (/^[1-4][A-L]$/.test(teamCode)) {
    return {
      position: parseInt(teamCode[0]!),
      groupLetter: teamCode[1]!,
    };
  }

  // Third place codes like '3-ABCDEF'
  if (/^3-[A-L]+$/.test(teamCode)) {
    if (!thirdPlaceAssignments) {
      throw new Error('Third place assignments not provided');
    }
    
    const groupLetter = thirdPlaceAssignments[matchNumber];
    if (!groupLetter) {
      throw new Error(
        `No third place assignment for match ${matchNumber} with code ${teamCode}`
      );
    }
    
    return {
      position: 3,
      groupLetter,
    };
  }

  // Winner codes like 'W73', 'W74' (for later stages)
  if (/^W\d+$/.test(teamCode)) {
    // These are resolved from match results, not group standings
    return null;
  }

  // Loser codes like 'L101', 'L102' (for third place playoff)
  if (/^L\d+$/.test(teamCode)) {
    // These are resolved from match results
    return null;
  }

  throw new Error(`Unknown team code format: ${teamCode}`);
}

