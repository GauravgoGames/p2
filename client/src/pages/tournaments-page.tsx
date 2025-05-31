import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  matchCount?: number;
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/tournaments/${tournament.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <div className="relative">
            {tournament.imageUrl ? (
              <img 
                src={tournament.imageUrl} 
                alt={tournament.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Trophy className="h-16 w-16 text-blue-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white shadow-lg">{tournament.name}</h3>
            </div>
          </div>
          
          <CardContent className="p-4">
            {tournament.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tournament.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{tournament.matchCount || 0} matches</span>
              </div>
              
              {tournament.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const { data: tournaments = [], isLoading, error } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    },
    retry: 1,
  });

  // Function to determine tournament status based on dates
  const getTournamentStatus = (tournament: Tournament) => {
    const now = new Date();
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
    
    if (!startDate) return 'upcoming'; // No start date means upcoming
    if (startDate > now) return 'upcoming';
    if (endDate && endDate < now) return 'completed';
    return 'ongoing';
  };

  // Filter tournaments by status
  const filterTournamentsByStatus = (status: string) => {
    if (status === 'all') return tournaments;
    return tournaments.filter(tournament => getTournamentStatus(tournament) === status);
  };

  const filteredTournaments = filterTournamentsByStatus(activeTab);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Unable to Load Tournaments</h2>
          <p className="text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tournaments</h1>
        <p className="text-lg text-gray-600">
          Explore cricket tournaments and predict match outcomes
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Tournaments Yet</h2>
          <p className="text-gray-500">Check back soon for upcoming tournaments!</p>
        </div>
      ) : (
        <div>
          {/* Tournament Status Filter Tabs */}
          <div className="mb-8">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex justify-start border-b border-neutral-200 w-full rounded-none">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-accent"
                >
                  All Tournaments
                </TabsTrigger>
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

          {/* Tournament Grid */}
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">
                No {activeTab === 'all' ? '' : activeTab} tournaments found
              </h2>
              <p className="text-gray-500">
                {activeTab === 'all' 
                  ? 'Check back soon for upcoming tournaments!' 
                  : `No ${activeTab} tournaments at the moment.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}