interface TopScorerSectionProps {
  topScorer: string;
  onTopScorerChange: (value: string) => void;
  isFormFinal: boolean;
}

export default function TopScorerSection({
  topScorer,
  onTopScorerChange,
  isFormFinal,
}: TopScorerSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Top Scorer</h2>
      <div className="space-y-4">
        {topScorer && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">{topScorer}</span>
          </div>
        )}
        {!isFormFinal && (
          <input
            type="text"
            placeholder="Enter player name"
            value={topScorer}
            onChange={(e) => onTopScorerChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    </div>
  );
}

