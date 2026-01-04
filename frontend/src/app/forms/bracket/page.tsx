'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import Header from '../../../components/Header';
import GroupStage from './components/GroupStage';
import KnockoutBracket from './components/KnockoutBracket';
import { apiUrls, http } from '../../../../lib/api';
import { useApi } from '../../../../lib/useApi';
import type { 
  GroupDisplay, 
  MatchDisplay, 
  MatchPrediction, 
  MatchData, 
  Team, 
  GroupStanding,
  Stage,
  GROUPS 
} from './types';

// Fetch all needed data
const GROUPS_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

// R32 mapping based on FIFA World Cup 2026 format (from worldcup2026_data.json)
// Maps match numbers to which group positions play each other
// 8 matches have third-place teams: 74, 77, 79, 80, 81, 82, 85, 87
const R32_MAPPING: Array<{ match: number; team1: string; team2: string; thirdPlaceCode?: string }> = [
  { match: 73, team1: '2A', team2: '2B' },
  { match: 74, team1: '1E', team2: '3rd', thirdPlaceCode: '3-ABCDF' },
  { match: 75, team1: '1F', team2: '2C' },
  { match: 76, team1: '1C', team2: '2F' },
  { match: 77, team1: '1I', team2: '3rd', thirdPlaceCode: '3-CDFGH' },
  { match: 78, team1: '2E', team2: '2I' },
  { match: 79, team1: '1A', team2: '3rd', thirdPlaceCode: '3-CEFHI' },
  { match: 80, team1: '1L', team2: '3rd', thirdPlaceCode: '3-EHIJK' },
  { match: 81, team1: '1D', team2: '3rd', thirdPlaceCode: '3-BEFIJ' },
  { match: 82, team1: '1G', team2: '3rd', thirdPlaceCode: '3-AEHIJ' },
  { match: 83, team1: '2K', team2: '2L' },
  { match: 84, team1: '1H', team2: '2J' },
  { match: 85, team1: '1B', team2: '3rd', thirdPlaceCode: '3-EFGIJ' },
  { match: 86, team1: '1J', team2: '2H' },
  { match: 87, team1: '1K', team2: '3rd', thirdPlaceCode: '3-DEIJL' },
  { match: 88, team1: '2D', team2: '2G' },
];

// Third place assignments lookup table
// Key: sorted 8-letter combination of groups with advancing 3rd place teams
// Value: which group's 3rd place plays in each R32 match
type ThirdPlaceAssignments = Record<number, string>;

// Function to calculate which 8 third-place teams advance and their assignments
function calculateThirdPlaceAssignments(
  thirdPlaceTeams: Array<{ groupLetter: string; points: number; goalDiff: number; goalsFor: number }>
): { qualifiedGroups: string[]; assignments: ThirdPlaceAssignments } | null {
  if (thirdPlaceTeams.length !== 12) return null;
  
  // Sort by: 1) Points, 2) Goal Diff, 3) Goals For
  const sorted = [...thirdPlaceTeams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
  
  // Top 8 advance
  const qualifiedGroups = sorted.slice(0, 8).map(t => t.groupLetter);
  
  // Create sorted combination key
  const combinationKey = [...qualifiedGroups].sort().join('');
  
  // Lookup table for third place assignments (all 495 combinations)
  // Format: { [match_number]: group_letter }
  // This is a simplified version - in production would load from JSON
  const assignments = getThirdPlaceAssignmentsForCombination(combinationKey);
  
  return { qualifiedGroups, assignments };
}

// Simplified lookup - maps combination to match assignments
// In full implementation, this would come from third_place_assignments.json
function getThirdPlaceAssignmentsForCombination(combination: string): ThirdPlaceAssignments {
  // Common combinations for World Cup 2026
  const lookupTable: Record<string, ThirdPlaceAssignments> = {
    'ABCDEFGH': { 74: 'G', 77: 'F', 79: 'H', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFGI': { 74: 'G', 77: 'F', 79: 'I', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFGJ': { 74: 'G', 77: 'F', 79: 'J', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFGK': { 74: 'G', 77: 'F', 79: 'K', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFGL': { 74: 'G', 77: 'F', 79: 'L', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFHI': { 74: 'F', 77: 'H', 79: 'I', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFHJ': { 74: 'F', 77: 'H', 79: 'J', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFHK': { 74: 'F', 77: 'H', 79: 'K', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFHL': { 74: 'F', 77: 'H', 79: 'L', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFIJ': { 74: 'F', 77: 'I', 79: 'J', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFIK': { 74: 'F', 77: 'I', 79: 'K', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFIL': { 74: 'F', 77: 'I', 79: 'L', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFJK': { 74: 'F', 77: 'J', 79: 'K', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFJL': { 74: 'F', 77: 'J', 79: 'L', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFKL': { 74: 'F', 77: 'K', 79: 'L', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'EFGHIJKL': { 74: 'J', 77: 'G', 79: 'E', 80: 'K', 81: 'I', 82: 'H', 85: 'F', 87: 'L' },
    // Default fallback - will handle any combination by distributing alphabetically
  };
  
  if (lookupTable[combination]) {
    return lookupTable[combination];
  }
  
  // Fallback: distribute third-place teams to matches in order
  const groups = combination.split('');
  const thirdPlaceMatches = [74, 77, 79, 80, 81, 82, 85, 87];
  const result: ThirdPlaceAssignments = {};
  thirdPlaceMatches.forEach((match, idx) => {
    result[match] = groups[idx] || groups[0];
  });
  return result;
}

interface StandingsResponse {
  groups: Record<string, Array<{
    id: string;
    groupLetter: string;
    position: number;
    teamId: string | null;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    team: Team | null;
  }>>;
  metadata: {
    groupsIncluded: string[];
    totalGroups: number;
  };
}

interface FormData {
  id: string;
  nickname: string;
  isFinal: boolean;
}

export default function BracketFormPage() {
  const { user, isLoaded } = useUser();
  const api = useApi();
  
  // State for predictions
  const [matchPredictions, setMatchPredictions] = useState<Map<string, MatchPrediction>>(new Map());
  const [winnerSelections, setWinnerSelections] = useState<Map<string, string>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch data using SWR
  const { data: standingsData, error: standingsError } = useSWR<StandingsResponse>(
    '/standings',
    { revalidateOnFocus: false }
  );

  const { data: allMatches, error: matchesError } = useSWR<MatchData[]>(
    '/matches',
    { revalidateOnFocus: false }
  );

  const { data: formData } = useSWR<FormData>(
    user ? apiUrls.myForm() : null,
    { revalidateOnFocus: false }
  );

  const { data: myPredictions } = useSWR<{
    matchPredictions: Array<{
      matchId: string;
      predScoreA: number;
      predScoreB: number;
    }>;
    advancePredictions: any[];
  }>(
    user ? apiUrls.myPredictions() : null,
    { revalidateOnFocus: false }
  );

  // Initialize predictions from saved data
  useEffect(() => {
    if (myPredictions?.matchPredictions) {
      const predMap = new Map<string, MatchPrediction>();
      myPredictions.matchPredictions.forEach(pred => {
        predMap.set(pred.matchId, {
          matchId: pred.matchId,
          predScoreA: pred.predScoreA,
          predScoreB: pred.predScoreB,
        });
      });
      setMatchPredictions(predMap);
    }
  }, [myPredictions]);

  // Process groups data with calculated standings based on predictions
  const groups = useMemo<GroupDisplay[]>(() => {
    if (!standingsData?.groups || !allMatches) return [];

    return GROUPS_LIST.map(letter => {
      const groupStandings = standingsData.groups[letter] || [];
      const groupMatches = allMatches.filter(
        m => m.stage === 'GROUP' && 
             (m.team1Code.endsWith(letter) || m.team2Code.endsWith(letter) ||
              m.team1?.groupLetter === letter || m.team2?.groupLetter === letter)
      );

      // Calculate predicted standings based on predictions
      const standingsWithPredictions = groupStandings.map(s => ({
        position: s.position,
        team: s.team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      }));

      // Process each match prediction
      groupMatches.forEach(match => {
        const pred = matchPredictions.get(match.id);
        if (!pred) return;

        const team1Idx = standingsWithPredictions.findIndex(s => s.team?.id === match.team1?.id);
        const team2Idx = standingsWithPredictions.findIndex(s => s.team?.id === match.team2?.id);

        if (team1Idx === -1 || team2Idx === -1) return;

        // Update played count
        standingsWithPredictions[team1Idx].played++;
        standingsWithPredictions[team2Idx].played++;

        // Update goals
        standingsWithPredictions[team1Idx].goalsFor += pred.predScoreA;
        standingsWithPredictions[team1Idx].goalsAgainst += pred.predScoreB;
        standingsWithPredictions[team2Idx].goalsFor += pred.predScoreB;
        standingsWithPredictions[team2Idx].goalsAgainst += pred.predScoreA;

        // Update points based on result
        if (pred.predScoreA > pred.predScoreB) {
          standingsWithPredictions[team1Idx].wins++;
          standingsWithPredictions[team1Idx].points += 3;
          standingsWithPredictions[team2Idx].losses++;
        } else if (pred.predScoreA < pred.predScoreB) {
          standingsWithPredictions[team2Idx].wins++;
          standingsWithPredictions[team2Idx].points += 3;
          standingsWithPredictions[team1Idx].losses++;
        } else {
          standingsWithPredictions[team1Idx].draws++;
          standingsWithPredictions[team2Idx].draws++;
          standingsWithPredictions[team1Idx].points++;
          standingsWithPredictions[team2Idx].points++;
        }
      });

      // Calculate goal difference
      standingsWithPredictions.forEach(s => {
        s.goalDiff = s.goalsFor - s.goalsAgainst;
      });

      // Sort by points, then goal diff, then goals for
      const sortedStandings = [...standingsWithPredictions].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      });

      // Update positions
      sortedStandings.forEach((s, idx) => {
        s.position = idx + 1;
      });

      return {
        letter,
        teams: groupStandings.map(s => s.team).filter((t): t is Team => t !== null),
        standings: sortedStandings,
        matches: groupMatches.map(match => ({
          match,
          prediction: matchPredictions.get(match.id),
          team1: match.team1,
          team2: match.team2,
        })),
      };
    });
  }, [standingsData, allMatches, matchPredictions]);

  // Get predicted qualified teams from groups
  // Only return teams when all 4 teams in the group have at least 1 predicted match
  const predictedQualifiers = useMemo(() => {
    const result: Record<string, { 
      first: Team | null; 
      second: Team | null; 
      third: Team | null;
      thirdStats: { points: number; goalDiff: number; goalsFor: number } | null;
      isComplete: boolean;
    }> = {};
    
    groups.forEach(group => {
      // Check if all 4 teams have played at least 1 predicted match
      const allTeamsHavePredictions = group.standings.every(s => s.played >= 1);
      
      const thirdPlace = group.standings[2];
      result[group.letter] = {
        first: allTeamsHavePredictions ? (group.standings[0]?.team || null) : null,
        second: allTeamsHavePredictions ? (group.standings[1]?.team || null) : null,
        third: allTeamsHavePredictions ? (thirdPlace?.team || null) : null,
        thirdStats: allTeamsHavePredictions && thirdPlace ? {
          points: thirdPlace.points,
          goalDiff: thirdPlace.goalDiff,
          goalsFor: thirdPlace.goalsFor,
        } : null,
        isComplete: allTeamsHavePredictions,
      };
    });
    
    return result;
  }, [groups]);

  // Calculate third place assignments (which 8 third-place teams advance and where they play)
  const thirdPlaceResult = useMemo(() => {
    const completedGroups = Object.entries(predictedQualifiers)
      .filter(([_, q]) => q.isComplete && q.thirdStats);
    
    // Need all 12 groups to have predictions to calculate
    if (completedGroups.length !== 12) return null;
    
    const thirdPlaceTeams = completedGroups.map(([letter, q]) => ({
      groupLetter: letter,
      team: q.third,
      points: q.thirdStats!.points,
      goalDiff: q.thirdStats!.goalDiff,
      goalsFor: q.thirdStats!.goalsFor,
    }));
    
    return calculateThirdPlaceAssignments(thirdPlaceTeams);
  }, [predictedQualifiers]);

  // Helper to get team by position code (e.g., "1A", "2B", "3rd")
  const getTeamByCode = useCallback((code: string, matchNumber: number): Team | null => {
    // Third place code
    if (code === '3rd') {
      if (!thirdPlaceResult?.assignments) return null;
      const groupLetter = thirdPlaceResult.assignments[matchNumber];
      if (!groupLetter) return null;
      return predictedQualifiers[groupLetter]?.third || null;
    }
    
    const position = parseInt(code[0]);
    const groupLetter = code[1];
    
    if (!predictedQualifiers[groupLetter]) return null;
    
    if (position === 1) return predictedQualifiers[groupLetter].first;
    if (position === 2) return predictedQualifiers[groupLetter].second;
    if (position === 3) return predictedQualifiers[groupLetter].third;
    
    return null;
  }, [predictedQualifiers, thirdPlaceResult]);

  // Get winner of a match based on prediction
  const getMatchWinner = useCallback((matchId: string, team1?: Team | null, team2?: Team | null): Team | null => {
    const pred = matchPredictions.get(matchId);
    if (!pred) return null;
    
    if (pred.predScoreA > pred.predScoreB) return team1 || null;
    if (pred.predScoreB > pred.predScoreA) return team2 || null;
    
    // For tied knockout matches, check winner selection
    const winnerId = winnerSelections.get(matchId);
    if (winnerId) {
      return winnerId === team1?.id ? team1 : team2 || null;
    }
    
    return null;
  }, [matchPredictions, winnerSelections]);

  // Process knockout matches with predicted teams from group standings
  const knockoutMatches = useMemo(() => {
    if (!allMatches) {
      return {
        r32: [] as MatchDisplay[],
        r16: [] as MatchDisplay[],
        qf: [] as MatchDisplay[],
        sf: [] as MatchDisplay[],
        third: null as MatchDisplay | null,
        final: null as MatchDisplay | null,
      };
    }

    // R32 matches - use predicted teams from group standings
    const r32 = allMatches
      .filter(m => m.stage === 'R32')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        const mapping = R32_MAPPING.find(m => m.match === match.matchNumber);
        const predictedTeam1 = mapping ? getTeamByCode(mapping.team1, match.matchNumber) : null;
        const predictedTeam2 = mapping ? getTeamByCode(mapping.team2, match.matchNumber) : null;
        
        return {
          match,
          prediction: matchPredictions.get(match.id),
          // Use predicted team if available, otherwise fall back to match data
          team1: predictedTeam1 || match.team1,
          team2: predictedTeam2 || match.team2,
        };
      });

    // Build a map of R32 winners for R16
    const r32Winners = new Map<number, Team | null>();
    r32.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      r32Winners.set(m.match.matchNumber, winner);
    });

    // R16 matches - use winners from R32
    const r16 = allMatches
      .filter(m => m.stage === 'R16')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        // R16 match numbers and which R32 matches they come from
        // Match 89: W74 vs W77, Match 90: W73 vs W75
        // Match 91: W76 vs W78, Match 92: W79 vs W80
        // Match 93: W83 vs W84, Match 94: W81 vs W82
        // Match 95: W86 vs W88, Match 96: W85 vs W87
        const r16Mapping: Record<number, [number, number]> = {
          89: [74, 77],
          90: [73, 75],
          91: [76, 78],
          92: [79, 80],
          93: [83, 84],
          94: [81, 82],
          95: [86, 88],
          96: [85, 87],
        };
        
        const sources = r16Mapping[match.matchNumber];
        const team1 = sources ? r32Winners.get(sources[0]) : match.team1;
        const team2 = sources ? r32Winners.get(sources[1]) : match.team2;
        
        return {
          match,
          prediction: matchPredictions.get(match.id),
          team1: team1 || match.team1,
          team2: team2 || match.team2,
        };
      });

    // Build R16 winners map
    const r16Winners = new Map<number, Team | null>();
    r16.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      r16Winners.set(m.match.matchNumber, winner);
    });

    // QF matches
    const qfMapping: Record<number, [number, number]> = {
      97: [89, 90],
      98: [93, 94],
      99: [91, 92],
      100: [95, 96],
    };

    const qf = allMatches
      .filter(m => m.stage === 'QF')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        const sources = qfMapping[match.matchNumber];
        const team1 = sources ? r16Winners.get(sources[0]) : match.team1;
        const team2 = sources ? r16Winners.get(sources[1]) : match.team2;
        
        return {
          match,
          prediction: matchPredictions.get(match.id),
          team1: team1 || match.team1,
          team2: team2 || match.team2,
        };
      });

    // Build QF winners map
    const qfWinners = new Map<number, Team | null>();
    qf.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      qfWinners.set(m.match.matchNumber, winner);
    });

    // SF matches
    const sfMapping: Record<number, [number, number]> = {
      101: [97, 98],
      102: [99, 100],
    };

    const sf = allMatches
      .filter(m => m.stage === 'SF')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        const sources = sfMapping[match.matchNumber];
        const team1 = sources ? qfWinners.get(sources[0]) : match.team1;
        const team2 = sources ? qfWinners.get(sources[1]) : match.team2;
        
        return {
          match,
          prediction: matchPredictions.get(match.id),
          team1: team1 || match.team1,
          team2: team2 || match.team2,
        };
      });

    // Build SF winners and losers for final and 3rd place
    const sfWinners = new Map<number, Team | null>();
    const sfLosers = new Map<number, Team | null>();
    sf.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      sfWinners.set(m.match.matchNumber, winner);
      // Loser is the other team
      if (winner) {
        sfLosers.set(m.match.matchNumber, winner.id === m.team1?.id ? (m.team2 || null) : (m.team1 || null));
      }
    });

    // Final - match 104
    const final = allMatches.find(m => m.stage === 'F');
    const finalTeam1 = sfWinners.get(101);
    const finalTeam2 = sfWinners.get(102);
    
    // Third place match - match 103
    const thirdMatch = allMatches.find(m => m.matchNumber === 103);
    const thirdTeam1 = sfLosers.get(101);
    const thirdTeam2 = sfLosers.get(102);

    return {
      r32,
      r16,
      qf,
      sf,
      third: thirdMatch ? {
        match: thirdMatch,
        prediction: matchPredictions.get(thirdMatch.id),
        team1: thirdTeam1 || thirdMatch.team1,
        team2: thirdTeam2 || thirdMatch.team2,
      } : null,
      final: final ? {
        match: final,
        prediction: matchPredictions.get(final.id),
        team1: finalTeam1 || final.team1,
        team2: finalTeam2 || final.team2,
      } : null,
    };
  }, [allMatches, matchPredictions, getTeamByCode, getMatchWinner]);

  // Handle prediction changes
  const handlePredictionChange = useCallback((matchId: string, scoreA: number, scoreB: number) => {
    setMatchPredictions(prev => {
      const newMap = new Map(prev);
      newMap.set(matchId, { matchId, predScoreA: scoreA, predScoreB: scoreB });
      return newMap;
    });
    setIsDirty(true);
  }, []);

  // Fill group stage with random results
  const fillRandomGroupStage = useCallback(() => {
    if (!allMatches) return;
    
    const groupMatches = allMatches.filter(m => m.stage === 'GROUP');
    const newPredictions = new Map(matchPredictions);
    
    groupMatches.forEach(match => {
      // Generate random scores (0-4 range is realistic for football)
      const scoreA = Math.floor(Math.random() * 5);
      const scoreB = Math.floor(Math.random() * 5);
      newPredictions.set(match.id, { matchId: match.id, predScoreA: scoreA, predScoreB: scoreB });
    });
    
    setMatchPredictions(newPredictions);
    setIsDirty(true);
  }, [allMatches, matchPredictions]);

  // Handle winner selection (for tied knockout matches)
  const handleWinnerSelect = useCallback((matchId: string, winnerId: string) => {
    setWinnerSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(matchId, winnerId);
      return newMap;
    });
    setIsDirty(true);
  }, []);

  // Save predictions
  const handleSave = async () => {
    if (!formData) {
      setMessage({ type: 'error', text: 'אנא צור טופס קודם' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const predictions = Array.from(matchPredictions.values());
      if (predictions.length > 0) {
        await api.saveMatchPredictions(predictions);
      }
      
      setIsDirty(false);
      setMessage({ type: 'success', text: '✅ הניבויים נשמרו בהצלחה!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ שגיאה בשמירה: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (standingsError || matchesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.</p>
          </div>
        </main>
      </div>
    );
  }

  const isLocked = formData?.isFinal ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100" dir="rtl">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <span className="text-3xl md:text-4xl">⚽</span>
                טופס ניבויים - מונדיאל 2026
              </h1>
              <p className="text-slate-600 mt-1">
                נבא את התוצאות וצבור נקודות!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  יש שינויים שלא נשמרו
                </span>
              )}
              <button
                onClick={fillRandomGroupStage}
                disabled={isLocked}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm
                           hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center gap-2"
              >
                🎲 מלא רנדומלי
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isLocked || !isDirty}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm
                           hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    שומר...
                  </>
                ) : (
                  <>💾 שמור</>
                )}
              </button>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Form Status */}
          {isLocked && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm">
              🔒 הטופס נשלח ונעול לעריכה
            </div>
          )}
        </div>

        {/* Group Stage */}
        <GroupStage
          groups={groups}
          onPredictionChange={handlePredictionChange}
          isLocked={isLocked}
        />

        {/* Knockout Stages */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            שלבי הנוקאאוט
            <span className="text-sm font-normal text-slate-500">
              (הקבוצות יתעדכנו לפי הניבויים שלך בשלב הבתים)
            </span>
          </h2>
          
          <KnockoutBracket
            r32Matches={knockoutMatches.r32}
            r16Matches={knockoutMatches.r16}
            qfMatches={knockoutMatches.qf}
            sfMatches={knockoutMatches.sf}
            thirdMatch={knockoutMatches.third}
            finalMatch={knockoutMatches.final}
            onPredictionChange={handlePredictionChange}
            onWinnerSelect={handleWinnerSelect}
            isLocked={isLocked}
          />
        </section>

        {/* Footer Actions */}
        <div className="mt-8 py-6 border-t border-slate-200 flex justify-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isLocked || !isDirty}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium
                       hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                שומר...
              </>
            ) : (
              <>💾 שמור ניבויים</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

