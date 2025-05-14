import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Match, Team, Prediction } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, XCircle, Trophy, Clock, Activity } from 'lucide-react';
import { format, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MatchCardProps {
  match: Match & {
    team1: Team;
    team2: Team;
    tossWinner?: Team;
    matchWinner?: Team;
  };
  userPrediction?: Prediction;
  tossPredictions?: { [teamId: number]: number };
  matchPredictions?: { [teamId: number]: number };
}

const MatchCard = ({ match, userPrediction, tossPredictions, matchPredictions }: MatchCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [predictionState, setPredictionState] = useState({
    predictedTossWinnerId: userPrediction?.predictedTossWinnerId || null,
    predictedMatchWinnerId: userPrediction?.predictedMatchWinnerId || null,
  });

  const [countdown, setCountdown] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const predictionMutation = useMutation({
    mutationFn: async () => {
      if (!predictionState.predictedTossWinnerId || !predictionState.predictedMatchWinnerId) {
        throw new Error('Please select both toss and match winners');
      }

      const predictionData = {
        matchId: match.id,
        predictedTossWinnerId: predictionState.predictedTossWinnerId,
        predictedMatchWinnerId: predictionState.predictedMatchWinnerId
      };

      await apiRequest('POST', '/api/predictions', predictionData);
    },
    onSuccess: () => {
      toast({
        title: 'Prediction Submitted',
        description: 'Your prediction has been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/predictions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Prediction Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'upcoming';
      case 'ongoing':
        return 'live';
      case 'completed':
        return 'completed';
      default:
        return 'default';
    }
  };

  const handleTeamSelect = (type: 'toss' | 'match', teamId: number) => {
    if (match.status !== 'upcoming') return;

    if (type === 'toss') {
      setPredictionState(prev => ({
        ...prev,
        predictedTossWinnerId: prev.predictedTossWinnerId === teamId ? null : teamId
      }));
    } else {
      setPredictionState(prev => ({
        ...prev,
        predictedMatchWinnerId: prev.predictedMatchWinnerId === teamId ? null : teamId
      }));
    }
  };

  const handleSubmitPrediction = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit predictions',
        variant: 'destructive',
      });
      return;
    }

    predictionMutation.mutate();
  };

  // Handle match status update when timer hits zero
  const updateMatchStatus = async () => {
    if (match.status === 'upcoming' && timeRemaining <= 0) {
      try {
        // Update match status to 'ongoing' when time expires
        await apiRequest('PATCH', `/api/matches/${match.id}/status`, { status: 'ongoing' });
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });

        // Lock predictions for this match
        queryClient.invalidateQueries({ queryKey: ['/api/predictions'] });
      } catch (error) {
        console.error('Failed to update match status:', error);
      }
    }
  };

  // Calculate and update countdown timer
  useEffect(() => {
    if (match.status === 'upcoming') {
      const timer = setInterval(() => {
        const now = new Date();
        const matchTime = new Date(match.matchDate);
        const seconds = differenceInSeconds(matchTime, now);

        setTimeRemaining(seconds);

        if (seconds <= 0) {
          clearInterval(timer);
          setCountdown('Starting now');
          // Update match status when countdown ends
          updateMatchStatus();
          return;
        }

        const days = differenceInDays(matchTime, now);
        const hours = differenceInHours(matchTime, now) % 24;
        const minutes = differenceInMinutes(matchTime, now) % 60;
        const remainingSeconds = seconds % 60;

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${remainingSeconds}s`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${remainingSeconds}s`);
        } else {
          setCountdown(`${remainingSeconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else if (match.status === 'ongoing') {
      setCountdown('LIVE');
    } else {
      setCountdown('Completed');
    }
  }, [match.matchDate, match.status, queryClient]);

  const formatMatchTime = (date: Date | string) => {
    const matchDate = new Date(date);
    const now = new Date();
    const isToday = matchDate.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${format(matchDate, 'h:mm a')}`;
    }

    return format(matchDate, 'dd MMM, h:mm a');
  };

  const getPointsEarned = () => {
    if (!userPrediction || !userPrediction.pointsEarned) return 0;
    return userPrediction.pointsEarned;
  };

  // Determine expert choices
  const getExpertChoice = (type: 'toss' | 'match'): number | null => {
    const predictions = type === 'toss' ? tossPredictions : matchPredictions;
    if (!predictions) return null;

    const team1Count = predictions[match.team1Id] || 0;
    const team2Count = predictions[match.team2Id] || 0;
    
    if (team1Count > team2Count && team1Count > 0) {
      return match.team1Id;
    } else if (team2Count > team1Count && team2Count > 0) {
      return match.team2Id;
    }
    return null; // In case of a tie or no predictions
  };

  const expertTossChoice = getExpertChoice('toss');
  const expertMatchChoice = getExpertChoice('match');

  return (
    <div className="match-card bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="lightning" />
      <div className="p-4 relative">
        {match.status === 'ongoing' ? (
          <motion.div 
            className="absolute top-4 right-4 z-10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Badge 
              variant="live" 
              className="status-badge flex items-center gap-1 bg-red-500 text-white px-3 py-1 font-semibold"
            >
              <Activity className="h-3 w-3" /> LIVE
            </Badge>
          </motion.div>
        ) : (
          <div className="absolute top-4 right-4 z-10">
            <Badge 
              variant={getStatusBadgeVariant(match.status)} 
              className={`status-badge px-3 py-1 font-semibold ${
                match.status === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              {match.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
            </Badge>
          </div>
        )}

        {/* Tournament and Date Section - Rearranged to prevent overlap */}
        <div className="flex flex-col gap-2 mb-6 mt-8">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-neutral-700">{match.tournamentName}</div>
            <div className="text-sm text-neutral-700">{formatMatchTime(match.matchDate)}</div>
          </div>

          {match.status === 'upcoming' && (
            <div className="flex items-center gap-1 w-fit text-sm font-medium text-neutral-700 bg-gray-100 px-2 py-1 rounded-md">
              <Clock className="h-3 w-3 text-primary" />
              {countdown}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          
          <div className="team-display flex flex-col items-center relative">
                {expertTossChoice === match.team1Id && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-xs px-2 py-1 rounded-full text-white font-bold shadow-md z-10">
                    Toss Expert Choice
                  </div>
                )}
                {expertMatchChoice === match.team1Id && (
                  <div className="absolute -top-6 -right-2 bg-emerald-400 text-xs px-2 py-1 rounded-full text-white font-bold shadow-md z-10">
                    Match Expert Choice
                  </div>
                )}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-2 border-2 border-gray-100 overflow-hidden shadow-lg">
              <img 
                src={match.team1.logoUrl || 'https://via.placeholder.com/80'} 
                alt={match.team1.name} 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="font-semibold text-gray-800">{match.team1.name}</div>
            {match.team1Score && (
              <div className={`text-sm font-bold ${match.matchWinnerId === match.team1Id ? 'text-emerald-600' : 'text-neutral-600'}`}>
                {match.team1Score}
              </div>
            )}
            {match.tossWinnerId === match.team1Id && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs px-1.5 py-0.5 rounded-full text-white font-bold shadow-md">
                Toss
              </div>
            )}
          </div>

          <div className="vs-badge relative">
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-primary flex items-center justify-center shadow-lg border-4 border-white overflow-hidden"
              animate={{ 
                boxShadow: ["0px 0px 8px 2px rgba(59, 130, 246, 0.6)", "0px 0px 16px 4px rgba(59, 130, 246, 0.8)", "0px 0px 8px 2px rgba(59, 130, 246, 0.6)"]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ 
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-20"
                style={{ 
                  clipPath: "polygon(40% 0%, 60% 0%, 100% 50%, 60% 100%, 40% 100%, 0% 50%)",
                  transform: "rotate(25deg)" 
                }}
              />
              <div className="text-xl font-bold text-white relative z-10">VS</div>
            </motion.div>
          </div>

          
          <div className="team-display flex flex-col items-center relative">
                {expertTossChoice === match.team2Id && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-xs px-2 py-1 rounded-full text-white font-bold shadow-md z-10">
                    Toss Expert Choice
                  </div>
                )}
                {expertMatchChoice === match.team2Id && (
                  <div className="absolute -top-6 -right-2 bg-emerald-400 text-xs px-2 py-1 rounded-full text-white font-bold shadow-md z-10">
                    Match Expert Choice
                  </div>
                )}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-2 border-2 border-gray-100 overflow-hidden shadow-lg">
                  <img 
                    src={match.team2.logoUrl || 'https://via.placeholder.com/80'} 
                    alt={match.team2.name} 
                    className="w-16 h-16 object-contain"
                  />
            </div>
            <div className="font-semibold text-gray-800">{match.team2.name}</div>
            {match.team2Score && (
              <div className={`text-sm font-bold ${match.matchWinnerId === match.team2Id ? 'text-emerald-600' : 'text-neutral-600'}`}>
                {match.team2Score}
              </div>
            )}
            {match.tossWinnerId === match.team2Id && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs px-1.5 py-0.5 rounded-full text-white font-bold shadow-md">
                Toss
              </div>
            )}
          </div>
        </div>

        {match.status === 'completed' ? (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            {/* Match Result Summary */}
            <div className="text-center mb-4">
              <div className="text-sm text-neutral-500 mb-1">Match Result</div>
              <div className="font-bold text-lg">{match.resultSummary}</div>
            </div>

            {userPrediction && (
              <div className="space-y-4">
                {/* Toss Result */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <div className="text-neutral-500 font-medium text-center mb-1">Toss</div>
                    {match.tossWinnerId && (
                      <div className="flex items-center justify-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          {match.tossWinnerId === match.team1Id ? match.team1.name : match.team2.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1">
                    <div className="text-neutral-500 font-medium text-center mb-1">Your Prediction</div>
                    <div className="flex items-center justify-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                      {userPrediction.predictedTossWinnerId === match.tossWinnerId ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium">
                        {userPrediction.predictedTossWinnerId === match.team1Id ? match.team1.name : match.team2.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Winner Result */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <div className="text-neutral-500 font-medium text-center mb-1">Winner</div>
                    {match.matchWinnerId && (
                      <div className="flex items-center justify-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">
                          {match.matchWinnerId === match.team1Id ? match.team1.name : match.team2.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1">
                    <div className="text-neutral-500 font-medium text-center mb-1">Your Prediction</div>
                    <div className="flex items-center justify-center gap-2 bg-gray-50 py-2 px-3 rounded-md">
                      {userPrediction.predictedMatchWinnerId === match.matchWinnerId ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium">
                        {userPrediction.predictedMatchWinnerId === match.team1Id ? match.team1.name : match.team2.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="predictions-container">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <div className="h-5 w-5 rounded-full bg-yellow-400 mr-2 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">1</span>
                </div>
                Who will win the toss?
              </div>

              <div className="flex space-x-3">
                <button 
                  className={cn(
                    "prediction-option flex-1 py-3 px-4 rounded-lg text-center transition-all duration-200",
                    predictionState.predictedTossWinnerId === match.team1Id 
                      ? "bg-gradient-to-r from-blue-500 to-primary text-white font-medium shadow-md" 
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  )}
                  onClick={() => handleTeamSelect('toss', match.team1Id)}
                  disabled={match.status !== 'upcoming' || !user}
                >
                  <div className="flex items-center justify-center">
                    <img 
                      src={match.team1.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team1.name} 
                      className="w-6 h-6 object-contain rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{match.team1.name}</span>
                  </div>
                </button>

                <button 
                  className={cn(
                    "prediction-option flex-1 py-3 px-4 rounded-lg text-center transition-all duration-200",
                    predictionState.predictedTossWinnerId === match.team2Id 
                      ? "bg-gradient-to-r from-blue-500 to-primary text-white font-medium shadow-md" 
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  )}
                  onClick={() => handleTeamSelect('toss', match.team2Id)}
                  disabled={match.status !== 'upcoming' || !user}
                >
                  <div className="flex items-center justify-center">
                    <img 
                      src={match.team2.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team2.name} 
                      className="w-6 h-6 object-contain rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{match.team2.name}</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <div className="h-5 w-5 rounded-full bg-yellow-400 mr-2 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">2</span>
                </div>
                Who will win the match?
              </div>

              <div className="flex space-x-3">
                <button 
                  className={cn(
                    "prediction-option flex-1 py-3 px-4 rounded-lg text-center transition-all duration-200",
                    predictionState.predictedMatchWinnerId === match.team1Id 
                      ? "bg-gradient-to-r from-blue-500 to-primary text-white font-medium shadow-md" 
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  )}
                  onClick={() => handleTeamSelect('match', match.team1Id)}
                  disabled={match.status !== 'upcoming' || !user}
                >
                  <div className="flex items-center justify-center">
                    <img 
                      src={match.team1.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team1.name} 
                      className="w-6 h-6 object-contain rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{match.team1.name}</span>
                  </div>
                </button>

                <button 
                  className={cn(
                    "prediction-option flex-1 py-3 px-4 rounded-lg text-center transition-all duration-200",
                    predictionState.predictedMatchWinnerId === match.team2Id 
                      ? "bg-gradient-to-r from-blue-500 to-primary text-white font-medium shadow-md" 
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  )}
                  onClick={() => handleTeamSelect('match', match.team2Id)}
                  disabled={match.status !== 'upcoming' || !user}
                >
                  <div className="flex items-center justify-center">
                    <img 
                      src={match.team2.logoUrl || 'https://via.placeholder.com/32'} 
                      alt={match.team2.name} 
                      className="w-6 h-6 object-contain rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{match.team2.name}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 flex justify-between items-center rounded-b-xl border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 flex items-center">
          <div className="bg-white p-1 rounded-full shadow-sm mr-2">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          {match.location}
        </div>

        {match.status === 'upcoming' ? (
          user ? (
            <Button 
              size="sm"
              onClick={handleSubmitPrediction}
              disabled={
                !predictionState.predictedTossWinnerId || 
                !predictionState.predictedMatchWinnerId || 
                predictionMutation.isPending
              }
              className={`px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all ${
                !predictionState.predictedTossWinnerId || !predictionState.predictedMatchWinnerId
                ? 'bg-gray-300 text-gray-600'
                : 'bg-gradient-to-r from-blue-600 to-primary text-white hover:from-blue-700 hover:to-blue-600'
              }`}
            >
              {predictionMutation.isPending ? 'Submitting...' : userPrediction ? 'Update Prediction' : 'Submit Prediction'}
            </Button>
          ) : (
            <div className="px-4 py-2 bg-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              Login to predict
            </div>
          )
        ) : match.status === 'ongoing' ? (
          <div className="px-4 py-2 bg-red-100 rounded-full text-sm font-medium text-red-600 flex items-center shadow-sm border border-red-200">
            <Activity className="h-3 w-3 mr-1" />
            {userPrediction ? 'Prediction Locked' : 'Predictions Closed'}
          </div>
        ) : (
          <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border ${
            getPointsEarned() > 0 
              ? 'bg-green-100 text-green-600 border-green-200' 
              : 'bg-orange-100 text-orange-600 border-orange-200'
          }`}>
            {getPointsEarned() > 0 ? (
              <div className="flex items-center">
                <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                <span>+{getPointsEarned()} Points</span>
              </div>
            ) : userPrediction ? (
              'No points earned'
            ) : (
              'No prediction made'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;