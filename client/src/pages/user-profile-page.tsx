
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function UserProfilePage() {
  const [, params] = useParams();
  const username = params?.username;

  const { data: user } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/predictions`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
              <p className="text-gray-500">@{user.username}</p>
              <div className="mt-2">
                <Badge variant="secondary">Points: {user.points}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
            {predictions?.map((prediction: any) => (
              <div key={prediction.id} className="border-b py-2">
                <p>{prediction.match.team1.name} vs {prediction.match.team2.name}</p>
                <p className="text-sm text-gray-500">
                  Predicted Winner: {prediction.predictedMatchWinner.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
