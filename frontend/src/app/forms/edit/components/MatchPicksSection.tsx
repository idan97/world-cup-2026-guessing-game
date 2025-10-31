interface MatchPick {
  matchId: number;
  predScoreA: number;
  predScoreB: number;
  predOutcome: 'W' | 'D' | 'L';
}

interface MatchPicksSectionProps {
  picks: MatchPick[];
  newPick: MatchPick;
  onNewPickChange: (pick: MatchPick) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isFormFinal: boolean;
}

const calculateOutcome = (scoreA: number, scoreB: number): 'W' | 'D' | 'L' => {
  if (scoreA > scoreB) return 'W';
  if (scoreA < scoreB) return 'L';
  return 'D';
};

export default function MatchPicksSection({
  picks,
  newPick,
  onNewPickChange,
  onAdd,
  onRemove,
  isFormFinal,
}: MatchPicksSectionProps) {
  const handleScoreAChange = (scoreA: number) => {
    const outcome = calculateOutcome(scoreA, newPick.predScoreB);
    onNewPickChange({ ...newPick, predScoreA: scoreA, predOutcome: outcome });
  };

  const handleScoreBChange = (scoreB: number) => {
    const outcome = calculateOutcome(newPick.predScoreA, scoreB);
    onNewPickChange({ ...newPick, predScoreB: scoreB, predOutcome: outcome });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Match Picks</h2>
      <p className="text-sm text-gray-600 mb-4">
        Predict match scores (matchId, scores, outcome)
      </p>

      <div className="space-y-4">
        {picks.map((pick, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 grid grid-cols-4 gap-2">
              <span className="text-sm font-medium">Match {pick.matchId}</span>
              <span className="text-sm">Score A: {pick.predScoreA}</span>
              <span className="text-sm">Score B: {pick.predScoreB}</span>
              <span className="text-sm">Outcome: {pick.predOutcome}</span>
            </div>
            {!isFormFinal && (
              <button
                onClick={() => onRemove(index)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {!isFormFinal && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-5 gap-2 mb-2">
              <input
                type="number"
                placeholder="Match ID"
                value={newPick.matchId || ''}
                onChange={(e) =>
                  onNewPickChange({
                    ...newPick,
                    matchId: parseInt(e.target.value) || 0,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="1"
              />
              <input
                type="number"
                placeholder="Score A"
                value={newPick.predScoreA || ''}
                onChange={(e) => handleScoreAChange(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
              />
              <input
                type="number"
                placeholder="Score B"
                value={newPick.predScoreB || ''}
                onChange={(e) => handleScoreBChange(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
              />
              <select
                value={newPick.predOutcome}
                onChange={(e) =>
                  onNewPickChange({
                    ...newPick,
                    predOutcome: e.target.value as 'W' | 'D' | 'L',
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="W">Win (A)</option>
                <option value="D">Draw</option>
                <option value="L">Loss (A)</option>
              </select>
              <button
                onClick={onAdd}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

