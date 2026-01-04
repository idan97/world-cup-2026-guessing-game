'use client';

import GroupCard from './GroupCard';
import type { GroupDisplay } from '../types';

interface GroupStageProps {
  groups: GroupDisplay[];
  onPredictionChange: (matchId: string, scoreA: number, scoreB: number) => void;
  isLocked?: boolean;
}

export default function GroupStage({ groups, onPredictionChange, isLocked = false }: GroupStageProps) {
  // Sort groups by letter
  const sortedGroups = [...groups].sort((a, b) => a.letter.localeCompare(b.letter));

  // Split groups into rows (A-F and G-L)
  const firstRow = sortedGroups.slice(0, 6);
  const secondRow = sortedGroups.slice(6, 12);

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          שלב הבתים
          <span className="text-sm font-normal text-slate-500 hidden sm:inline">(12 בתים · 48 קבוצות · 72 משחקים)</span>
        </h2>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold">1-2</span>
            <span>עולים ישירות</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold">3</span>
            <span>8 השלישיות הטובות</span>
          </div>
        </div>
      </div>
      
      {/* Groups Grid - First Row (A-F) */}
      <div className="mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {firstRow.map((group) => (
            <GroupCard
              key={group.letter}
              group={group}
              onPredictionChange={onPredictionChange}
              isLocked={isLocked}
            />
          ))}
        </div>
      </div>

      {/* Groups Grid - Second Row (G-L) */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {secondRow.map((group) => (
            <GroupCard
              key={group.letter}
              group={group}
              onPredictionChange={onPredictionChange}
              isLocked={isLocked}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

