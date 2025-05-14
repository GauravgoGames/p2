
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
  profileImage?: string;
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

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!username,
    retry: 1
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: [`/api/users/${username}/predictions`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!username && !!user,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
              <p className="text-neutral-600">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Total Points</p>
                  <p className="text-2xl font-bold">{user.points || 0}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Correct Predictions</p>
                  <p className="text-2xl font-bold">{user.correctPredictions || 0}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Total Matches</p>
                  <p className="text-2xl font-bold">{user.totalMatches || 0}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((prediction) => (
                    <Card key={prediction.id}>
                      <CardContent className="p-4">
                        <p className="font-medium">{prediction.matchTitle}</p>
                        <p className="text-sm text-neutral-600">
                          {prediction.match.team1Name} vs {prediction.match.team2Name}
                        </p>
                        <div className="mt-2 text-sm">
                          <p>Prediction: <span className="font-medium">{prediction.prediction}</span></p>
                          {prediction.match.status === 'completed' && (
                            <p>Result: <span className="font-medium">{prediction.result}</span></p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600">No predictions yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
