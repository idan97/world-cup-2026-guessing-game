'use client';

import KnockoutMatch from './KnockoutMatch';
import type { MatchDisplay } from '../types';
import { STAGE_CONFIG } from '../types';

interface KnockoutBracketProps {
  r32Matches: MatchDisplay[];
  r16Matches: MatchDisplay[];
  qfMatches: MatchDisplay[];
  sfMatches: MatchDisplay[];
  thirdMatch: MatchDisplay | null;
  finalMatch: MatchDisplay | null;
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  onWinnerSelect?: (matchId: string, winnerId: string) => void;
  isLocked?: boolean;
}

export default function KnockoutBracket({
  r32Matches,
  r16Matches,
  qfMatches,
  sfMatches,
  thirdMatch,
  finalMatch,
  onPredictionChange,
  onWinnerSelect,
  isLocked = false,
}: KnockoutBracketProps) {
  return (
    <section className="space-y-8">
      {/* Round of 32 */}
      <KnockoutRound
        title={STAGE_CONFIG.R32.name}
        matches={r32Matches}
        startMatchNumber={73}
        onPredictionChange={onPredictionChange}
        onWinnerSelect={onWinnerSelect}
        isLocked={isLocked}
        color="blue"
        columns={4}
      />

      {/* Round of 16 */}
      <KnockoutRound
        title={STAGE_CONFIG.R16.name}
        matches={r16Matches}
        startMatchNumber={89}
        onPredictionChange={onPredictionChange}
        onWinnerSelect={onWinnerSelect}
        isLocked={isLocked}
        color="purple"
        columns={4}
      />

      {/* Quarterfinals */}
      <KnockoutRound
        title={STAGE_CONFIG.QF.name}
        matches={qfMatches}
        startMatchNumber={97}
        onPredictionChange={onPredictionChange}
        onWinnerSelect={onWinnerSelect}
        isLocked={isLocked}
        color="amber"
        columns={4}
      />

      {/* Semifinals */}
      <KnockoutRound
        title={STAGE_CONFIG.SF.name}
        matches={sfMatches}
        startMatchNumber={101}
        onPredictionChange={onPredictionChange}
        onWinnerSelect={onWinnerSelect}
        isLocked={isLocked}
        color="rose"
        columns={2}
      />

      {/* Final & Third Place */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Third Place */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🥉</span>
            {STAGE_CONFIG.THIRD.name}
          </h3>
          <KnockoutMatch
            matchDisplay={thirdMatch}
            matchNumber={103}
            team1Placeholder="מפסיד חצי 1"
            team2Placeholder="מפסיד חצי 2"
            onPredictionChange={onPredictionChange}
            onWinnerSelect={onWinnerSelect}
            isLocked={isLocked}
            highlightColor="amber"
          />
        </div>

        {/* Final */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            {STAGE_CONFIG.F.name}
          </h3>
          <div className="relative">
            <KnockoutMatch
              matchDisplay={finalMatch}
              matchNumber={104}
              team1Placeholder="מנצח חצי 1"
              team2Placeholder="מנצח חצי 2"
              onPredictionChange={onPredictionChange}
              onWinnerSelect={onWinnerSelect}
              isLocked={isLocked}
              highlightColor="yellow"
            />
            {/* Champion indicator */}
            {finalMatch?.prediction && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  <span>🏆</span>
                  <span>אלוף העולם 2026</span>
                  <span>🏆</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface KnockoutRoundProps {
  title: string;
  matches: MatchDisplay[];
  startMatchNumber: number;
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  onWinnerSelect?: (matchId: string, winnerId: string) => void;
  isLocked?: boolean;
  color: string;
  columns: number;
}

function KnockoutRound({
  title,
  matches,
  startMatchNumber,
  onPredictionChange,
  onWinnerSelect,
  isLocked,
  color,
  columns,
}: KnockoutRoundProps) {
  const colorIcon: Record<string, string> = {
    blue: '🔵',
    purple: '🟣',
    amber: '🟠',
    rose: '🔴',
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
        <span className="text-xl">{colorIcon[color] || '⚽'}</span>
        {title}
        <span className="text-sm font-normal text-slate-500">
          ({matches.length} משחקים)
        </span>
      </h3>
      <div
        className={`grid gap-3 ${
          columns === 4
            ? 'grid-cols-2 md:grid-cols-4'
            : columns === 2
              ? 'grid-cols-1 md:grid-cols-2 max-w-2xl'
              : 'grid-cols-1 max-w-md'
        }`}
      >
        {matches.map((match, idx) => (
          <KnockoutMatch
            key={match.match?.id || `${title}-${idx}`}
            matchDisplay={match}
            matchNumber={startMatchNumber + idx}
            onPredictionChange={onPredictionChange}
            onWinnerSelect={onWinnerSelect}
            isLocked={isLocked}
            compact={columns === 4}
            highlightColor={color}
          />
        ))}
      </div>
    </div>
  );
}
