'use client';

import { useState } from 'react';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionSection({ title, children, isOpen, onToggle }: AccordionSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 text-left text-sm font-medium text-gray-900 hover:text-blue-600"
      >
        {title}
        <span
          className={`text-lg transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="pb-3 text-sm text-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}

export default function RulesCard() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    scoring: false,
    group: false,
    knockout: false,
    topScorer: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Rules & Scoring</h2>
        <span className="text-sm text-gray-500">📖</span>
      </div>

      <div className="space-y-0">
        <AccordionSection
          title="Scoring System"
          isOpen={openSections.scoring}
          onToggle={() => toggleSection('scoring')}
        >
          <ul className="space-y-1">
            <li>• <strong>Exact score:</strong> 3 points</li>
            <li>• <strong>Correct outcome:</strong> 1 point</li>
            <li>• <strong>Advancement bonus:</strong> 2 points</li>
            <li>• <strong>Top scorer:</strong> 5 points</li>
          </ul>
        </AccordionSection>

        <AccordionSection
          title="Group Stage"
          isOpen={openSections.group}
          onToggle={() => toggleSection('group')}
        >
          <div className="space-y-2">
            <p>Predict the exact score for all 48 group stage matches.</p>
            <p><strong>Scoring:</strong> 3 points for exact score, 1 point for correct outcome (Win/Draw/Loss).</p>
            <p><strong>Example:</strong> If you predict France 2-1 Belgium and the actual result is France 3-1 Belgium, you get 1 point for the correct outcome.</p>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Knockout Stage"
          isOpen={openSections.knockout}
          onToggle={() => toggleSection('knockout')}
        >
          <div className="space-y-2">
            <p>Pick which teams advance through each knockout round:</p>
            <ul className="space-y-1 ml-4">
              <li>• Round of 16 → Quarter Finals</li>
              <li>• Quarter Finals → Semi Finals</li>
              <li>• Semi Finals → Final</li>
              <li>• Final Winner</li>
            </ul>
            <p><strong>Scoring:</strong> 2 points for each correct advancement.</p>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Top Scorer"
          isOpen={openSections.topScorer}
          onToggle={() => toggleSection('topScorer')}
        >
          <div className="space-y-2">
            <p>Predict which player will score the most goals in the tournament.</p>
            <p><strong>Scoring:</strong> 5 points if your pick wins or ties for the Golden Boot.</p>
            <p><strong>Note:</strong> If multiple players tie for most goals, all predictions for those players get full points.</p>
          </div>
        </AccordionSection>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Predictions lock when matches begin
        </div>
      </div>
    </div>
  );
} 