
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, PieChart, Check, X, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  profileImage?: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
  viewedByCount: number;
  isVerified: boolean;
}



interface Prediction {
  id: number;
  matchId: number;
  matchTitle: string;
  prediction: string;
  result: string;
  createdAt: string;
  match: {
    team1Name: string;
    team2Name: string;
    status: string;
    tournamentId?: number;
  };
  predictedTossWinnerId?: number;
  predictedMatchWinnerId?: number;
  predictedTossWinner?: {
    id: number;
    name: string;
  };
  predictedMatchWinner?: {
    id: number;
    name: string;
  };
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading, error } = useQuery<UserProfile>({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user');
      }
      return res.json();
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 404s
      if (error?.message === 'User not found') {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });







  // Mutation to increment view count
  const viewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/view`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to update view count');
      return res.json();
    },
  });

  // Automatically increment view count when profile loads
  useEffect(() => {
    if (user && username) {
      viewMutation.mutate();
    }
  }, [user?.id]); // Only trigger when user ID changes

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: [`/api/users/${username}/predictions`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!username,
    retry: 1
  });

  // Get tournaments to check for toss prediction hiding
  const { data: tournaments = [] } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    },
  });

  if (userLoading || predictionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User Not Found</h2>
                <p className="text-gray-600 mt-1">
                  {error?.message === 'User not found' 
                    ? 'This user does not exist or may have been removed.'
                    : 'There was an error loading this profile. Please try again later.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics - only count completed matches
  const completedPredictions = predictions?.filter((p: any) => 
    p.match && (p.match.status === 'completed' || p.match.status === 'tie' || p.match.status === 'void')
  ) || [];
  
  const totalMatches = completedPredictions.length;
  const correctPredictions = completedPredictions.reduce((acc: number, p: any) => {
    let correct = 0;
    const match = p.match;
    
    // Find tournament to check if toss predictions are hidden
    const tournament = tournaments.find((t: any) => t.id === match.tournamentId);
    const hideTossPredictions = tournament?.hideTossPredictions || false;
    
    // Only count toss predictions if not hidden
    if (!hideTossPredictions && match.tossWinnerId && p.predictedTossWinnerId === match.tossWinnerId) {
      correct++;
    }
    
    if (match.matchWinnerId && p.predictedMatchWinnerId === match.matchWinnerId) {
      correct++;
    }
    
    return acc + correct;
  }, 0) || 0;
  
  // Calculate total possible predictions (considering hidden toss predictions)
  const totalPossiblePredictions = completedPredictions.reduce((acc: number, p: any) => {
    const tournament = tournaments.find((t: any) => t.id === p.match.tournamentId);
    const hideTossPredictions = tournament?.hideTossPredictions || false;
    return acc + (hideTossPredictions ? 1 : 2); // 1 if toss hidden, 2 if both predictions count
  }, 0);
  
  const accuracy = totalPossiblePredictions > 0 ? (correctPredictions / totalPossiblePredictions * 100).toFixed(1) : '0.0';

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-32 w-32 border-4 border-neutral-100">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback className="text-4xl">
                    {user.displayName?.[0] || user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold mt-4">{user.displayName || user.username}</h1>
                <p className="text-neutral-600">@{user.username}</p>
                {user.isVerified && (
                  <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-blue-100 rounded-full">
                    <Check className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Verified</span>
                  </div>
                )}

                {/* Social engagement metrics */}
                <div className="flex justify-center mt-6 w-full">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 rounded-md bg-neutral-50">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{user.viewedByCount || 0}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Viewed By</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Stats & Predictions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Statistics Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-full inline-block shadow-md mb-2">
                      <Trophy className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-700">{user.points || 0}</div>
                    <p className="text-sm font-medium text-blue-800">Total Points</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-full inline-block shadow-md mb-2">
                      <PieChart className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-700">{accuracy}%</div>
                    <p className="text-sm font-medium text-green-800">Prediction Accuracy</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-full inline-block shadow-md mb-2">
                      <div className="flex">
                        <Check className="h-8 w-8 text-green-500" />
                        <span className="mx-1 text-gray-300">|</span>
                        <X className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-700">{correctPredictions}/{totalPossiblePredictions}</div>
                    <p className="text-sm font-medium text-purple-800">Correct Predictions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Predictions Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Predictions</h2>
            {predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map((prediction) => {
                  // Find tournament to check if it's premium and has hidden toss predictions
                  const tournament = tournaments.find((t: any) => t.id === prediction.match.tournamentId);
                  const isPremium = tournament?.isPremium || false;
                  const hideTossPredictions = tournament?.hideTossPredictions || false;
                  

                  
                  return (
                    <Card key={prediction.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{prediction.matchTitle}</h3>
                          {(isPremium || tournament?.isPremium) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                              <Trophy className="h-4 w-4 text-amber-600" />
                              <span className="text-xs text-amber-600 font-medium">Premium</span>
                            </div>
                          )}
                        </div>
                        <p className="text-neutral-600 mb-2">
                          {prediction.match.team1Name} vs {prediction.match.team2Name}
                        </p>
                        <div className="space-y-2">
                          {/* Show toss prediction ONLY if tournament allows it AND data exists */}
                          {!isPremium && !hideTossPredictions && prediction.predictedTossWinnerId && prediction.predictedTossWinner && (
                            <div className="text-sm">
                              <span className="text-yellow-600 font-medium">Toss Winner:</span>{" "}
                              <strong>{prediction.predictedTossWinner.name}</strong>
                            </div>
                          )}
                          
                          {/* Premium tournaments - no toss prediction shown */}
                          {isPremium && hideTossPredictions && (
                            <div className="text-sm text-gray-500 italic">
                              Toss predictions hidden for premium tournaments
                            </div>
                          )}
                          
                          {/* Always show match prediction */}
                          {prediction.predictedMatchWinnerId && prediction.predictedMatchWinner && (
                            <div className="text-sm">
                              <span className="text-blue-600 font-medium">Match Winner:</span>{" "}
                              <strong>{prediction.predictedMatchWinner.name}</strong>
                            </div>
                          )}
                          
                          {prediction.match.status === 'completed' && (
                            <div className="text-sm text-green-600">
                              <span className="font-medium">Status:</span> <strong>Completed</strong>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 border-dashed border-2 border-gray-200 bg-gray-50">
                <div className="text-center py-6 text-gray-600">
                  <div className="mb-3">
                    <Trophy className="h-12 w-12 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Predictions Yet</h3>
                  <p>This user hasn't made any predictions yet.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
