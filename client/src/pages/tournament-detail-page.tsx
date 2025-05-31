import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MatchCard from '@/components/match-card';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

interface Match {
  id: number;
  tournamentName: string;
  team1: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  team2: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  location: string;
  matchDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'tie' | 'void';
  tossWinnerId?: number;
  matchWinnerId?: number;
  team1Score?: string;
  team2Score?: string;
  resultSummary?: string;
}

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id ? parseInt(params.id) : null;

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) throw new Error('Failed to fetch tournament');
      return response.json();
    },
    enabled: !!tournamentId,
    retry: 1,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!tournamentId,
    retry: 1,
  });

  // Get user predictions for all matches
  const { data: userPredictions = [] } = useQuery({
    queryKey: ['/api/predictions'],
    queryFn: async () => {
      const response = await fetch('/api/predictions');
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json();
    }
  });

  if (tournamentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="mb-8">
          <Skeleton className="h-64 w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Tournament Not Found</h2>
          <p className="text-gray-500 mb-4">The tournament you're looking for doesn't exist.</p>
          <Link href="/tournaments">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/tournaments">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>
      </Link>

      {/* Tournament Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card className="overflow-hidden">
          <div className="relative">
            {tournament.imageUrl ? (
              <img 
                src={tournament.imageUrl} 
                alt={tournament.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Trophy className="h-24 w-24 text-blue-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-4xl font-bold text-white shadow-lg mb-2">{tournament.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{matches.length} matches</span>
                </div>
                {tournament.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {tournament.description && (
            <CardContent className="p-6">
              <p className="text-gray-600 text-lg leading-relaxed">{tournament.description}</p>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Matches Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Matches</h2>
        
        {matchesLoading ? (
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Card className="p-8 border-dashed border-2 border-gray-200 bg-gray-50">
            <div className="text-center py-6 text-gray-600">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-2">No Matches Yet</h3>
              <p>Matches for this tournament haven't been scheduled yet.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match, index) => {
              const userPrediction = userPredictions.find((p: any) => p.matchId === match.id);
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <MatchCard match={match} userPrediction={userPrediction} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}