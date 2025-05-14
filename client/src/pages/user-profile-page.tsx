
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Award } from 'lucide-react';

export default function UserProfilePage() {
  const [, params] = useParams();
  const username = params?.username;

  const { data: user, isError } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    retry: false
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
  });

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const correctPredictions = predictions?.filter((p: any) => 
    (p.match.tossWinnerId === p.predictedTossWinnerId) || 
    (p.match.matchWinnerId === p.predictedMatchWinnerId)
  ).length || 0;

  const totalPredictions = predictions?.length * 2 || 0;
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100).toFixed(1) : '0';

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="text-2xl">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
              <p className="text-gray-500 mb-4">@{user.username}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <div className="text-2xl font-bold text-blue-700">{user.points}</div>
                  <p className="text-sm font-medium text-blue-800">Total Points</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold text-green-700">{accuracy}%</div>
                  <p className="text-sm font-medium text-green-800">Prediction Accuracy</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <div className="text-2xl font-bold text-purple-700">{correctPredictions}/{totalPredictions}</div>
                  <p className="text-sm font-medium text-purple-800">Correct Predictions</p>
                </CardContent>
              </Card>
            </div>

            {predictions && predictions.length > 0 && (
              <div className="w-full mt-8">
                <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
                <div className="space-y-3">
                  {predictions.slice(0, 5).map((prediction: any) => (
                    <Card key={prediction.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{prediction.match.team1.name} vs {prediction.match.team2.name}</p>
                            <p className="text-sm text-gray-500">
                              Predicted Winner: {prediction.predictedMatchWinner.name}
                            </p>
                          </div>
                          {prediction.match.status === 'completed' && (
                            <Badge variant={prediction.match.matchWinnerId === prediction.predictedMatchWinnerId ? "success" : "destructive"}>
                              {prediction.match.matchWinnerId === prediction.predictedMatchWinnerId ? "Correct" : "Incorrect"}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
