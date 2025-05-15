import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Users, 
  TrophyIcon, 
  Clock, 
  Activity, 
  PlayCircle, 
  CalendarDays, 
  CheckCircle,
  User,
  Plus,
  Settings
} from 'lucide-react';

// Types for dashboard statistics
interface DashboardStats {
  userCount: number;
  matchesCount: {
    upcoming: number;
    ongoing: number;
    completed: number;
  };
  predictionCount: number;
  topUsers: {
    id: number;
    username: string;
    displayName?: string;
    points: number;
  }[];
}

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: async () => {
      // Fetch all necessary data for the dashboard
      const [usersRes, matchesRes, leaderboardRes, predictionsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/matches'),
        fetch('/api/leaderboard?timeframe=all-time'),
        fetch('/api/admin/all-predictions')
      ]);
      
      // Handle API errors
      if (!usersRes.ok || !matchesRes.ok || !leaderboardRes.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const users = await usersRes.json();
      const matches = await matchesRes.json();
      const leaderboard = await leaderboardRes.json();
      
      // Calculate unique predictions (count by unique userId + matchId combinations)
      let predictionCount = 0;
      if (predictionsRes.ok) {
        const predictions = await predictionsRes.json();
        // Use a Set to track unique user-match combinations
        const uniquePredictions = new Set();
        predictions.forEach((pred: any) => {
          uniquePredictions.add(`${pred.userId}-${pred.matchId}`);
        });
        predictionCount = uniquePredictions.size;
      }
      
      return {
        userCount: users.length,
        matchesCount: {
          upcoming: matches.filter((m: any) => m.status === 'upcoming').length,
          ongoing: matches.filter((m: any) => m.status === 'ongoing').length,
          completed: matches.filter((m: any) => m.status === 'completed').length,
        },
        predictionCount: predictionCount,
        topUsers: leaderboard.slice(0, 5)
      };
    }
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => window.location.href = '/admin/matches'}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <Plus className="mr-1 h-4 w-4" /> New Match
          </button>
          <button 
            onClick={() => window.location.href = '/admin/users'}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <User className="mr-1 h-4 w-4" /> Manage Users
          </button>
          <button 
            onClick={() => window.location.href = '/admin/settings'}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ml-2"
          >
            <Settings className="mr-1 h-4 w-4" /> Site Settings
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Users</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold">{stats?.userCount}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                <Activity className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Predictions</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold">{stats?.predictionCount}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mr-4">
                <TrophyIcon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Total Matches</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold">
                    {(stats?.matchesCount.upcoming || 0) + (stats?.matchesCount.ongoing || 0) + (stats?.matchesCount.completed || 0)}
                  </h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Completed Matches</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold">{stats?.matchesCount.completed}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Match Status</CardTitle>
            <CardDescription>Overview of current match status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-info/20 mx-auto flex items-center justify-center mb-3">
                  <CalendarDays className="h-6 w-6 text-info" />
                </div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1">Upcoming</h4>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.matchesCount.upcoming}</p>
                )}
                <button 
                  onClick={() => window.location.href = '/admin/matches'} 
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Manage Matches
                </button>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 mx-auto flex items-center justify-center mb-3">
                  <PlayCircle className="h-6 w-6 text-success" />
                </div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1">Ongoing</h4>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.matchesCount.ongoing}</p>
                )}
                <button 
                  onClick={() => window.location.href = '/admin/matches'} 
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Update Results
                </button>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-200 mx-auto flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-neutral-700" />
                </div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1">Completed</h4>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.matchesCount.completed}</p>
                )}
                <button 
                  onClick={() => window.location.href = '/admin/matches'} 
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <Tabs defaultValue="create">
                <TabsList className="w-full">
                  <TabsTrigger value="create" className="flex-1">Create Match</TabsTrigger>
                  <TabsTrigger value="update" className="flex-1">Update Match</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="py-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Create a new match and allow users to start predicting its outcome and toss result.
                  </p>
                  <Link href="/admin/matches">
                    <Button>Add New Match</Button>
                  </Link>
                </TabsContent>
                <TabsContent value="update" className="py-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Update match results to calculate user points and update the leaderboard.
                  </p>
                  <Link href="/admin/matches">
                    <Button>Manage Matches</Button>
                  </Link>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Users with highest points</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            ) : stats?.topUsers && stats.topUsers.length > 0 ? (
              <div className="space-y-4">
                {stats.topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full text-primary font-medium mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-neutral-500">{user.username}</p>
                    </div>
                    <div className="font-bold text-primary">{user.points}pts</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-neutral-500">No user data available</p>
            )}
            
            <div className="mt-6">
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
              >
                View All Users
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
