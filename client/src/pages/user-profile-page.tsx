
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, PieChart, Check, X } from 'lucide-react';
import MatchCard from '@/components/match-card';

const UserProfilePage = () => {
  const { username } = useParams();

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });

  const { data: predictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ['/api/users', username, 'predictions'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
  });

  const totalPredictions = predictions?.length * 2 || 0;
  const correctPredictions = predictions?.reduce((acc: number, p: any) => {
    let correct = 0;
    const match = p.match;
    if (match.tossWinnerId && p.predictedTossWinnerId === match.tossWinnerId) correct++;
    if (match.matchWinnerId && p.predictedMatchWinnerId === match.matchWinnerId) correct++;
    return acc + correct;
  }, 0) || 0;
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100).toFixed(1) : '0.0';

  if (isLoadingUser) {
    return <div className="container max-w-6xl mx-auto px-4 py-8">Loading...</div>;
  }

  if (!userData) {
    return <div className="container max-w-6xl mx-auto px-4 py-8">User not found</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={userData.profileImage} alt={userData.username} />
          <AvatarFallback>{userData.displayName?.[0] || userData.username[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{userData.displayName || userData.username}</h1>
          {userData.displayName && <p className="text-neutral-600">@{userData.username}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="bg-white p-3 rounded-full inline-block shadow-md mb-2">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-blue-700">{userData.points || 0}</div>
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
              <div className="text-3xl font-bold text-purple-700">{correctPredictions}/{totalPredictions}</div>
              <p className="text-sm font-medium text-purple-800">Correct Predictions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Predictions</h2>
      {isLoadingPredictions ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : predictions && predictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((prediction: any) => (
            <Card key={prediction.id} className="overflow-hidden border-none shadow-lg">
              <CardContent className="p-0">
                <MatchCard match={prediction.match} userPrediction={prediction} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-neutral-600">
          <Trophy className="h-12 w-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">No Predictions Yet</h3>
          <p>This user hasn't made any predictions yet.</p>
        </Card>
      )}
    </div>
  );
};

export default UserProfilePage;
