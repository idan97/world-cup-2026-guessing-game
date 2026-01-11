'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';
import type {
  Team,
  Match,
  Round,
  BracketState,
  MirroredBracketProps,
  RoundConfig,
} from './types';

const ROUND_CONFIGS: Record<Round, RoundConfig> = {
  round32: { name: 'round32', matches: 8, displayName: 'Round of 32' },
  round16: { name: 'round16', matches: 4, displayName: 'Round of 16' },
  quarterfinals: {
    name: 'quarterfinals',
    matches: 2,
    displayName: 'Quarterfinals',
  },
  semifinals: { name: 'semifinals', matches: 1, displayName: 'Semifinals' },
  thirdPlace: { name: 'thirdPlace', matches: 1, displayName: 'Third Place' },
  final: { name: 'final', matches: 1, displayName: 'Final' },
};

const DEFAULT_TEAMS: Team[] = Array.from({ length: 32 }, (_, i) => ({
  id: `team-${i + 1}`,
  name: `Team ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
}));

export default function MirroredWorldCupBracket({
  initialTeams = DEFAULT_TEAMS,
  onChange,
  className = '',
}: MirroredBracketProps) {
  const [bracketState, setBracketState] = useState<BracketState>(() => {
    const matches: Record<string, Match> = {};

    // Initialize left side (first 16 teams)
    const leftTeams = initialTeams.slice(0, 16);
    for (let i = 0; i < 8; i++) {
      const matchId = `left-round32-${i}`;
      matches[matchId] = {
        id: matchId,
        team1: leftTeams[i * 2] || null,
        team2: leftTeams[i * 2 + 1] || null,
        score1: 0,
        score2: 0,
        winner: null,
        round: 'round32',
        position: i,
        side: 'left',
      };
    }

    // Initialize right side (last 16 teams)
    const rightTeams = initialTeams.slice(16, 32);
    for (let i = 0; i < 8; i++) {
      const matchId = `right-round32-${i}`;
      matches[matchId] = {
        id: matchId,
        team1: rightTeams[i * 2] || null,
        team2: rightTeams[i * 2 + 1] || null,
        score1: 0,
        score2: 0,
        winner: null,
        round: 'round32',
        position: i,
        side: 'right',
      };
    }

    // Initialize other rounds
    const sides = ['left', 'right'] as const;
    const rounds: Round[] = ['round16', 'quarterfinals', 'semifinals'];

    sides.forEach((side) => {
      rounds.forEach((round) => {
        const matchCount = ROUND_CONFIGS[round].matches;
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

    // Initialize center matches
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
      teams: initialTeams,
      champion: null,
      thirdPlace: null,
    };
  });

  const updateMatch = useCallback(
    (matchId: string, updates: Partial<Match>) => {
      setBracketState((prev) => {
        const newState = {
          ...prev,
          matches: {
            ...prev.matches,
            [matchId]: { ...prev.matches[matchId], ...updates },
          },
        };

        const match = newState.matches[matchId];

        // Determine winner
        let winner: Team | null = null;
        if (match.score1 > match.score2) {
          winner = match.team1;
        } else if (match.score2 > match.score1) {
          winner = match.team2;
        } else if (updates.winner) {
          winner = updates.winner;
        }

        newState.matches[matchId].winner = winner;

        // Advance winner to next round
        if (winner) {
          if (match.round === 'final') {
            newState.champion = winner;
          } else if (match.round === 'thirdPlace') {
            newState.thirdPlace = winner;
          } else {
            advanceWinner(newState, match, winner);
          }

          // Handle semifinals losers for third place
          if (match.round === 'semifinals') {
            const loser = winner === match.team1 ? match.team2 : match.team1;
            if (loser) {
              advanceToThirdPlace(newState, match.side, loser);
            }
          }
        }

        return newState;
      });
    },
    [],
  );

  const advanceWinner = (state: BracketState, match: Match, winner: Team) => {
    const nextRoundMap: Record<Round, Round> = {
      round32: 'round16',
      round16: 'quarterfinals',
      quarterfinals: 'semifinals',
      semifinals: 'final',
      thirdPlace: 'final',
      final: 'final',
    };

    const nextRound = nextRoundMap[match.round];
    if (nextRound === 'final' && match.round === 'thirdPlace') {return;}

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

    const nextMatch = state.matches[nextMatchId];
    if (nextMatch) {
      nextMatch[teamSlot] = winner;
      nextMatch.score1 = 0;
      nextMatch.score2 = 0;
      nextMatch.winner = null;
    }
  };

  const advanceToThirdPlace = (
    state: BracketState,
    side: 'left' | 'right',
    loser: Team,
  ) => {
    const thirdPlaceMatch = state.matches['center-thirdPlace-0'];
    if (thirdPlaceMatch) {
      const teamSlot = side === 'left' ? 'team1' : 'team2';
      thirdPlaceMatch[teamSlot] = loser;
      thirdPlaceMatch.score1 = 0;
      thirdPlaceMatch.score2 = 0;
      thirdPlaceMatch.winner = null;
    }
  };

  useEffect(() => {
    onChange?.(bracketState);
  }, [bracketState, onChange]);

  const renderMatch = (match: Match, compact = false) => {
    const isTied =
      match.score1 === match.score2 && (match.score1 > 0 || match.score2 > 0);
    const hasTeams = match.team1 && match.team2;

    return (
      <Card
        key={match.id}
        className={`bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 hover:border-blue-300 transition-colors ${
          compact ? 'min-w-[240px]' : 'min-w-[280px]'
        }`}
      >
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          <div className="space-y-2">
            {/* Team 1 vs Team 2 header */}
            <div className="text-center">
              <Label className="text-xs font-semibold text-blue-800">
                {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
              </Label>
            </div>

            {/* Score inputs */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <Label className="text-xs text-blue-700">
                  {match.team1?.name || 'TBD'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={match.score1}
                  onChange={(e) =>
                    updateMatch(match.id, {
                      score1: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-12 h-8 text-center border-blue-300 text-sm"
                  disabled={!hasTeams}
                />
              </div>
              <div className="text-blue-600 font-bold">-</div>
              <div className="flex flex-col items-center gap-1">
                <Label className="text-xs text-blue-700">
                  {match.team2?.name || 'TBD'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={match.score2}
                  onChange={(e) =>
                    updateMatch(match.id, {
                      score2: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-12 h-8 text-center border-blue-300 text-sm"
                  disabled={!hasTeams}
                />
              </div>
            </div>

            {/* Tie breaker */}
            {isTied && hasTeams && (
              <div className="pt-2 border-t border-blue-200">
                <Label className="text-xs text-blue-700 mb-1 block text-center">
                  Winner:
                </Label>
                <RadioGroup
                  value={match.winner?.id || ''}
                  onValueChange={(value) => {
                    const winner =
                      value === match.team1?.id ? match.team1 : match.team2;
                    updateMatch(match.id, { winner });
                  }}
                  className="flex justify-center gap-3"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={match.team1?.id || ''}
                      id={`${match.id}-team1`}
                    />
                    <Label htmlFor={`${match.id}-team1`} className="text-xs">
                      {match.team1?.name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={match.team2?.id || ''}
                      id={`${match.id}-team2`}
                    />
                    <Label htmlFor={`${match.id}-team2`} className="text-xs">
                      {match.team2?.name}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Winner indicator */}
            {match.winner && (
              <div className="pt-1 text-center">
                <Badge
                  variant="default"
                  className="bg-green-600 text-white text-xs"
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

  const renderSideRounds = (side: 'left' | 'right') => {
    const rounds: Round[] = [
      'round32',
      'round16',
      'quarterfinals',
      'semifinals',
    ];

    return (
      <div className="flex flex-col gap-8">
        {rounds.map((round) => {
          const roundMatches = Object.values(bracketState.matches)
            .filter((match) => match.round === round && match.side === side)
            .sort((a, b) => a.position - b.position);

          return (
            <div
              key={`${side}-${round}`}
              className="flex flex-col items-center gap-4"
            >
              <h4 className="text-sm font-bold text-blue-900 text-center">
                {ROUND_CONFIGS[round].displayName}
              </h4>
              <div className="flex flex-col gap-3">
                {roundMatches.map((match) => renderMatch(match, true))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCenterColumn = () => {
    const finalMatch = bracketState.matches['center-final-0'];
    const thirdPlaceMatch = bracketState.matches['center-thirdPlace-0'];

    return (
      <div className="flex flex-col items-center gap-8">
        {/* Final */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-blue-900">FINAL</h3>
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          {renderMatch(finalMatch)}
          {bracketState.champion && (
            <div className="flex items-center gap-2 mt-2">
              <Crown className="w-8 h-8 text-yellow-500" />
              <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
                CHAMPION: {bracketState.champion.name}
              </Badge>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Third Place */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-bold text-blue-900">THIRD PLACE</h4>
            <Medal className="w-5 h-5 text-orange-600" />
          </div>
          {renderMatch(thirdPlaceMatch)}
          {bracketState.thirdPlace && (
            <Badge className="bg-orange-500 text-white px-3 py-1">
              3rd Place: {bracketState.thirdPlace.name}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`w-full bg-gradient-to-br from-blue-100 to-green-100 p-6 rounded-lg ${className}`}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          FIFA World Cup 2026 - Knockout Stage
        </h1>
        <p className="text-blue-700">Mirrored Tournament Bracket</p>
      </div>

      <div className="grid grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Left Bracket */}
        <div className="flex flex-col items-end">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Left Bracket</h2>
          {renderSideRounds('left')}
        </div>

        {/* Center Column */}
        <div className="flex flex-col justify-center">
          {renderCenterColumn()}
        </div>

        {/* Right Bracket */}
        <div className="flex flex-col items-start">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            Right Bracket
          </h2>
          {renderSideRounds('right')}
        </div>
      </div>
    </div>
  );
}
