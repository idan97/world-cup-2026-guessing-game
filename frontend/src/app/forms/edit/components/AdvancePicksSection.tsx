interface AdvancePick {
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
  teamId: string;
}

interface AdvancePicksSectionProps {
  picks: AdvancePick[];
  newPick: AdvancePick;
  onNewPickChange: (pick: AdvancePick) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isFormFinal: boolean;
}

export default function AdvancePicksSection({
  picks,
  newPick,
  onNewPickChange,
  onAdd,
  onRemove,
  isFormFinal,
}: AdvancePicksSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Advance Picks</h2>
      <p className="text-sm text-gray-600 mb-4">
        Predict which teams advance to each stage
      </p>

      <div className="space-y-4">
        {picks.map((pick, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <span className="text-sm font-medium">{pick.stage}: </span>
              <span className="text-sm">{pick.teamId}</span>
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
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newPick.stage}
                onChange={(e) =>
                  onNewPickChange({
                    ...newPick,
                    stage: e.target.value as 'R32' | 'R16' | 'QF' | 'SF' | 'F',
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="R32">Round of 32</option>
                <option value="R16">Round of 16</option>
                <option value="QF">Quarter Finals</option>
                <option value="SF">Semi Finals</option>
                <option value="F">Final</option>
              </select>
              <input
                type="text"
                placeholder="Team ID (e.g., FRA, BRA)"
                value={newPick.teamId}
                onChange={(e) =>
                  onNewPickChange({
                    ...newPick,
                    teamId: e.target.value.toUpperCase(),
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={onAdd}
                disabled={!newPick.teamId.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
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

