'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';
import type {
  Team,
  Match,
  Round,
  BracketSide,
  BracketData,
  WorldCupBracketProps,
  RoundInfo,
} from '@/lib/bracket-types';

const ROUND_INFO: Record<Round, RoundInfo> = {
  round32: {
    name: 'round32',
    displayName: 'Round of 32',
    matchCount: 16,
    teamsPerSide: 16,
  },
  round16: {
    name: 'round16',
    displayName: 'Round of 16',
    matchCount: 8,
    teamsPerSide: 8,
  },
  quarterfinals: {
    name: 'quarterfinals',
    displayName: 'Quarterfinals',
    matchCount: 4,
    teamsPerSide: 4,
  },
  semifinals: {
    name: 'semifinals',
    displayName: 'Semifinals',
    matchCount: 2,
    teamsPerSide: 2,
  },
  final: {
    name: 'final',
    displayName: 'Final',
    matchCount: 1,
    teamsPerSide: 1,
  },
  thirdPlace: {
    name: 'thirdPlace',
    displayName: 'Third Place',
    matchCount: 1,
    teamsPerSide: 1,
  },
};

const generateDefaultTeams = (): Team[] => {
  const countries = [
    'Brazil',
    'Argentina',
    'France',
    'England',
    'Spain',
    'Germany',
    'Netherlands',
    'Portugal',
    'Italy',
    'Belgium',
    'Croatia',
    'Morocco',
    'Japan',
    'South Korea',
    'Mexico',
    'USA',
    'Canada',
    'Australia',
    'Denmark',
    'Switzerland',
    'Poland',
    'Sweden',
    'Ukraine',
    'Serbia',
    'Ghana',
    'Senegal',
    'Tunisia',
    'Ecuador',
    'Uruguay',
    'Colombia',
    'Peru',
    'Chile',
  ];

  return countries.map((country, index) => ({
    id: `team-${index + 1}`,
    name: country,
    country,
  }));
};

const createInitialBracketData = (teams: Team[]): BracketData => {
  const matches: Record<string, Match> = {};

  // Create Round of 32 matches for left side (first 16 teams)
  for (let i = 0; i < 8; i++) {
    const matchId = `left-round32-${i}`;
    matches[matchId] = {
      id: matchId,
      team1: teams[i * 2] || null,
      team2: teams[i * 2 + 1] || null,
      score1: 0,
      score2: 0,
      winner: null,
      round: 'round32',
      position: i,
      side: 'left',
    };
  }

  // Create Round of 32 matches for right side (last 16 teams)
  for (let i = 0; i < 8; i++) {
    const matchId = `right-round32-${i}`;
    matches[matchId] = {
      id: matchId,
      team1: teams[16 + i * 2] || null,
      team2: teams[16 + i * 2 + 1] || null,
      score1: 0,
      score2: 0,
      winner: null,
      round: 'round32',
      position: i,
      side: 'right',
    };
  }

  // Create empty matches for subsequent rounds
  const sides: BracketSide[] = ['left', 'right'];
  const rounds: Round[] = ['round16', 'quarterfinals', 'semifinals'];

  sides.forEach((side) => {
    rounds.forEach((round) => {
      const matchCount = ROUND_INFO[round].teamsPerSide / 2;
      for (let i = 0; i < matchCount; i++) {
        const matchId = `${side}-${round}-${i}`;
        matches[matchId] = {
          id: matchId,
          team1: null,
          team2: null,
          score1: 0,
          score2: 0,
          winner: null,
          round,
          position: i,
          side,
        };
      }
    });
  });

  // Create center matches (Final and Third Place)
  matches['center-final-0'] = {
    id: 'center-final-0',
    team1: null,
    team2: null,
    score1: 0,
    score2: 0,
    winner: null,
    round: 'final',
    position: 0,
    side: 'center',
  };

  matches['center-thirdPlace-0'] = {
    id: 'center-thirdPlace-0',
    team1: null,
    team2: null,
    score1: 0,
    score2: 0,
    winner: null,
    round: 'thirdPlace',
    position: 0,
    side: 'center',
  };

  return {
    matches,
    teams,
    champion: null,
    thirdPlaceWinner: null,
  };
};

export default function WorldCupKnockoutBracket({
  initialBracketData,
  onChange,
  className = '',
}: WorldCupBracketProps) {
  const [bracketData, setBracketData] = useState<BracketData>(() => {
    if (initialBracketData) {return initialBracketData;}
    const defaultTeams = generateDefaultTeams();
    return createInitialBracketData(defaultTeams);
  });

  const updateMatch = useCallback(
    (matchId: string, updates: Partial<Match>) => {
      setBracketData((prev) => {
        const newBracketData = {
          ...prev,
          matches: {
            ...prev.matches,
            [matchId]: { ...prev.matches[matchId], ...updates },
          },
        };

        const match = newBracketData.matches[matchId];

        // Determine winner based on scores or manual selection
        let winner: Team | null = null;
        if (match.score1 > match.score2) {
          winner = match.team1;
        } else if (match.score2 > match.score1) {
          winner = match.team2;
        } else if (updates.winner) {
          winner = updates.winner;
        }

        newBracketData.matches[matchId].winner = winner;

        // Handle advancement and special cases
        if (winner) {
          if (match.round === 'final') {
            newBracketData.champion = winner;
          } else if (match.round === 'thirdPlace') {
            newBracketData.thirdPlaceWinner = winner;
          } else {
            advanceWinner(newBracketData, match, winner);
          }

          // Handle semifinals: advance loser to third place
          if (match.round === 'semifinals') {
            const loser = winner === match.team1 ? match.team2 : match.team1;
            if (loser) {
              advanceLoserToThirdPlace(newBracketData, match.side, loser);
            }
          }
        }

        return newBracketData;
      });
    },
    [],
  );

  const advanceWinner = (
    bracketData: BracketData,
    match: Match,
    winner: Team,
  ) => {
    const nextRoundMap: Record<Round, Round> = {
      round32: 'round16',
      round16: 'quarterfinals',
      quarterfinals: 'semifinals',
      semifinals: 'final',
      final: 'final',
      thirdPlace: 'thirdPlace',
    };

    const nextRound = nextRoundMap[match.round];
    if (nextRound === match.round) {return;}

    let nextMatchId: string;
    let teamSlot: 'team1' | 'team2';

    if (nextRound === 'final') {
      nextMatchId = 'center-final-0';
      teamSlot = match.side === 'left' ? 'team1' : 'team2';
    } else {
      const nextMatchPosition = Math.floor(match.position / 2);
      nextMatchId = `${match.side}-${nextRound}-${nextMatchPosition}`;
      teamSlot = match.position % 2 === 0 ? 'team1' : 'team2';
    }

    const nextMatch = bracketData.matches[nextMatchId];
    if (nextMatch) {
      nextMatch[teamSlot] = winner;
      nextMatch.score1 = 0;
      nextMatch.score2 = 0;
      nextMatch.winner = null;
    }
  };

  const advanceLoserToThirdPlace = (
    bracketData: BracketData,
    side: BracketSide,
    loser: Team,
  ) => {
    const thirdPlaceMatch = bracketData.matches['center-thirdPlace-0'];
    if (thirdPlaceMatch) {
      const teamSlot = side === 'left' ? 'team1' : 'team2';
      thirdPlaceMatch[teamSlot] = loser;
      thirdPlaceMatch.score1 = 0;
      thirdPlaceMatch.score2 = 0;
      thirdPlaceMatch.winner = null;
    }
  };

  useEffect(() => {
    onChange?.(bracketData);
  }, [bracketData, onChange]);

  const renderMatch = (match: Match) => {
    const isTied =
      match.score1 === match.score2 && (match.score1 > 0 || match.score2 > 0);
    const hasTeams = match.team1 && match.team2;
    const isSpecialMatch =
      match.round === 'final' || match.round === 'thirdPlace';

    return (
      <Card
        key={match.id}
        className={`bg-white border-2 ${
          isSpecialMatch ? 'border-amber-300 shadow-md' : 'border-gray-300'
        } hover:border-gray-400 transition-all duration-200 w-full shadow-sm`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Team 1 */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-gray-700 text-sm font-medium flex-1 truncate">
                {match.team1?.name || ''}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={match.score1}
                  onChange={(e) =>
                    updateMatch(match.id, {
                      score1: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-center border-gray-300 w-14 h-8 text-base"
                  disabled={!hasTeams}
                />
                {isTied && hasTeams && (
                  <RadioGroup
                    value={match.winner?.id || ''}
                    onValueChange={(value) => {
                      const winner =
                        value === match.team1?.id ? match.team1 : match.team2;
                      updateMatch(match.id, { winner });
                    }}
                    className="flex"
                  >
                    <RadioGroupItem
                      value={match.team1?.id || ''}
                      id={`${match.id}-team1`}
                    />
                  </RadioGroup>
                )}
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-gray-700 text-sm font-medium flex-1 truncate">
                {match.team2?.name || ''}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={match.score2}
                  onChange={(e) =>
                    updateMatch(match.id, {
                      score2: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-center border-gray-300 w-14 h-8 text-base"
                  disabled={!hasTeams}
                />
                {isTied && hasTeams && (
                  <RadioGroup
                    value={match.winner?.id || ''}
                    onValueChange={(value) => {
                      const winner =
                        value === match.team2?.id ? match.team2 : match.team1;
                      updateMatch(match.id, { winner });
                    }}
                    className="flex"
                  >
                    <RadioGroupItem
                      value={match.team2?.id || ''}
                      id={`${match.id}-team2`}
                    />
                  </RadioGroup>
                )}
              </div>
            </div>

            {/* Winner indicator */}
            {match.winner && (
              <div className="pt-1 text-center">
                <Badge
                  variant="default"
                  className={`text-white ${isSpecialMatch ? 'bg-amber-600' : 'bg-slate-600'} text-xs px-2 py-1`}
                >
                  {match.winner.name}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Get matches for a specific round and side
  const getMatchesForRound = (round: Round, side: BracketSide) => {
    return Object.values(bracketData.matches)
      .filter((match) => match.round === round && match.side === side)
      .sort((a, b) => a.position - b.position);
  };

  // Render the center column with Final and Third Place matches
  const renderCenterColumn = () => {
    const finalMatch = bracketData.matches['center-final-0'];
    const thirdPlaceMatch = bracketData.matches['center-thirdPlace-0'];

    return (
      <div className="flex flex-col gap-8 items-center mt-32">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-gray-800">FINAL</h3>
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div className="w-[200px]">{renderMatch(finalMatch)}</div>
          {bracketData.champion && (
            <Badge className="bg-amber-500 text-white mt-2 px-2 py-1">
              🏆 Champion: {bracketData.champion.name}
            </Badge>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Medal className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-gray-800">THIRD PLACE</h3>
            <Medal className="w-4 h-4 text-orange-600" />
          </div>
          <div className="w-[200px]">{renderMatch(thirdPlaceMatch)}</div>
          {bracketData.thirdPlaceWinner && (
            <Badge className="bg-orange-500 text-white mt-2 px-2 py-1">
              🥉 Third: {bracketData.thirdPlaceWinner.name}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Calculate the gap between matches for each round to create the bracket effect
  const getGapForRound = (round: Round): string => {
    switch (round) {
      case 'round32':
        return 'gap-1';
      case 'round16':
        return 'gap-4';
      case 'quarterfinals':
        return 'gap-16';
      case 'semifinals':
        return 'gap-40';
      default:
        return 'gap-2';
    }
  };

  // Get the top margin for cone effect
  const getTopMarginForRound = (round: Round): string => {
    switch (round) {
      case 'round32':
        return 'mt-0';
      case 'round16':
        return 'mt-8';
      case 'quarterfinals':
        return 'mt-20';
      case 'semifinals':
        return 'mt-32';
      default:
        return 'mt-0';
    }
  };

  // Render a single round column
  const renderRoundColumn = (round: Round, side: BracketSide) => {
    const matches = getMatchesForRound(round, side);
    const gapClass = getGapForRound(round);
    const marginClass = getTopMarginForRound(round);

    return (
      <div className={`flex flex-col items-center ${marginClass}`}>
        <h4 className="text-xs font-bold text-gray-700 mb-3 bg-gray-100 px-2 py-1 rounded">
          {ROUND_INFO[round].displayName}
        </h4>
        <div className={`flex flex-col ${gapClass} w-[200px]`}>
          {matches.map((match) => (
            <div key={match.id} className="w-full">
              {renderMatch(match)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`w-full bg-white border border-gray-200 shadow-sm p-8 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          FIFA World Cup 2026
        </h1>
        <h2 className="text-xl font-semibold text-gray-600">Knockout Stage</h2>
      </div>

      {/* Main bracket layout */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[1800px] flex justify-center px-12">
          <div className="flex items-start gap-10">
            {/* Left bracket rounds - from outside to inside */}
            <div className="flex gap-10">
              {renderRoundColumn('round32', 'left')}
              {renderRoundColumn('round16', 'left')}
              {renderRoundColumn('quarterfinals', 'left')}
              {renderRoundColumn('semifinals', 'left')}
            </div>

            {/* Center column */}
            <div className="mx-6">{renderCenterColumn()}</div>

            {/* Right bracket rounds - from inside to outside */}
            <div className="flex gap-10">
              {renderRoundColumn('semifinals', 'right')}
              {renderRoundColumn('quarterfinals', 'right')}
              {renderRoundColumn('round16', 'right')}
              {renderRoundColumn('round32', 'right')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
