
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username;

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!username,
  });

  const { data: predictions = [], isLoading: predictionsLoading, error: predictionsError } = useQuery({
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

  if (userError || predictionsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Error loading profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">User not found</p>
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
              <p>Total Points: {user.points || 0}</p>
              <p>Correct Predictions: {user.correctPredictions || 0}</p>
              <p>Total Matches: {user.totalMatches || 0}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Recent Predictions</h2>
              {predictions.length > 0 ? (
                <ul className="space-y-2">
                  {predictions.map((prediction: any) => (
                    <li key={prediction.id} className="border p-2 rounded">
                      {prediction.matchTitle}: {prediction.prediction}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No predictions yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
