'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import Header from '../../components/Header';
import GroupStage from '../forms/bracket/components/GroupStage';
import KnockoutBracket from '../forms/bracket/components/KnockoutBracket';
import { http } from '../../../lib/api';
import { useAuth } from '@clerk/nextjs';
import { useLeague } from '../../../lib/useLeague';
import type { 
  GroupDisplay, 
  MatchDisplay, 
  MatchPrediction, 
  MatchData, 
  Team, 
} from '../forms/bracket/types';

// Groups list
const GROUPS_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

// R32 mapping based on FIFA World Cup 2026 format
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

// Third place assignments lookup
type ThirdPlaceAssignments = Record<number, string>;

function calculateThirdPlaceAssignments(
  thirdPlaceTeams: Array<{ groupLetter: string; points: number; goalDiff: number; goalsFor: number }>
): { qualifiedGroups: string[]; assignments: ThirdPlaceAssignments } | null {
  if (thirdPlaceTeams.length !== 12) return null;
  
  const sorted = [...thirdPlaceTeams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
  
  const qualifiedGroups = sorted.slice(0, 8).map(t => t.groupLetter);
  const combinationKey = [...qualifiedGroups].sort().join('');
  const assignments = getThirdPlaceAssignmentsForCombination(combinationKey);
  
  return { qualifiedGroups, assignments };
}

function getThirdPlaceAssignmentsForCombination(combination: string): ThirdPlaceAssignments {
  const lookupTable: Record<string, ThirdPlaceAssignments> = {
    'ABCDEFGH': { 74: 'G', 77: 'F', 79: 'H', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'ABCDEFGI': { 74: 'G', 77: 'F', 79: 'I', 80: 'E', 81: 'B', 82: 'A', 85: 'C', 87: 'D' },
    'EFGHIJKL': { 74: 'J', 77: 'G', 79: 'E', 80: 'K', 81: 'I', 82: 'H', 85: 'F', 87: 'L' },
  };
  
  if (lookupTable[combination]) {
    return lookupTable[combination];
  }
  
  // Fallback
  const groups = combination.split('');
  const thirdPlaceMatches = [74, 77, 79, 80, 81, 82, 85, 87];
  const result: ThirdPlaceAssignments = {};
  thirdPlaceMatches.forEach((match, idx) => {
    result[match] = groups[idx] || groups[0];
  });
  return result;
}

// Scoring matrix for local calculation
const SCORING_MATRIX: Record<string, { decision: number; exactResult: number }> = {
  GROUP: { decision: 1, exactResult: 3 },
  R32: { decision: 3, exactResult: 3 },
  R16: { decision: 3, exactResult: 3 },
  QF: { decision: 5, exactResult: 3 },
  SF: { decision: 7, exactResult: 3 },
  F: { decision: 9, exactResult: 3 },
};

// Types for league predictions
interface FormPrediction {
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
}

interface LeaguePredictionsResponse {
  forms: FormPrediction[];
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

interface RealtimeLeaderboardEntry {
  formId: string;
  nickname: string;
  totalPoints: number;
  matchPoints: number;
  exactResults: number;
  correctDecisions: number;
  topScorerPoints: number;
}

export default function SimulatePage() {
  const { isLoaded } = useUser();
  const { getToken } = useAuth();
  const { leagueId } = useLeague();
  
  // State for simulated results
  const [simulatedResults, setSimulatedResults] = useState<Map<string, MatchPrediction>>(new Map());
  const [winnerSelections, setWinnerSelections] = useState<Map<string, string>>(new Map());
  const [topScorerName, setTopScorerName] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(true);
  
  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data using SWR
  const { data: standingsData, error: standingsError } = useSWR<StandingsResponse>(
    '/standings',
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  const { data: allMatches, error: matchesError } = useSWR<MatchData[]>(
    '/matches',
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  // Fetch all league predictions once
  const { data: leaguePredictions, error: predictionsError, isLoading: isLoadingPredictions } = useSWR<LeaguePredictionsResponse>(
    leagueId ? `/simulate/league/${leagueId}/all-predictions` : null,
    async (url: string) => {
      const token = await getToken();
      return http.get(url, token || '');
    },
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  // Load saved simulation on mount
  useEffect(() => {
    const loadSimulation = async () => {
      try {
        setIsLoadingSimulation(true);
        const token = await getToken();
        if (!token) {
          setIsLoadingSimulation(false);
          return;
        }

        const response = await http.get('/simulate/my', token) as { simulation: { results: Record<string, { predScoreA: number; predScoreB: number }>; topScorer: string | null; updatedAt: string } | null };
        
        if (response.simulation && response.simulation.results) {
          // Convert results object to Map
          const resultsMap = new Map<string, MatchPrediction>();
          Object.entries(response.simulation.results).forEach(([matchId, pred]) => {
            resultsMap.set(matchId, {
              matchId,
              predScoreA: pred.predScoreA,
              predScoreB: pred.predScoreB,
            });
          });
          
          setSimulatedResults(resultsMap);
          setTopScorerName(response.simulation.topScorer || '');
          setLastSaved(new Date(response.simulation.updatedAt));
        }
      } catch (error) {
        console.error('Failed to load simulation:', error);
      } finally {
        setIsLoadingSimulation(false);
      }
    };

    if (isLoaded) {
      loadSimulation();
    }
  }, [isLoaded, getToken]);

  // Auto-save function
  const saveSimulation = useCallback(async () => {
    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;

      // Convert Map to object
      const resultsObject: Record<string, { predScoreA: number; predScoreB: number }> = {};
      simulatedResults.forEach((pred, matchId) => {
        resultsObject[matchId] = {
          predScoreA: pred.predScoreA,
          predScoreB: pred.predScoreB,
        };
      });

      await http.put(
        '/simulate/my',
        {
          results: resultsObject,
          topScorer: topScorerName || null,
        },
        token
      );

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save simulation:', error);
    } finally {
      setIsSaving(false);
    }
  }, [simulatedResults, topScorerName, getToken]);

  // Debounced auto-save
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't auto-save if still loading initial data
    if (isLoadingSimulation) {
      return;
    }

    // Schedule new save after 2 seconds of inactivity
    if (simulatedResults.size > 0) {
      saveTimeoutRef.current = setTimeout(() => {
        saveSimulation();
      }, 2000);
    }

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [simulatedResults, topScorerName, saveSimulation, isLoadingSimulation]);

  // Create a map of match stages for quick lookup
  const matchStageMap = useMemo(() => {
    const map = new Map<string, string>();
    if (allMatches) {
      allMatches.forEach(m => map.set(m.id, m.stage));
    }
    return map;
  }, [allMatches]);

  // Calculate realtime leaderboard locally
  const realtimeLeaderboard = useMemo<RealtimeLeaderboardEntry[]>(() => {
    if (!leaguePredictions?.forms || simulatedResults.size === 0) {
      return [];
    }

    const entries: RealtimeLeaderboardEntry[] = leaguePredictions.forms.map(form => {
      let matchPoints = 0;
      let exactResults = 0;
      let correctDecisions = 0;
      let topScorerPoints = 0;

      // Calculate match scores
      form.predictions.forEach(pred => {
        const simulated = simulatedResults.get(pred.matchId);
        if (!simulated) return;

        const stage = matchStageMap.get(pred.matchId) || 'GROUP';
        const scoring = SCORING_MATRIX[stage] || SCORING_MATRIX.GROUP;

        // Get simulated outcome
        let simulatedOutcome: string;
        if (simulated.predScoreA > simulated.predScoreB) {
          simulatedOutcome = 'W';
        } else if (simulated.predScoreA < simulated.predScoreB) {
          simulatedOutcome = 'L';
        } else {
          simulatedOutcome = 'D';
        }

        // Check if predicted outcome matches
        if (pred.predOutcome === simulatedOutcome) {
          correctDecisions++;
          matchPoints += scoring.decision;

          // Check for exact score
          if (pred.predScoreA === simulated.predScoreA && pred.predScoreB === simulated.predScoreB) {
            exactResults++;
            matchPoints += scoring.exactResult;
          }
        }
      });

      // Check top scorer
      if (topScorerName && form.topScorerName) {
        const predicted = form.topScorerName.trim().toLowerCase();
        const actual = topScorerName.trim().toLowerCase();
        if (predicted === actual) {
          topScorerPoints = 8;
        }
      }

      return {
        formId: form.formId,
        nickname: form.nickname,
        totalPoints: matchPoints + topScorerPoints,
        matchPoints,
        exactResults,
        correctDecisions,
        topScorerPoints,
      };
    });

    // Sort by total points, then exact results, then correct decisions
    return entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactResults !== a.exactResults) return b.exactResults - a.exactResults;
      return b.correctDecisions - a.correctDecisions;
    });
  }, [leaguePredictions, simulatedResults, topScorerName, matchStageMap]);

  // Process groups data with calculated standings based on simulated results
  const groups = useMemo<GroupDisplay[]>(() => {
    if (!standingsData?.groups || !allMatches) return [];

    return GROUPS_LIST.map(letter => {
      const groupStandings = standingsData.groups[letter] || [];
      const groupMatches = allMatches.filter(
        m => m.stage === 'GROUP' && 
             (m.team1Code.endsWith(letter) || m.team2Code.endsWith(letter) ||
              m.team1?.groupLetter === letter || m.team2?.groupLetter === letter)
      );

      // Calculate standings based on simulated results
      const standingsWithResults = groupStandings.map(s => ({
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

      // Process each simulated result
      groupMatches.forEach(match => {
        const result = simulatedResults.get(match.id);
        if (!result) return;

        const team1Idx = standingsWithResults.findIndex(s => s.team?.id === match.team1?.id);
        const team2Idx = standingsWithResults.findIndex(s => s.team?.id === match.team2?.id);

        if (team1Idx === -1 || team2Idx === -1) return;

        standingsWithResults[team1Idx].played++;
        standingsWithResults[team2Idx].played++;

        standingsWithResults[team1Idx].goalsFor += result.predScoreA;
        standingsWithResults[team1Idx].goalsAgainst += result.predScoreB;
        standingsWithResults[team2Idx].goalsFor += result.predScoreB;
        standingsWithResults[team2Idx].goalsAgainst += result.predScoreA;

        if (result.predScoreA > result.predScoreB) {
          standingsWithResults[team1Idx].wins++;
          standingsWithResults[team1Idx].points += 3;
          standingsWithResults[team2Idx].losses++;
        } else if (result.predScoreA < result.predScoreB) {
          standingsWithResults[team2Idx].wins++;
          standingsWithResults[team2Idx].points += 3;
          standingsWithResults[team1Idx].losses++;
        } else {
          standingsWithResults[team1Idx].draws++;
          standingsWithResults[team2Idx].draws++;
          standingsWithResults[team1Idx].points++;
          standingsWithResults[team2Idx].points++;
        }
      });

      // Calculate goal difference
      standingsWithResults.forEach(s => {
        s.goalDiff = s.goalsFor - s.goalsAgainst;
      });

      // Sort standings
      const sortedStandings = [...standingsWithResults].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      });

      sortedStandings.forEach((s, idx) => {
        s.position = idx + 1;
      });

      return {
        letter,
        teams: groupStandings.map(s => s.team).filter((t): t is Team => t !== null),
        standings: sortedStandings,
        matches: groupMatches.map(match => ({
          match,
          prediction: simulatedResults.get(match.id),
          team1: match.team1,
          team2: match.team2,
        })),
      };
    });
  }, [standingsData, allMatches, simulatedResults]);

  // Get qualified teams from groups
  const qualifiedTeams = useMemo(() => {
    const result: Record<string, { 
      first: Team | null; 
      second: Team | null; 
      third: Team | null;
      thirdStats: { points: number; goalDiff: number; goalsFor: number } | null;
      isComplete: boolean;
    }> = {};
    
    groups.forEach(group => {
      const allTeamsHaveResults = group.standings.every(s => s.played >= 1);
      
      const thirdPlace = group.standings[2];
      result[group.letter] = {
        first: allTeamsHaveResults ? (group.standings[0]?.team || null) : null,
        second: allTeamsHaveResults ? (group.standings[1]?.team || null) : null,
        third: allTeamsHaveResults ? (thirdPlace?.team || null) : null,
        thirdStats: allTeamsHaveResults && thirdPlace ? {
          points: thirdPlace.points,
          goalDiff: thirdPlace.goalDiff,
          goalsFor: thirdPlace.goalsFor,
        } : null,
        isComplete: allTeamsHaveResults,
      };
    });
    
    return result;
  }, [groups]);

  // Calculate third place assignments
  const thirdPlaceResult = useMemo(() => {
    const completedGroups = Object.entries(qualifiedTeams)
      .filter(([_, q]) => q.isComplete && q.thirdStats);
    
    if (completedGroups.length !== 12) return null;
    
    const thirdPlaceTeams = completedGroups.map(([letter, q]) => ({
      groupLetter: letter,
      team: q.third,
      points: q.thirdStats!.points,
      goalDiff: q.thirdStats!.goalDiff,
      goalsFor: q.thirdStats!.goalsFor,
    }));
    
    return calculateThirdPlaceAssignments(thirdPlaceTeams);
  }, [qualifiedTeams]);

  // Helper to get team by position code
  const getTeamByCode = useCallback((code: string, matchNumber: number): Team | null => {
    if (code === '3rd') {
      if (!thirdPlaceResult?.assignments) return null;
      const groupLetter = thirdPlaceResult.assignments[matchNumber];
      if (!groupLetter) return null;
      return qualifiedTeams[groupLetter]?.third || null;
    }
    
    const position = parseInt(code[0]);
    const groupLetter = code[1];
    
    if (!qualifiedTeams[groupLetter]) return null;
    
    if (position === 1) return qualifiedTeams[groupLetter].first;
    if (position === 2) return qualifiedTeams[groupLetter].second;
    if (position === 3) return qualifiedTeams[groupLetter].third;
    
    return null;
  }, [qualifiedTeams, thirdPlaceResult]);

  // Get winner of a match based on simulated result
  const getMatchWinner = useCallback((matchId: string, team1?: Team | null, team2?: Team | null): Team | null => {
    const result = simulatedResults.get(matchId);
    if (!result) return null;
    
    if (result.predScoreA > result.predScoreB) return team1 || null;
    if (result.predScoreB > result.predScoreA) return team2 || null;
    
    const winnerId = winnerSelections.get(matchId);
    if (winnerId) {
      return winnerId === team1?.id ? team1 : team2 || null;
    }
    
    return null;
  }, [simulatedResults, winnerSelections]);

  // Process knockout matches
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

    // R32 matches
    const r32 = allMatches
      .filter(m => m.stage === 'R32')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        const mapping = R32_MAPPING.find(m => m.match === match.matchNumber);
        const predictedTeam1 = mapping ? getTeamByCode(mapping.team1, match.matchNumber) : null;
        const predictedTeam2 = mapping ? getTeamByCode(mapping.team2, match.matchNumber) : null;
        
        return {
          match,
          prediction: simulatedResults.get(match.id),
          team1: predictedTeam1 || match.team1,
          team2: predictedTeam2 || match.team2,
        };
      });

    // Build R32 winners map
    const r32Winners = new Map<number, Team | null>();
    r32.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      r32Winners.set(m.match.matchNumber, winner);
    });

    // R16 matches
    const r16Mapping: Record<number, [number, number]> = {
      89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
      93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
    };

    const r16 = allMatches
      .filter(m => m.stage === 'R16')
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map(match => {
        const sources = r16Mapping[match.matchNumber];
        const team1 = sources ? r32Winners.get(sources[0]) : match.team1;
        const team2 = sources ? r32Winners.get(sources[1]) : match.team2;
        
        return {
          match,
          prediction: simulatedResults.get(match.id),
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
      97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
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
          prediction: simulatedResults.get(match.id),
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
      101: [97, 98], 102: [99, 100],
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
          prediction: simulatedResults.get(match.id),
          team1: team1 || match.team1,
          team2: team2 || match.team2,
        };
      });

    // Build SF winners and losers
    const sfWinners = new Map<number, Team | null>();
    const sfLosers = new Map<number, Team | null>();
    sf.forEach(m => {
      const winner = getMatchWinner(m.match.id, m.team1, m.team2);
      sfWinners.set(m.match.matchNumber, winner);
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
        prediction: simulatedResults.get(thirdMatch.id),
        team1: thirdTeam1 || thirdMatch.team1,
        team2: thirdTeam2 || thirdMatch.team2,
      } : null,
      final: final ? {
        match: final,
        prediction: simulatedResults.get(final.id),
        team1: finalTeam1 || final.team1,
        team2: finalTeam2 || final.team2,
      } : null,
    };
  }, [allMatches, simulatedResults, getTeamByCode, getMatchWinner]);

  // Handle result changes
  const handleResultChange = useCallback((matchId: string, scoreA: number, scoreB: number) => {
    setSimulatedResults(prev => {
      const newMap = new Map(prev);
      newMap.set(matchId, { matchId, predScoreA: scoreA, predScoreB: scoreB });
      return newMap;
    });
  }, []);

  // Handle winner selection (for tied knockout matches)
  const handleWinnerSelect = useCallback((matchId: string, winnerId: string) => {
    setWinnerSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(matchId, winnerId);
      return newMap;
    });
  }, []);

  // Fill with random results
  const fillRandomResults = useCallback(() => {
    if (!allMatches) return;
    
    const newResults = new Map(simulatedResults);
    
    allMatches.forEach(match => {
      const scoreA = Math.floor(Math.random() * 5);
      const scoreB = Math.floor(Math.random() * 5);
      newResults.set(match.id, { matchId: match.id, predScoreA: scoreA, predScoreB: scoreB });
    });
    
    setSimulatedResults(newResults);
  }, [allMatches, simulatedResults]);

  // Clear all results
  const clearResults = useCallback(() => {
    setSimulatedResults(new Map());
    setWinnerSelections(new Map());
    setTopScorerName('');
  }, []);

  // Loading state
  if (!isLoaded || isLoadingSimulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-violet-300">טוען...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (standingsError || matchesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-red-300">שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" dir="rtl">
      <Header />

      <div className="flex">
        {/* Sidebar - Realtime Leaderboard */}
        <aside className={`${isSidebarCollapsed ? 'w-12' : 'w-80'} transition-all duration-300 flex-shrink-0`}>
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className={`h-full bg-slate-900/80 backdrop-blur-md border-l border-white/10 flex flex-col ${isSidebarCollapsed ? 'items-center py-4' : 'p-4'}`}>
              {/* Collapse Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="mb-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-violet-300"
                title={isSidebarCollapsed ? 'פתח טבלה' : 'סגור טבלה'}
              >
                {isSidebarCollapsed ? '◀' : '▶'}
              </button>

              {!isSidebarCollapsed && (
                <>
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      🏆 טבלת דירוג
                      <span className="text-xs font-normal text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded">
                        LIVE
                      </span>
                    </h2>
                    <p className="text-xs text-violet-400 mt-1">
                      מתעדכנת בזמן אמת עם כל שינוי
                    </p>
                  </div>

                  {/* Loading state */}
                  {isLoadingPredictions && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-violet-300 text-sm">טוען ניבויים...</p>
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {predictionsError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                      שגיאה בטעינת הניבויים
                    </div>
                  )}

                  {/* No league selected */}
                  {!leagueId && !isLoadingPredictions && (
                    <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                      אנא בחר ליגה כדי לראות את טבלת הדירוג
                    </div>
                  )}

                  {/* Empty state */}
                  {leaguePredictions && simulatedResults.size === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-violet-400">
                        <p className="text-4xl mb-2">📝</p>
                        <p className="text-sm">מלא תוצאות כדי לראות<br />את טבלת הדירוג</p>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard table */}
                  {realtimeLeaderboard.length > 0 && (
                    <div className="flex-1 overflow-y-auto -mx-4 px-4">
                      <div className="space-y-1">
                        {realtimeLeaderboard.map((entry, idx) => (
                          <div
                            key={entry.formId}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                              idx === 0 
                                ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30' 
                                : idx === 1
                                ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border border-slate-400/30'
                                : idx === 2
                                ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border border-amber-600/30'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {/* Rank */}
                            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                              idx === 0 
                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
                                : idx === 1
                                ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800'
                                : idx === 2
                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                : 'bg-white/10 text-violet-300'
                            }`}>
                              {idx + 1}
                            </div>

                            {/* Name & Stats */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">
                                {entry.nickname}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-violet-400">
                                <span title="פגיעות מדויקות">🎯 {entry.exactResults}</span>
                                <span title="הכרעות נכונות">✓ {entry.correctDecisions}</span>
                              </div>
                            </div>

                            {/* Points */}
                            <div className="text-left">
                              <div className="text-lg font-bold text-emerald-400">
                                {entry.totalPoints}
                              </div>
                              <div className="text-xs text-violet-400">נק׳</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Stats summary */}
                      <div className="mt-4 pt-4 border-t border-white/10 text-xs text-violet-400">
                        <div className="flex justify-between">
                          <span>משתתפים:</span>
                          <span className="text-white">{realtimeLeaderboard.length}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>תוצאות שהוזנו:</span>
                          <span className="text-white">{simulatedResults.size} / {allMatches?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 max-w-[1400px]">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl md:text-4xl">🔮</span>
                   תוצאות אמת
                </h1>
                <p className="text-violet-300 mt-1">
                  מלא תוצאות וראה איך הדירוג משתנה בזמן אמת!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Save status indicator */}
                <div className="flex items-center gap-2 text-xs">
                  {isSaving ? (
                    <span className="text-violet-400 flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-400 border-t-transparent"></div>
                      שומר...
                    </span>
                  ) : lastSaved ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      ✓ נשמר {new Date().getTime() - lastSaved.getTime() < 10000 ? 'כעת' : 'ב-' + lastSaved.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={saveSimulation}
                  disabled={isSaving || simulatedResults.size === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm
                             hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors flex items-center gap-2"
                >
                  💾 שמור עכשיו
                </button>
                <button
                  onClick={clearResults}
                  disabled={simulatedResults.size === 0}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium text-sm
                             hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors flex items-center gap-2"
                >
                  🗑️ נקה הכל
                </button>
                <button
                  onClick={fillRandomResults}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium text-sm
                             hover:bg-violet-500 transition-colors flex items-center gap-2
                             shadow-lg shadow-violet-600/30"
                >
                  🎲 מלא רנדומלי
                </button>
              </div>
            </div>

            {/* Top Scorer Input */}
            <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-md">
              <label className="text-violet-200 text-sm whitespace-nowrap">⚽ מלך שערים:</label>
              <input
                type="text"
                value={topScorerName}
                onChange={(e) => setTopScorerName(e.target.value)}
                placeholder="שם השחקן"
                className="flex-1 px-3 py-1.5 bg-white/20 border border-white/30 rounded text-white 
                           placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Stats Counter */}
          <div className="mb-6 flex items-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-violet-200">
              📝 תוצאות שהוזנו: <span className="font-bold text-white">{simulatedResults.size}</span>
              {allMatches && (
                <span className="text-violet-400"> / {allMatches.length}</span>
              )}
            </div>
            {realtimeLeaderboard.length > 0 && (
              <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg px-4 py-2 text-emerald-300">
                🏆 מוביל: <span className="font-bold text-white">{realtimeLeaderboard[0]?.nickname}</span>
                <span className="text-emerald-400"> ({realtimeLeaderboard[0]?.totalPoints} נק׳)</span>
              </div>
            )}
          </div>

          {/* Group Stage - with dark theme wrapper */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-8 border border-white/10">
            <GroupStage
              groups={groups}
              onPredictionChange={handleResultChange}
              isLocked={false}
            />
          </div>

          {/* Knockout Stages - with dark theme wrapper */}
          <section className="mt-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🏅</span>
                שלבי הנוקאאוט
                <span className="text-sm font-normal text-violet-300">
                  (הקבוצות יתעדכנו לפי התוצאות שמילאת בשלב הבתים)
                </span>
              </h2>
              
              <KnockoutBracket
                r32Matches={knockoutMatches.r32}
                r16Matches={knockoutMatches.r16}
                qfMatches={knockoutMatches.qf}
                sfMatches={knockoutMatches.sf}
                thirdMatch={knockoutMatches.third}
                finalMatch={knockoutMatches.final}
                onPredictionChange={handleResultChange}
                onWinnerSelect={handleWinnerSelect}
                isLocked={false}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
