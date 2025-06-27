import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface VoteBandProps {
  matchId: number;
  team1Name: string;
  team2Name: string;
  type: 'toss' | 'match';
}

interface PredictionStats {
  matchId: number;
  totalPredictions: number;
  toss: {
    team1: {
      id: number;
      name: string;
      predictions: number;
      percentage: number;
    };
    team2: {
      id: number;
      name: string;
      predictions: number;
      percentage: number;
    };
  };
  match: {
    team1: {
      id: number;
      name: string;
      predictions: number;
      percentage: number;
    };
    team2: {
      id: number;
      name: string;
      predictions: number;
      percentage: number;
    };
  };
}

export default function VoteBand({ matchId, team1Name, team2Name, type }: VoteBandProps) {
  const { data: stats, isLoading, error } = useQuery<PredictionStats>({
    queryKey: [`/api/matches/${matchId}/prediction-stats`],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/prediction-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch prediction stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
    enabled: true,
  });

  const currentStats = stats?.[type];
  const hasData = currentStats && (currentStats.team1.predictions > 0 || currentStats.team2.predictions > 0);

  if (isLoading || !stats || !hasData) {
    return (
      <div className="vote-band bg-gray-50 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>No {type} predictions yet</span>
        </div>
      </div>
    );
  }

  const totalPredictions = currentStats.team1.predictions + currentStats.team2.predictions;

  return (
    <div className="vote-band bg-gray-50 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'toss' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            <span className={`text-lg font-bold ${type === 'toss' ? 'text-yellow-600' : 'text-blue-600'}`}>
              {type === 'toss' ? '1' : '2'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Who will win the {type}?
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {totalPredictions} vote{totalPredictions !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="relative">
        {/* Background bar */}
        <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden">
          {/* Team 1 bar - render from left */}
          {currentStats.team1.percentage > 0 && (
            <motion.div
              className={`absolute top-0 left-0 h-full flex items-center px-3 ${
                type === 'toss' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
              style={{ zIndex: currentStats.team1.percentage === 100 ? 2 : 1 }}
              initial={{ width: 0 }}
              animate={{ width: `${currentStats.team1.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-white text-sm font-semibold drop-shadow">
                {currentStats.team1.percentage}%
              </span>
            </motion.div>
          )}
          
          {/* Team 2 bar - render from right */}
          {currentStats.team2.percentage > 0 && (
            <motion.div
              className={`absolute top-0 right-0 h-full flex items-center px-3 ${
                type === 'toss' ? 'bg-gradient-to-l from-orange-400 to-orange-500' : 'bg-gradient-to-l from-green-400 to-green-500'
              }`}
              style={{ zIndex: currentStats.team2.percentage === 100 ? 2 : 1 }}
              initial={{ width: 0 }}
              animate={{ width: `${currentStats.team2.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              <span className="text-white text-sm font-semibold drop-shadow ml-auto">
                {currentStats.team2.percentage}%
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Team labels below the bar */}
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              type === 'toss' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />
            <span className="text-sm font-medium text-gray-700">{team1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{team2Name}</span>
            <div className={`w-3 h-3 rounded-full ${
              type === 'toss' ? 'bg-orange-500' : 'bg-green-500'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}