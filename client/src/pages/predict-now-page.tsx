import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match, Team, Prediction } from '@shared/schema';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Filter, 
  Search, 
  ChevronDown,
  ChevronUp,
  SortAsc
} from 'lucide-react';
import MatchCard from '@/components/match-card';
import { useAuth } from '@/hooks/use-auth';

type MatchWithTeams = Match & {
  team1: Team;
  team2: Team;
  tossWinner?: Team;
  matchWinner?: Team;
};

const PredictNowPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-asc');
  const [filterTeam, setFilterTeam] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch matches
  const { data: matches, isLoading: isLoadingMatches } = useQuery<MatchWithTeams[]>({
    queryKey: ['/api/matches'],
    queryFn: async () => {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Failed to fetch matches');
      return res.json();
    }
  });
  
  // Fetch user predictions if user is logged in
  const { data: predictions } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions'],
    queryFn: async () => {
      const res = await fetch('/api/predictions');
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch all teams for filtering
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    }
  });
  
  const getUserPredictionForMatch = (matchId: number) => {
    if (!predictions) return undefined;
    return predictions.find(p => p.matchId === matchId);
  };
  
  const filteredMatches = () => {
    if (!matches) return [];
    
    let filtered = [...matches];
    
    // Filter by tab (match status)
    if (activeTab !== 'all') {
      filtered = filtered.filter(match => match.status === activeTab);
    }
    
    // Filter by search term (tournament name or location)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(match => 
        match.tournamentName.toLowerCase().includes(term) || 
        match.location.toLowerCase().includes(term) ||
        match.team1.name.toLowerCase().includes(term) ||
        match.team2.name.toLowerCase().includes(term)
      );
    }
    
    // Filter by team
    if (filterTeam) {
      const teamId = parseInt(filterTeam);
      filtered = filtered.filter(match => 
        match.team1Id === teamId || match.team2Id === teamId
      );
    }
    
    // Sort the matches
    return filtered.sort((a, b) => {
      if (sortBy === 'date-asc') {
        return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      } else if (sortBy === 'date-desc') {
        return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      } else if (sortBy === 'name-asc') {
        return a.tournamentName.localeCompare(b.tournamentName);
      } else if (sortBy === 'name-desc') {
        return b.tournamentName.localeCompare(a.tournamentName);
      }
      return 0;
    });
  };
  
  const renderMatchesSkeleton = () => {
    return Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-md p-4">
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-2" />
            <Skeleton className="h-4 w-16 mb-1" />
          </div>
          <Skeleton className="h-6 w-8" />
          <div className="flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-2" />
            <Skeleton className="h-4 w-16 mb-1" />
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    ));
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 font-heading">Predict Matches</h1>
      
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold mb-4">How Points Are Earned</h2>
        <div className="bg-neutral-50 rounded-lg p-4 border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2">Prediction Type</th>
                <th className="text-right py-2">Points Awarded</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="py-2">Correct Toss Winner</td>
                <td className="text-right py-2">1 point</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-2">Correct Match Winner</td>
                <td className="text-right py-2">1 point</td>
              </tr>
              <tr>
                <td className="py-2 text-red-600">Match becomes VOID or TIE</td>
                <td className="text-right py-2 text-red-600">No points</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <Input
              type="text"
              placeholder="Search matches, teams, tournaments..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter size={18} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (Earliest First)</SelectItem>
                <SelectItem value="date-desc">Date (Latest First)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 border rounded-md mb-4 bg-neutral-50">
            <h3 className="font-medium mb-2">Filter Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teams</SelectItem>
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTeam('');
                    setSortBy('date-asc');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex justify-start mb-4">
            <TabsTrigger value="all">All Matches</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingMatches ? (
                renderMatchesSkeleton()
              ) : filteredMatches().length > 0 ? (
                filteredMatches().map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    userPrediction={getUserPredictionForMatch(match.id)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-neutral-500 border border-dashed rounded-md">
                  <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium text-neutral-700 mb-1">No matches found</h3>
                  <p>Try adjusting your filters or check back later for new matches</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingMatches ? (
                renderMatchesSkeleton()
              ) : filteredMatches().length > 0 ? (
                filteredMatches().map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    userPrediction={getUserPredictionForMatch(match.id)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-neutral-500 border border-dashed rounded-md">
                  <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium text-neutral-700 mb-1">No upcoming matches found</h3>
                  <p>Check back later for new matches</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ongoing" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingMatches ? (
                renderMatchesSkeleton()
              ) : filteredMatches().length > 0 ? (
                filteredMatches().map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    userPrediction={getUserPredictionForMatch(match.id)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-neutral-500 border border-dashed rounded-md">
                  <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium text-neutral-700 mb-1">No ongoing matches</h3>
                  <p>Check back later for live matches</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingMatches ? (
                renderMatchesSkeleton()
              ) : filteredMatches().length > 0 ? (
                filteredMatches().map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    userPrediction={getUserPredictionForMatch(match.id)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-neutral-500 border border-dashed rounded-md">
                  <Calendar className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium text-neutral-700 mb-1">No completed matches</h3>
                  <p>Match results will appear here when they are completed</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PredictNowPage;