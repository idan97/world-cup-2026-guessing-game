import { useLeague } from '../../lib/useLeague';
import { LeaderboardEntry } from '../../lib/types';

interface LeaderboardCardProps {
  data: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardCard({
  data,
  currentUserId,
}: LeaderboardCardProps) {
  const { leagueId } = useLeague();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <span className="text-sm text-gray-500">League: {leagueId}</span>
      </div>

      <div className="space-y-2">
        {data?.slice(0, 10).map((entry) => (
          <div
            key={entry.formId}
            className={`flex justify-between items-center p-2 rounded ${
              entry.formId === currentUserId
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono w-6 text-center">
                #{entry.rank}
              </span>
              <span className="font-medium">{entry.nickname}</span>
            </div>
            <span className="font-mono text-sm">{entry.totalPoints} pts</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href="/leaderboard"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View full leaderboard →
        </a>
      </div>
    </div>
  );
}
