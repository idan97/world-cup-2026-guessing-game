'use client';

import { useState, useEffect } from 'react';
import type { MatchDisplay } from '../types';

interface KnockoutMatchProps {
  matchDisplay: MatchDisplay | null;
  matchNumber: number;
  team1Placeholder?: string;
  team2Placeholder?: string;
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  onWinnerSelect?: (matchId: string, winnerId: string) => void;
  isLocked?: boolean;
  compact?: boolean;
  showMatchNumber?: boolean;
  highlightColor?: string;
}

export default function KnockoutMatch({
  matchDisplay,
  matchNumber,
  team1Placeholder = 'TBD',
  team2Placeholder = 'TBD',
  onPredictionChange,
  onWinnerSelect,
  isLocked = false,
  compact = false,
  showMatchNumber = true,
  highlightColor = 'emerald',
}: KnockoutMatchProps) {
  const match = matchDisplay?.match;
  const prediction = matchDisplay?.prediction;
  const team1 = matchDisplay?.team1;
  const team2 = matchDisplay?.team2;

  const [scoreA, setScoreA] = useState<string | number>(
    prediction?.predScoreA ?? '-',
  );
  const [scoreB, setScoreB] = useState<string | number>(
    prediction?.predScoreB ?? '-',
  );
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  useEffect(() => {
    if (prediction) {
      setScoreA(prediction.predScoreA);
      setScoreB(prediction.predScoreB);
    }
  }, [prediction]);

  const handleScoreChange = (team: 'A' | 'B', value: string) => {
    if (!match) {
      return;
    }
    const numValue =
      value === '' || value === '-' ? '-' : Math.max(0, parseInt(value) || 0);
    if (team === 'A') {
      setScoreA(numValue);
      if (typeof numValue === 'number') {
        onPredictionChange(
          match.id,
          numValue,
          typeof scoreB === 'number' ? scoreB : 0,
        );
      }
    } else {
      setScoreB(numValue);
      if (typeof numValue === 'number') {
        onPredictionChange(
          match.id,
          typeof scoreA === 'number' ? scoreA : 0,
          numValue,
        );
      }
    }
    // Reset winner selection when scores change
    setSelectedWinner(null);
  };

  const handleWinnerSelect = (winnerId: string) => {
    if (!match || !onWinnerSelect) {
      return;
    }
    setSelectedWinner(winnerId);
    onWinnerSelect(match.id, winnerId);
  };

  const team1Name =
    team1?.nameHebrew || team1?.name || match?.team1Name || team1Placeholder;
  const team2Name =
    team2?.nameHebrew || team2?.name || match?.team2Name || team2Placeholder;

  // Helper to convert score to number for comparisons
  const scoreANum = typeof scoreA === 'number' ? scoreA : 0;
  const scoreBNum = typeof scoreB === 'number' ? scoreB : 0;
  const isTied = scoreANum === scoreBNum && scoreANum > 0;
  const hasTeams = team1 && team2;

  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-700 focus:ring-emerald-500',
    blue: 'from-blue-600 to-blue-700 focus:ring-blue-500',
    purple: 'from-purple-600 to-purple-700 focus:ring-purple-500',
    amber: 'from-amber-600 to-amber-700 focus:ring-amber-500',
    rose: 'from-rose-600 to-rose-700 focus:ring-rose-500',
    yellow: 'from-yellow-500 to-yellow-600 focus:ring-yellow-500',
  };

  const headerGradient = colorClasses[highlightColor] || colorClasses.emerald;

  if (compact) {
    return (
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-w-[160px]">
        {showMatchNumber && (
          <div
            className={`bg-gradient-to-r ${headerGradient} text-white px-2 py-0.5 text-[10px] font-medium text-center`}
          >
            משחק {matchNumber}
          </div>
        )}
        <div className="p-1.5 space-y-1">
          {/* Team 1 */}
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[10px] truncate flex-1 ${
                !isTied && scoreANum > scoreBNum
                  ? 'font-bold text-emerald-700'
                  : 'text-slate-700'
              }`}
              title={team1Name}
            >
              {team1Name}
            </span>
            <input
              type="number"
              min="0"
              max="20"
              value={scoreA}
              onChange={(e) => handleScoreChange('A', e.target.value)}
              disabled={isLocked || !hasTeams}
              className="w-6 h-5 text-center border border-slate-300 rounded text-[10px] font-bold 
                         focus:outline-none focus:ring-1 disabled:bg-slate-100"
            />
          </div>
          {/* Team 2 */}
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[10px] truncate flex-1 ${
                !isTied && scoreBNum > scoreANum
                  ? 'font-bold text-emerald-700'
                  : 'text-slate-700'
              }`}
              title={team2Name}
            >
              {team2Name}
            </span>
            <input
              type="number"
              min="0"
              max="20"
              value={scoreB}
              onChange={(e) => handleScoreChange('B', e.target.value)}
              disabled={isLocked || !hasTeams}
              className="w-6 h-5 text-center border border-slate-300 rounded text-[10px] font-bold 
                         focus:outline-none focus:ring-1 disabled:bg-slate-100"
            />
          </div>
          {/* Penalty winner selection */}
          {isTied && hasTeams && scoreANum > 0 && scoreBNum > 0 && (
            <div className="pt-1 border-t border-slate-100">
              <div className="text-[9px] text-slate-500 mb-0.5">
                מנצח פנדלים:
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleWinnerSelect(team1!.id)}
                  disabled={isLocked}
                  className={`flex-1 text-[9px] py-0.5 rounded border ${
                    selectedWinner === team1?.id
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {team1?.nameHebrew?.slice(0, 5) || team1?.name?.slice(0, 5)}
                </button>
                <button
                  onClick={() => handleWinnerSelect(team2!.id)}
                  disabled={isLocked}
                  className={`flex-1 text-[9px] py-0.5 rounded border ${
                    selectedWinner === team2?.id
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {team2?.nameHebrew?.slice(0, 5) || team2?.name?.slice(0, 5)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full size match card
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-w-[200px]">
      {showMatchNumber && (
        <div
          className={`bg-gradient-to-r ${headerGradient} text-white px-3 py-1 text-xs font-medium text-center`}
        >
          משחק {matchNumber}
        </div>
      )}
      <div className="p-3 space-y-2">
        {/* Team 1 */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate flex-1 ${
              !isTied && scoreANum > scoreBNum
                ? 'font-bold text-emerald-700'
                : 'text-slate-700'
            }`}
            title={team1Name}
          >
            {team1Name}
          </span>
          <input
            type="number"
            min="0"
            max="20"
            value={scoreA}
            onChange={(e) => handleScoreChange('A', e.target.value)}
            disabled={isLocked || !hasTeams}
            className="w-10 h-7 text-center border border-slate-300 rounded text-sm font-bold 
                       focus:outline-none focus:ring-1 disabled:bg-slate-100"
          />
        </div>
        {/* Team 2 */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate flex-1 ${
              !isTied && scoreBNum > scoreANum
                ? 'font-bold text-emerald-700'
                : 'text-slate-700'
            }`}
            title={team2Name}
          >
            {team2Name}
          </span>
          <input
            type="number"
            min="0"
            max="20"
            value={scoreB}
            onChange={(e) => handleScoreChange('B', e.target.value)}
            disabled={isLocked || !hasTeams}
            className="w-10 h-7 text-center border border-slate-300 rounded text-sm font-bold 
                       focus:outline-none focus:ring-1 disabled:bg-slate-100"
          />
        </div>
        {/* Penalty winner selection */}
        {isTied && hasTeams && (scoreANum > 0 || scoreBNum > 0) && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-1">בחר מנצח בפנדלים:</div>
            <div className="flex gap-2">
              <button
                onClick={() => handleWinnerSelect(team1!.id)}
                disabled={isLocked}
                className={`flex-1 text-xs py-1 rounded border ${
                  selectedWinner === team1?.id
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {team1?.nameHebrew || team1?.name}
              </button>
              <button
                onClick={() => handleWinnerSelect(team2!.id)}
                disabled={isLocked}
                className={`flex-1 text-xs py-1 rounded border ${
                  selectedWinner === team2?.id
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {team2?.nameHebrew || team2?.name}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
