
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, PieChart, Check, X, Heart, Eye, CheckCircle } from "lucide-react";
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
  lovedByCount: number;
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
  };
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    retry: 1
  });

  // Query to check if current user has loved this profile
  const { data: loveStatus } = useQuery({
    queryKey: [`/api/users/${username}/love-status`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/love-status`, {
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) return { isLoved: false };
        throw new Error('Failed to fetch love status');
      }
      return res.json();
    },
    retry: false
  });



  // Mutation for authenticated love toggle
  const loveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/love`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to love users');
        }
        throw new Error('Failed to update love status');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/love-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/lovers`] });
      toast({
        title: data.isLoved ? "Mark Loved" : "Mark Unloved",
        description: data.isLoved ? "You have loved this user." : "You have unloved this user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">User not found</p>
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
    if (match.tossWinnerId && p.predictedTossWinnerId === match.tossWinnerId) correct++;
    if (match.matchWinnerId && p.predictedMatchWinnerId === match.matchWinnerId) correct++;
    return acc + correct;
  }, 0) || 0;
  
  const totalPossiblePredictions = totalMatches * 2;
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
                <div className="flex gap-4 mt-6 w-full">
                  <div className="flex-1 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loveMutation.mutate()}
                      disabled={loveMutation.isPending}
                      className={`w-full flex items-center gap-2 transition-colors ${
                        loveStatus?.isLoved 
                          ? 'bg-pink-50 border-pink-300 text-pink-700' 
                          : 'hover:bg-pink-50 hover:border-pink-300'
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          loveStatus?.isLoved 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-pink-500'
                        }`} 
                      />
                      <span className="text-sm">{user.lovedByCount || 0}</span>
                    </Button>
                    <p className="text-xs text-neutral-500 mt-1">
                      {loveStatus?.isLoved ? 'Loved' : 'Love'}
                    </p>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50">
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
                    <div className="text-3xl font-bold text-purple-700">{correctPredictions}/{totalMatches > 0 ? totalMatches * 2 : 0}</div>
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
                {predictions.map((prediction) => (
                  <Card key={prediction.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{prediction.matchTitle}</h3>
                      <p className="text-neutral-600 mb-2">
                        {prediction.match.team1Name} vs {prediction.match.team2Name}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span>Prediction: <strong>{prediction.prediction}</strong></span>
                        {prediction.match.status === 'completed' && (
                          <span>Result: <strong>{prediction.result}</strong></span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
