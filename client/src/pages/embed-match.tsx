import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VoteBand from '@/components/vote-band';
import { useEffect, useState } from 'react';

export default function EmbedMatch() {
  const [countdown, setCountdown] = useState('');
  
  const { data: matches, isLoading } = useQuery<any[]>({
    queryKey: ['/api/matches'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get the latest upcoming match
  const latestMatch = matches?.find((match: any) => 
    match.status === 'upcoming' || match.status === 'ongoing'
  ) || matches?.[0];

  useEffect(() => {
    if (!latestMatch || latestMatch.status === 'completed') return;

    const interval = setInterval(() => {
      const now = new Date();
      const matchDate = new Date(latestMatch.matchDate);
      const diff = matchDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Match Started');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m`);
        } else {
          setCountdown(`${hours}h ${minutes}m`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [latestMatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!latestMatch) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">No matches available</p>
      </div>
    );
  }

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4">
            {latestMatch.status === 'ongoing' ? (
              <motion.div 
                className="absolute top-4 right-4 z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Badge className="bg-red-500 text-white px-3 py-1 font-semibold">
                  <Activity className="h-3 w-3 mr-1" /> LIVE
                </Badge>
              </motion.div>
            ) : (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-blue-500 text-white px-3 py-1 font-semibold">
                  UPCOMING
                </Badge>
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700">{latestMatch.tournamentName}</div>
              <div className="text-sm text-gray-600">{formatMatchTime(latestMatch.matchDate)}</div>
              {latestMatch.status === 'upcoming' && (
                <div className="flex items-center gap-1 mt-2 text-sm font-medium text-gray-700">
                  <Clock className="h-3 w-3" />
                  {countdown}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <img 
                    src={latestMatch.team1.logoUrl || '/assets/flags/default.svg'} 
                    alt={latestMatch.team1.name} 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="font-semibold">{latestMatch.team1.name}</div>
              </div>

              <div className="text-2xl font-bold text-gray-400">VS</div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <img 
                    src={latestMatch.team2.logoUrl || '/assets/flags/default.svg'} 
                    alt={latestMatch.team2.name} 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="font-semibold">{latestMatch.team2.name}</div>
              </div>
            </div>

            {latestMatch.status !== 'completed' && (
              <div className="space-y-2">
                <VoteBand 
                  matchId={latestMatch.id} 
                  team1Name={latestMatch.team1.name} 
                  team2Name={latestMatch.team2.name} 
                  type="toss"
                />
                <VoteBand 
                  matchId={latestMatch.id} 
                  team1Name={latestMatch.team1.name} 
                  team2Name={latestMatch.team2.name} 
                  type="match"
                />
              </div>
            )}

            <div className="mt-6 text-center">
              <a 
                href={`${window.location.origin}/predict-now`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Make Your Prediction
              </a>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}