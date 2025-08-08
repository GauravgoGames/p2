
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Medal, Search, Trophy, Users, Award, Heart, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardUser {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
  isVerified: boolean;
  viewedByCount?: number;
}

interface Tournament {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: string;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('weekly');
  const [selectedTournament, setSelectedTournament] = useState<string>('overall');
  const [isMobile, setIsMobile] = useState(false);
  const [lovedUsers, setLovedUsers] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Love mutation with authentication
  const loveMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/users/${username}/love`, { 
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to love users');
        }
        throw new Error('Failed to update love status');
      }
      return res.json();
    },
    onSuccess: (data, username) => {
      const userEntry = filteredUsers().find(u => u.username === username);
      if (userEntry) {
        if (data.isLoved) {
          setLovedUsers(prev => new Set([...Array.from(prev), userEntry.id]));
        } else {
          setLovedUsers(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(userEntry.id);
            return newSet;
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      toast({
        title: data.isLoved ? "Mark Loved" : "Mark Unloved",
        description: data.isLoved ? "You have loved this user." : "You have unloved this user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // View mutation
  const viewMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/users/${username}/view`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to track view');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    }
  });

  const handleViewProfile = (username: string) => {
    viewMutation.mutate(username);
    setLocation(`/users/${username}`);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    }
  });

  const { data: leaderboard, isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', timeframe, selectedTournament],
    queryFn: async () => {
      const params = new URLSearchParams({ timeframe });
      if (selectedTournament !== 'overall') {
        params.append('tournamentId', selectedTournament);
      }
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    }
  });

  // Load love status for all users if authenticated
  useEffect(() => {
    if (!user || !leaderboard) return;
    
    const loadLoveStatuses = async () => {
      const lovedUserIds: number[] = [];
      
      try {
        for (const userData of leaderboard) {
          const res = await fetch(`/api/users/${userData.username}/love-status`, {
            credentials: 'include'
          });
          if (res.ok) {
            const { isLoved } = await res.json();
            if (isLoved) {
              lovedUserIds.push(userData.id);
            }
          }
        }
        
        setLovedUsers(new Set(lovedUserIds));
      } catch (error) {
        // Ignore errors during love status loading
      }
    };

    loadLoveStatuses();
  }, [user, leaderboard]);

  const filteredUsers = () => {
    if (!leaderboard) return [];
    
    // First filter to only show verified users
    const verifiedUsers = leaderboard.filter(user => user.isVerified);
    
    // Then apply search filter
    if (!searchTerm) return verifiedUsers;

    const term = searchTerm.toLowerCase();
    return verifiedUsers.filter(user => 
      user.username.toLowerCase().includes(term) || 
      (user.displayName && user.displayName.toLowerCase().includes(term))
    );
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-neutral-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };

  const findCurrentUserRank = () => {
    if (!user || !leaderboard) return null;
    
    // Filter verified users first, then find current user
    const verifiedUsers = leaderboard.filter(entry => entry.isVerified);
    const userRank = verifiedUsers.findIndex(entry => entry.id === user.id);
    if (userRank === -1) return null;
    
    return { rank: userRank + 1, ...verifiedUsers[userRank] };
  };

  const currentUserRank = findCurrentUserRank();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 font-heading">Leaderboard</h1>

      <div className="bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full lg:w-1/4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tournament" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Leaderboard</SelectItem>
                  {tournaments?.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id.toString()}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue={timeframe} value={timeframe} onValueChange={setTimeframe}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-neutral-500 border-b border-neutral-200">
                <th className="pb-3 pl-4">Rank</th>
                <th className="pb-3">Player</th>
                <th className="pb-3">Stats</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3">Views</th>
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
                        <AvatarImage src={entry.profileImage || ''} alt={entry.username} />
                        <AvatarFallback className="bg-primary text-white">
                          {entry.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewProfile(entry.username)}
                          className="font-medium hover:text-primary transition-colors text-left"
                        >
                          {entry.displayName || entry.username}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => loveMutation.mutate(entry.username)}
                            disabled={loveMutation.isPending}
                            className={`p-1 hover:bg-pink-50 rounded-full transition-colors ${
                              lovedUsers.has(entry.id) ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
                            }`}
                            title="Love this player"
                          >
                            <Heart className={`h-4 w-4 ${lovedUsers.has(entry.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleViewProfile(entry.username)}
                            className="p-1 hover:bg-blue-50 rounded-full transition-colors text-neutral-500 hover:text-blue-500"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {entry.id === user?.id && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{entry.totalMatches} matches</span>
                      <span className="text-xs text-neutral-500">{entry.correctPredictions} correct</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {entry.totalMatches > 0 ? ((entry.correctPredictions/(entry.totalMatches*2))*100).toFixed(0) : 0}%
                      </span>
                      <span className="text-xs text-neutral-500">accuracy</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-neutral-600">
                        <Eye className="h-3 w-3" />
                        {entry.viewedByCount || 0}
                      </span>
                    </div>
                  </td>
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
      </div>

      {/* How Points are Earned */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">How Points are Earned</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full mt-0.5">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Match Winner Prediction</h3>
              <p className="text-neutral-600">+1 point for correctly predicting the match winner</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full mt-0.5">
              <Medal className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Toss Winner Prediction</h3>
              <p className="text-neutral-600">+1 point for correctly predicting the toss winner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
          Performance Comparison - Top {isMobile ? '10' : '20'} {selectedTournament !== 'overall' ? `(${tournaments?.find(t => t.id.toString() === selectedTournament)?.name || 'Tournament'})` : 'Predictors'}
        </h2>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] sm:min-w-0">
            <ChartContainer
              config={{
                strikeRate: { 
                  color: '#FF9800',
                  label: 'Strike Rate'
                }
              }}
              className="h-[400px] sm:h-[500px] w-full"
            >
              <BarChart 
                data={filteredUsers().slice(0, isMobile ? 10 : 20).map((user, index) => {
                  const colors = [
                    '#FF9800', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
                    '#2196F3', '#009688', '#4CAF50', '#FFC107', '#FF5722',
                    '#795548', '#607D8B', '#F44336', '#E91E63', '#9C27B0',
                    '#673AB7', '#3F51B5', '#03A9F4', '#00BCD4', '#4CAF50'
                  ];
                  return {
                    name: isMobile 
                      ? ((user.displayName || user.username).length > 6 
                          ? (user.displayName || user.username).substring(0, 6) + '...'
                          : (user.displayName || user.username))
                      : ((user.displayName || user.username).length > 8 
                          ? (user.displayName || user.username).substring(0, 8) + '...'
                          : (user.displayName || user.username)),
                    strikeRate: user.totalMatches > 0 ? Number(((user.correctPredictions/(user.totalMatches*2))*100).toFixed(1)) : 0,
                    fill: colors[index % colors.length]
                  };
                })}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  fontSize={isMobile ? 10 : 12}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Strike Rate (%)', angle: -90, position: 'insideLeft' }}
                  fontSize={isMobile ? 10 : 12}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="strikeRate" fill="var(--color-strikeRate)">
                  {filteredUsers().slice(0, isMobile ? 10 : 20).map((_, index) => {
                    const colors = [
                      '#FF9800', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
                      '#2196F3', '#009688', '#4CAF50', '#FFC107', '#FF5722',
                      '#795548', '#607D8B', '#F44336', '#E91E63', '#9C27B0',
                      '#673AB7', '#3F51B5', '#03A9F4', '#00BCD4', '#4CAF50'
                    ];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
