
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, PieChart, Check, X } from "lucide-react";
import MatchCard from '@/components/match-card';
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams<{ username: string }>();
  const username = params.username || currentUser?.username;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!username,
    retry: 1
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
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

  // Calculate statistics
  const totalPredictions = predictions?.length * 2 || 0;
  const correctPredictions = predictions?.reduce((acc: number, p: any) => {
    let correct = 0;
    const match = p.match;
    if (match.tossWinnerId && p.predictedTossWinnerId === match.tossWinnerId) correct++;
    if (match.matchWinnerId && p.predictedMatchWinnerId === match.matchWinnerId) correct++;
    return acc + correct;
  }, 0) || 0;
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100).toFixed(1) : '0.0';

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-neutral-100">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="text-4xl">
                      {user.displayName?.[0] || user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90">
                    <input
                      id="profile-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                          const res = await fetch('/api/profile/upload-image', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (!res.ok) throw new Error('Failed to upload image');
                          
                          const data = await res.json();
                          queryClient.invalidateQueries(['/api/user']);
                          toast({
                            title: "Success",
                            description: "Profile image updated successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update profile image",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                    <Camera className="h-5 w-5" />
                  </label>
                </div>
                
                <div className="w-full max-w-sm space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      defaultValue={user.displayName || ''}
                      className="mt-1"
                      onBlur={async (e) => {
                        try {
                          await fetch('/api/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ displayName: e.target.value }),
                          });
                          queryClient.invalidateQueries(['/api/user']);
                          toast({
                            title: "Success",
                            description: "Display name updated successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update display name",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email || ''}
                      className="mt-1"
                      onBlur={async (e) => {
                        try {
                          await fetch('/api/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: e.target.value }),
                          });
                          queryClient.invalidateQueries(['/api/user']);
                          toast({
                            title: "Success",
                            description: "Email updated successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update email",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const dialog = document.createElement('dialog');
                        dialog.innerHTML = `
                          <div class="p-4 max-w-sm mx-auto">
                            <h3 class="text-lg font-bold mb-4">Change Password</h3>
                            <form method="dialog" class="space-y-4">
                              <div>
                                <label class="block text-sm font-medium mb-1">Current Password</label>
                                <input type="password" id="currentPassword" class="w-full p-2 border rounded" required />
                              </div>
                              <div>
                                <label class="block text-sm font-medium mb-1">New Password</label>
                                <input type="password" id="newPassword" class="w-full p-2 border rounded" required />
                              </div>
                              <div class="flex justify-end gap-2">
                                <button type="button" class="px-4 py-2 border rounded" onclick="this.closest('dialog').close()">Cancel</button>
                                <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Update</button>
                              </div>
                            </form>
                          </div>
                        `;
                        
                        dialog.addEventListener('submit', async (e) => {
                          e.preventDefault();
                          const currentPassword = (dialog.querySelector('#currentPassword') as HTMLInputElement).value;
                          const newPassword = (dialog.querySelector('#newPassword') as HTMLInputElement).value;
                          
                          try {
                            const res = await fetch('/api/profile/change-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ currentPassword, newPassword }),
                            });
                            
                            if (!res.ok) throw new Error('Failed to update password');
                            
                            toast({
                              title: "Success",
                              description: "Password updated successfully",
                            });
                            dialog.close();
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update password",
                              variant: "destructive",
                            });
                          }
                        });
                        
                        document.body.appendChild(dialog);
                        dialog.showModal();
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
                
                <p className="text-neutral-600">@{user.username}</p>
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
                    <div className="text-3xl font-bold text-purple-700">{correctPredictions}/{totalPredictions}</div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {predictions.map((prediction: any) => (
                  <Card key={prediction.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <MatchCard match={prediction.match} userPrediction={prediction} />
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
