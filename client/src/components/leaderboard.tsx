import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Crown, Medal } from 'lucide-react';

interface LeaderboardUser {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('weekly');
  
  const { data: leaderboard, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', timeframe],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/leaderboard?timeframe=${queryKey[1]}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    }
  });
  
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };
  
  const findCurrentUserRank = () => {
    if (!user || !leaderboard) return null;
    
    const userRank = leaderboard.findIndex(entry => entry.id === user.id);
    if (userRank === -1) return null;
    
    return {
      rank: userRank + 1,
      ...leaderboard[userRank]
    };
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-accent" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };
  
  const currentUserRank = findCurrentUserRank();
  
  return (
    <div id="leaderboard" className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-heading text-neutral-800">Leaderboard</h2>
        <Tabs defaultValue="weekly" value={timeframe} onValueChange={handleTimeframeChange}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 pl-4">Rank</th>
                  <th className="pb-3">Player</th>
                  <th className="pb-3">Matches Participated</th>
                  <th className="pb-3">Predictions Made</th>
                  <th className="pb-3 pr-4">Points</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100">
                      <td className="py-4 pl-4"><Skeleton className="h-6 w-8" /></td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <Skeleton className="h-8 w-8 rounded-full mr-3" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      </td>
                      <td className="py-4"><Skeleton className="h-6 w-8" /></td>
                      <td className="py-4"><Skeleton className="h-6 w-8" /></td>
                      <td className="py-4 pr-4"><Skeleton className="h-6 w-8" /></td>
                    </tr>
                  ))
                ) : leaderboard && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className={`border-b border-neutral-100 hover:bg-neutral-50 ${entry.id === user?.id ? 'bg-neutral-50' : ''}`}
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center">
                          <span className="font-medium text-neutral-800">{index + 1}</span>
                          <div className="ml-2">
                            {getRankIcon(index + 1)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={entry.profileImage || ''} alt={entry.username} />
                            <AvatarFallback className="bg-primary text-white">
                              {entry.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <a 
                            href={`/users/${entry.username}`} 
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {entry.displayName || entry.username}
                          </a>
                          {entry.id === user?.id && (
                            <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{entry.totalMatches}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{entry.correctPredictions}</span>
                          <span className="text-xs text-neutral-500">{entry.correctPredictions}/{entry.totalMatches*2} predictions</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 font-medium text-primary">{entry.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-500">No leaderboard data available</td>
                  </tr>
                )}
                
                {/* Show current user if not in top 10 */}
                {currentUserRank && leaderboard && currentUserRank.rank > 10 && (
                  <>
                    <tr>
                      <td colSpan={5} className="py-2 text-center border-b">
                        <span className="text-xs text-neutral-500">...</span>
                      </td>
                    </tr>
                    <tr className="bg-neutral-50">
                      <td className="py-4 pl-4">
                        <span className="font-medium text-neutral-800">{currentUserRank.rank}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3 border-2 border-primary">
                            <AvatarImage src={currentUserRank.profileImage || ''} alt={currentUserRank.username} />
                            <AvatarFallback className="bg-primary text-white">
                              {currentUserRank.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{currentUserRank.displayName || currentUserRank.username}</span>
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">You</span>
                        </div>
                      </td>
                      <td className="py-4">{currentUserRank.totalMatches}</td>
                      <td className="py-4">{currentUserRank.correctPredictions}</td>
                      <td className="py-4 pr-4 font-medium text-primary">{currentUserRank.points}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
