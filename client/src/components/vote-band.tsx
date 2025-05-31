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
    <div className="vote-band bg-gray-50 rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{totalPredictions} {type} prediction{totalPredictions !== 1 ? 's' : ''}</span>
        </div>
        <div className="text-xs text-gray-500 capitalize">{type} Winner</div>
      </div>
      
      <div className="space-y-2">
        {/* Team 1 Vote Bar */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-700 min-w-0 flex-1 truncate">
            {team1Name}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${type === 'toss' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${currentStats.team1.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className={`text-sm font-semibold min-w-[2.5rem] text-right ${type === 'toss' ? 'text-yellow-600' : 'text-blue-600'}`}>
              {currentStats.team1.percentage}%
            </span>
          </div>
        </div>

        {/* Team 2 Vote Bar */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-700 min-w-0 flex-1 truncate">
            {team2Name}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${type === 'toss' ? 'bg-orange-500' : 'bg-red-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${currentStats.team2.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
            <span className={`text-sm font-semibold min-w-[2.5rem] text-right ${type === 'toss' ? 'text-orange-600' : 'text-red-600'}`}>
              {currentStats.team2.percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}