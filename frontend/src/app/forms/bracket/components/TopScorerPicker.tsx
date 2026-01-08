'use client';

import { useState, useEffect } from 'react';

interface TopScorerPickerProps {
  value: string;
  onChange: (playerName: string) => void;
  isLocked: boolean;
}

export default function TopScorerPicker({ value, onChange, isLocked }: TopScorerPickerProps) {
  const [playerName, setPlayerName] = useState(value);

  useEffect(() => {
    setPlayerName(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPlayerName(newValue);
    onChange(newValue);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-yellow-300 p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">👑</span>
        <h3 className="text-xl font-bold text-slate-800">מלך השערים</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          בחר את השחקן שלדעתך יהיה מלך השערים של המונדיאל
        </p>
        
        <div className="relative">
          <input
            type="text"
            value={playerName}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="שם השחקן המלא (לדוגמה: Lionel Messi)"
            className={`
              w-full px-4 py-3 rounded-lg border-2 transition-all
              text-lg font-medium text-slate-800
              placeholder:text-slate-400 placeholder:font-normal
              ${isLocked 
                ? 'bg-slate-100 border-slate-300 cursor-not-allowed' 
                : 'bg-white border-slate-300 hover:border-yellow-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200'
              }
            `}
            maxLength={100}
          />
          {!isLocked && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⚽
            </div>
          )}
        </div>

        {playerName && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
            <span>✓</span>
            <span>הבחירה שלך: <strong>{playerName}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

