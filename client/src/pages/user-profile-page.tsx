
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
}

interface Prediction {
  id: number;
  matchTitle: string;
  prediction: string;
  result: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!username,
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: ['predictions', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!username,
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
          <h1 className="text-2xl font-bold mb-4">{user.displayName || user.username}</h1>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Statistics</h2>
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
              <h2 className="text-xl font-semibold mb-2">Recent Predictions</h2>
              {predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.map((prediction) => (
                    <div key={prediction.id} className="border p-4 rounded-lg">
                      <p className="font-medium">{prediction.matchTitle}</p>
                      <p className="text-sm text-neutral-600">Prediction: {prediction.prediction}</p>
                      <p className="text-sm text-neutral-600">Result: {prediction.result}</p>
                      <p className="text-xs text-neutral-400">{new Date(prediction.createdAt).toLocaleDateString()}</p>
                    </div>
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
