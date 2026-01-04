'use client';

import { useState, useEffect } from 'react';
import type { GroupDisplay, MatchDisplay, MatchPrediction } from '../types';

interface GroupCardProps {
  group: GroupDisplay;
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  isLocked?: boolean;
}

// Color scheme for each group
const GROUP_COLORS: Record<string, string> = {
  A: 'from-emerald-600 to-emerald-700',
  B: 'from-blue-600 to-blue-700',
  C: 'from-violet-600 to-violet-700',
  D: 'from-rose-600 to-rose-700',
  E: 'from-amber-600 to-amber-700',
  F: 'from-cyan-600 to-cyan-700',
  G: 'from-emerald-600 to-emerald-700',
  H: 'from-blue-600 to-blue-700',
  I: 'from-violet-600 to-violet-700',
  J: 'from-rose-600 to-rose-700',
  K: 'from-amber-600 to-amber-700',
  L: 'from-cyan-600 to-cyan-700',
};

export default function GroupCard({ group, onPredictionChange, isLocked = false }: GroupCardProps) {
  const [expanded, setExpanded] = useState(true);

  // Group matches by round (each team plays 3 matches)
  const sortedMatches = [...group.matches].sort((a, b) => a.match.matchNumber - b.match.matchNumber);

  const headerColor = GROUP_COLORS[group.letter] || 'from-slate-600 to-slate-700';

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Group Header */}
      <div 
        className={`bg-gradient-to-r ${headerColor} text-white px-3 py-2 font-bold text-sm flex items-center justify-between cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2">
          <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs">בית</span>
          <span className="text-lg">{group.letter}</span>
        </span>
        <span className="text-xs opacity-80 transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▼
        </span>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-500 uppercase text-[10px]">
              <th className="px-1.5 py-1.5 text-center w-5"></th>
              <th className="px-1.5 py-1.5 text-right">קבוצה</th>
              <th className="px-1 py-1.5 text-center w-7" title="נקודות">נק׳</th>
              <th className="px-1 py-1.5 text-center w-7" title="משחקים">מש׳</th>
              <th className="px-1 py-1.5 text-center w-8" title="הפרש שערים">±</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((standing, idx) => (
              <tr 
                key={standing.position} 
                className={`border-b border-slate-100 transition-colors ${
                  idx < 2 
                    ? 'bg-emerald-50/60 hover:bg-emerald-50' 
                    : idx === 2 
                    ? 'bg-amber-50/60 hover:bg-amber-50' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-1.5 py-1.5 text-center">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    idx < 2 
                      ? 'bg-emerald-500 text-white' 
                      : idx === 2 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {standing.position}
                  </span>
                </td>
                <td className="px-1.5 py-1.5 text-right">
                  <span className="font-medium text-slate-800 truncate block max-w-[80px]" title={standing.team?.name}>
                    {standing.team?.nameHebrew || standing.team?.name || 'TBD'}
                  </span>
                </td>
                <td className="px-1 py-1.5 text-center font-bold text-slate-900">{standing.points}</td>
                <td className="px-1 py-1.5 text-center text-slate-500">{standing.played}</td>
                <td className="px-1 py-1.5 text-center">
                  <span className={`font-medium ${
                    standing.goalDiff > 0 ? 'text-emerald-600' : standing.goalDiff < 0 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {standing.goalDiff > 0 ? '+' : ''}{standing.goalDiff}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matches Section */}
      {expanded && sortedMatches.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-2 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">משחקי בית</div>
          {sortedMatches.map((matchDisplay) => (
            <MatchRow 
              key={matchDisplay.match.id}
              matchDisplay={matchDisplay}
              onPredictionChange={onPredictionChange}
              isLocked={isLocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MatchRowProps {
  matchDisplay: MatchDisplay;
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  isLocked?: boolean;
}

function MatchRow({ matchDisplay, onPredictionChange, isLocked }: MatchRowProps) {
  const { match, prediction, team1, team2 } = matchDisplay;
  const [scoreA, setScoreA] = useState(prediction?.predScoreA ?? 0);
  const [scoreB, setScoreB] = useState(prediction?.predScoreB ?? 0);

  // Sync local state with prediction props when they change
  useEffect(() => {
    setScoreA(prediction?.predScoreA ?? 0);
    setScoreB(prediction?.predScoreB ?? 0);
  }, [prediction?.predScoreA, prediction?.predScoreB]);

  const handleScoreChange = (team: 'A' | 'B', value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    if (team === 'A') {
      setScoreA(numValue);
      onPredictionChange(match.id, numValue, scoreB);
    } else {
      setScoreB(numValue);
      onPredictionChange(match.id, scoreA, numValue);
    }
  };

  const team1Name = team1?.nameHebrew || team1?.name || match.team1Name || match.team1Code;
  const team2Name = team2?.nameHebrew || team2?.name || match.team2Name || match.team2Code;
  
  // Format date
  const matchDate = new Date(match.scheduledAt);
  const dateStr = matchDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });

  return (
    <div className="flex items-center bg-white rounded-md border border-slate-100 px-2 py-1.5 text-xs hover:border-slate-200 transition-colors">
      {/* Date */}
      <span className="text-[9px] text-slate-400 w-10 flex-shrink-0">{dateStr}</span>
      
      {/* Team 1 */}
      <span 
        className={`flex-1 text-right truncate font-medium ${
          scoreA > scoreB ? 'text-emerald-700' : 'text-slate-700'
        }`} 
        title={team1Name}
      >
        {team1Name}
      </span>
      
      {/* Score inputs */}
      <div className="flex items-center gap-1 mx-2 flex-shrink-0">
        <input
          type="number"
          min="0"
          max="20"
          value={scoreA}
          onChange={(e) => handleScoreChange('A', e.target.value)}
          disabled={isLocked || match.isFinished}
          className="w-7 h-5 text-center border border-slate-200 rounded text-[11px] font-bold 
                     bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 
                     focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400
                     transition-all"
        />
        <span className="text-slate-300 text-[10px] font-bold">:</span>
        <input
          type="number"
          min="0"
          max="20"
          value={scoreB}
          onChange={(e) => handleScoreChange('B', e.target.value)}
          disabled={isLocked || match.isFinished}
          className="w-7 h-5 text-center border border-slate-200 rounded text-[11px] font-bold 
                     bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 
                     focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400
                     transition-all"
        />
      </div>
      
      {/* Team 2 */}
      <span 
        className={`flex-1 text-left truncate font-medium ${
          scoreB > scoreA ? 'text-emerald-700' : 'text-slate-700'
        }`} 
        title={team2Name}
      >
        {team2Name}
      </span>
    </div>
  );
}

