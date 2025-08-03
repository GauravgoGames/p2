import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Save, X, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  displayName: string;
  points: number;
  isVerified: boolean;
}

export default function AdminPointsPage() {
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newPoints, setNewPoints] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const updatePointsMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: number; points: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update points');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      setEditingUser(null);
      setNewPoints("");
      toast({
        title: "Success",
        description: "User points updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user points",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user.id);
    setNewPoints(user.points.toString());
  };

  const handleSave = (userId: number) => {
    const points = parseInt(newPoints);
    if (isNaN(points) || points < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid non-negative number",
        variant: "destructive",
      });
      return;
    }
    updatePointsMutation.mutate({ userId, points });
  };

  const handleCancel = () => {
    setEditingUser(null);
    setNewPoints("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalPoints = users.reduce((sum, user) => sum + user.points, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold">Point Management</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>User Points Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {user.displayName || user.username}
                        {user.isVerified && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`points-${user.id}`} className="sr-only">
                          Points for {user.username}
                        </Label>
                        <Input
                          id={`points-${user.id}`}
                          type="number"
                          min="0"
                          value={newPoints}
                          onChange={(e) => setNewPoints(e.target.value)}
                          className="w-24"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(user.id)}
                          disabled={updatePointsMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={updatePointsMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-semibold min-w-[3rem] text-right">
                          {user.points}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}