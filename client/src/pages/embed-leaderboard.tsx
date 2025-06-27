import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

export default function EmbedLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery<any[]>({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const topUsers = leaderboard?.slice(0, 10) || [];

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Live Leaderboard
            </h2>
            <p className="text-blue-100 text-sm mt-1">Top 10 Predictors</p>
          </div>

          <div className="divide-y divide-gray-100">
            {topUsers.map((user: any, index: number) => (
              <div 
                key={user.id} 
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-500 w-8">
                      {index + 1}
                    </div>
                    {getMedalIcon(index + 1)}
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {user.displayName || user.username}
                        {user.isVerified && (
                          <svg className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.correctPredictions} correct predictions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">{user.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <a 
              href={`${window.location.origin}/leaderboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors w-full"
            >
              <TrendingUp className="h-4 w-4" />
              View Full Leaderboard
            </a>
          </div>


        </div>
      </div>
    </div>
  );
}