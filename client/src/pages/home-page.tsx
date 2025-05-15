import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Match, Team, Prediction } from '@shared/schema';
import HeroSection from '@/components/hero-section';
import FeatureCards from '@/components/feature-cards';
import Leaderboard from '@/components/leaderboard';
// Removed upcoming events as per issue #6
import MatchCard from '@/components/match-card';
import { useAuth } from '@/hooks/use-auth';
import AudiencePoll from '@/components/audience-poll'; // Import AudiencePoll component

type MatchWithTeams = Match & {
  team1: Team;
  team2: Team;
  tossWinner?: Team;
  matchWinner?: Team;
};

const HomePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('ongoing');

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

  const { data: polls, isLoading: isLoadingPolls } = useQuery({
    queryKey: ['/api/polls'],
    queryFn: async () => {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('Failed to fetch polls');
      return res.json();
    }
  });

  const now = new Date();
  const activePolls = polls?.filter(poll => new Date(poll.completionDate) > now) ?? [];
  const completedPolls = polls?.filter(poll => new Date(poll.completionDate) <= now) ?? [];

  const filterMatchesByStatus = (status: string) => {
    if (!matches) return [];
    return matches.filter(match => match.status === status);
  };

  const getUserPredictionForMatch = (matchId: number) => {
    if (!predictions) return undefined;
    return predictions.find(p => p.matchId === matchId);
  };

  const ongoingMatches = filterMatchesByStatus('ongoing');
  const upcomingMatches = filterMatchesByStatus('upcoming');
  const completedMatches = filterMatchesByStatus('completed');

  const renderMatchesSkeleton = () => {
    return Array.from({ length: 3 }).map((_, i) => (
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
        <Skeleton className="h-24 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    ));
  };

  const { isLoading: allPollsLoading } = useQuery({
    queryKey: ['polls', 'all'],
    queryFn: async () => {
      const [activeRes, completedRes] = await Promise.all([
        fetch('/api/polls/active'),
        fetch('/api/polls/completed')
      ]);
      const active = await activeRes.json();
      const completed = await completedRes.json();
      return { active, completed };
    },
    refetchOnWindowFocus: false
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <HeroSection />

      <div id="ongoing-matches" className="bg-white shadow-md rounded-lg mb-8">
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex justify-start border-b border-neutral-200 w-full rounded-none">
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent"
            >
              Ongoing
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:border-b-2 data-[state=active]:border-accent"
            >
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 font-heading text-neutral-800">
          {activeTab === 'ongoing' ? 'Ongoing Matches' : 
           activeTab === 'upcoming' ? 'Upcoming Matches' : 'Completed Matches'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingMatches ? (
            renderMatchesSkeleton()
          ) : activeTab === 'ongoing' && ongoingMatches.length > 0 ? (
            ongoingMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                userPrediction={getUserPredictionForMatch(match.id)}
              />
            ))
          ) : activeTab === 'upcoming' && upcomingMatches.length > 0 ? (
            upcomingMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                userPrediction={getUserPredictionForMatch(match.id)}
              />
            ))
          ) : activeTab === 'completed' && completedMatches.length > 0 ? (
            completedMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                userPrediction={getUserPredictionForMatch(match.id)}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-neutral-500">
              No {activeTab} matches found
            </div>
          )}
        </div>
      </div>

      {/* Audience Choice Polls */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 font-heading text-neutral-800">Audience Choice</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoadingPolls ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : (
            <>
              {activePolls?.map(poll => (
                <AudiencePoll key={poll.id} poll={poll} />
              ))}
              {completedPolls?.map(poll => (
                <AudiencePoll key={poll.id} poll={poll} />
              ))}
            </>
          )}
        </div>
      </div>

      <Leaderboard />
      <FeatureCards />
    </div>
  );
};

export default HomePage;