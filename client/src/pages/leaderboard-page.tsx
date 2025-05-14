import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Crown, Medal, Search, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeaderboardUser {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
  predictions?: any[];
  correctWinnerPredictions: number;
  correctTossPredictions: number;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('weekly');
  const [view, setView] = useState<'compact' | 'detailed' | 'matrix'>('compact');

  const { data: leaderboard, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?timeframe=${timeframe}&details=true`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    }
  });

  const { data: matches } = useQuery({
    queryKey: ['/api/matches'],
    queryFn: async () => {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Failed to fetch matches');
      return res.json();
    }
  });

  const calculateStrikeRate = (user: LeaderboardUser) => {
    if (!user.totalMatches) return 0;
    const winnerAccuracy = user.correctWinnerPredictions / user.totalMatches;
    const tossAccuracy = user.correctTossPredictions / user.totalMatches;
    return ((winnerAccuracy + tossAccuracy) * 100).toFixed(1);
  };

  const filteredUsers = () => {
    if (!leaderboard) return [];
    if (!searchTerm) return leaderboard;
    const term = searchTerm.toLowerCase();
    return leaderboard.filter(user => 
      user.username.toLowerCase().includes(term) || 
      (user.displayName && user.displayName.toLowerCase().includes(term))
    );
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-neutral-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return null;
    }
  };

  const getResultColor = (prediction: any, match: any) => {
    if (!match || match.status !== 'completed') return 'bg-neutral-100';
    if (prediction.predictedMatchWinnerId === match.matchWinnerId) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 font-heading">Leaderboard</h1>

      <div className="bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Tabs defaultValue={timeframe} value={timeframe} onValueChange={setTimeframe}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs defaultValue={view} value={view} onValueChange={setView as any}>
              <TabsList>
                <TabsTrigger value="compact">Compact</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="matrix">Matrix</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {view === 'matrix' && (
          <ScrollArea className="w-full overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-neutral-500 border-b border-neutral-200">
                    <th className="pb-3 pl-4">Rank</th>
                    <th className="pb-3">Predictor</th>
                    <th className="pb-3">Matches</th>
                    <th className="pb-3">Pass %</th>
                    {matches?.map((match: any, index: number) => (
                      <th key={match.id} className="pb-3 px-2 text-center">
                        {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers().map((entry, index) => (
                    <tr key={entry.id} className="border-b border-neutral-100">
                      <td className="py-4 pl-4">
                        <div className="flex items-center">
                          <span className="font-medium text-neutral-800">{index + 1}</span>
                          <div className="ml-2">{getRankIcon(index + 1)}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={entry.profileImage} />
                            <AvatarFallback className="bg-primary text-white">
                              {entry.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <a href={`/users/${entry.username}`} className="font-medium hover:text-primary">
                              {entry.displayName || entry.username}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">{entry.totalMatches}</td>
                      <td className="py-4">
                        <Badge variant="outline" className="font-semibold">
                          {calculateStrikeRate(entry)}%
                        </Badge>
                      </td>
                      {matches?.map((match: any) => {
                        const prediction = entry.predictions?.find((p: any) => p.matchId === match.id);
                        return (
                          <td key={match.id} className={`py-4 px-2 text-center ${getResultColor(prediction, match)}`}>
                            {prediction?.predictedMatchWinnerId ? match.teams?.find((t: any) => t.id === prediction.predictedMatchWinnerId)?.name.substring(0, 3) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}

        {view !== 'matrix' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-medium text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 pl-4">Rank</th>
                  <th className="pb-3">Player</th>
                  {view === 'detailed' ? (
                      <>
                        <th className="pb-3">Matches</th>
                        <th className="pb-3">Winner Predictions</th>
                        <th className="pb-3">Toss Predictions</th>
                        <th className="pb-3">Strike Rate</th>
                        <th className="pb-3">Points</th>
                      </>
                    ) : (
                    <>
                      <th className="pb-3">Matches</th>
                      <th className="pb-3">Predictions</th>
                    </>
                  )}
                  <th className="pb-3 pr-4">Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers().map((entry, index) => (
                  <tr 
                    key={entry.id} 
                    className={`border-b border-neutral-100 hover:bg-neutral-50 ${entry.id === user?.id ? 'bg-neutral-50' : ''}`}
                  >
                    <td className="py-4 pl-4">
                      <div className="flex items-center">
                        <span className="font-medium text-neutral-800">{index + 1}</span>
                        <div className="ml-2">{getRankIcon(index + 1)}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={entry.profileImage} />
                          <AvatarFallback className="bg-primary text-white">
                            {entry.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <a href={`/users/${entry.username}`} className="font-medium hover:text-primary">
                            {entry.displayName || entry.username}
                          </a>
                          {entry.id === user?.id && (
                            <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {view === 'detailed' ? (
                      <>
                        <td className="py-4">{entry.totalMatches}</td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.correctWinnerPredictions}</span>
                            <span className="text-xs text-neutral-500">
                              {((entry.correctWinnerPredictions / entry.totalMatches) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.correctTossPredictions}</span>
                            <span className="text-xs text-neutral-500">
                              {((entry.correctTossPredictions / entry.totalMatches) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className={`font-semibold ${Number(calculateStrikeRate(entry)) > 50 ? 'text-green-600 border-green-600' : 'text-orange-600 border-orange-600'}`}>
                            {calculateStrikeRate(entry)}%
                          </Badge>
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant="outline" className="font-semibold text-primary border-primary">
                            {entry.points} pts
                          </Badge>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4">{entry.totalMatches}</td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.correctPredictions}</span>
                            <span className="text-xs text-neutral-500">{entry.correctPredictions}/{entry.totalMatches*2} predictions</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="py-4 pr-4">
                      <Badge variant="outline" className="font-semibold text-primary border-primary">
                        {entry.points} pts
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;