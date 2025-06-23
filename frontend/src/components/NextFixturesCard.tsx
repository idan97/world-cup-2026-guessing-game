import { NextMatch } from '../../lib/types';

interface NextFixturesCardProps {
  data: NextMatch[];
}

export default function NextFixturesCard({ data }: NextFixturesCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Next Fixtures</h2>
        <span className="text-sm text-gray-500">Next 2 days</span>
      </div>

      <div className="space-y-4">
        {data?.length > 0 ? (
          data.slice(0, 5).map((match) => (
            <div key={match.matchId} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">
                  {match.teams[0]} vs {match.teams[1]}
                </div>
                <div className="text-xs text-gray-500">
                  {match.stage}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  {new Date(match.kickoff).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                
                {match.myPick ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 text-xs">My pick:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {match.myPick.scoreA}-{match.myPick.scoreB}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">No prediction</span>
                )}
              </div>
              
              {match.locked && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                    🔒 Locked
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No upcoming matches
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <a
          href="/forms/edit"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Edit predictions →
        </a>
      </div>
    </div>
  );
} 