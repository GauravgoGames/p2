import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Check, X, Trophy, Upload, Camera } from 'lucide-react';
import MatchCard from '@/components/match-card';

// Profile update form schema
const profileFormSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters").optional().or(z.literal('')),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  profileImage: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch user predictions
  const { data: predictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ['/api/predictions'],
    queryFn: async () => {
      const res = await fetch('/api/predictions');
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    }
  });
  
  // Profile update form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      profileImage: user?.profileImage || '',
    },
  });
  
  // Handle profile image selection
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Upload profile image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch('/api/profile/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Image upload failed');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue('profileImage', data.profileImage);
      toast({
        title: 'Image Uploaded',
        description: 'Your profile image has been successfully uploaded',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setProfileImageFile(null);
      setImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to upload image: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PATCH', '/api/profile', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
  
  // Profile form submission handler
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Password form 
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      const res = await apiRequest('POST', '/api/profile/change-password', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed',
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });
  
  // Password form submission handler
  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({ 
      currentPassword: data.currentPassword, 
      newPassword: data.newPassword 
    });
  };
  
  // Handle image upload
  const handleImageUpload = async () => {
    if (profileImageFile) {
      uploadImageMutation.mutate(profileImageFile);
    }
  };
  
  // Prediction statistics
  const totalPredictions = predictions?.length * 2 || 0; // Each match has 2 predictions (toss & winner)
  const correctPredictions = predictions?.reduce((acc: number, p: any) => {
    // Count both toss and match winner predictions
    let correct = 0;
    const match = p.match;
    if (match.tossWinnerId && p.predictedTossWinnerId === match.tossWinnerId) correct++;
    if (match.matchWinnerId && p.predictedMatchWinnerId === match.matchWinnerId) correct++;
    return acc + correct;
  }, 0) || 0;
  const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100).toFixed(1) : '0.0';
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-neutral-100">
                    {imagePreview ? (
                      <AvatarImage src={imagePreview} alt="Preview" />
                    ) : user?.profileImage ? (
                      <AvatarImage src={user.profileImage} alt={user.displayName || user.username} />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {user?.displayName?.[0] || user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button 
                    type="button" 
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  
                  {user?.profileImage && (
                    <div className="absolute -right-4 top-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs rounded-full bg-white"
                        onClick={triggerFileInput}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleImageSelection}
                />
                
                {profileImageFile && (
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={uploadImageMutation.isPending}
                    >
                      {uploadImageMutation.isPending ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setProfileImageFile(null); 
                        setImagePreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                <h2 className="text-xl font-bold mt-4">{user?.displayName || user?.username}</h2>
                <p className="text-sm text-neutral-600">{user?.email}</p>
              </div>
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'profile' | 'password')} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your display name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email address" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-4"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="password" className="mt-4">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? 'Updating Password...' : 'Change Password'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Stats & Predictions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Statistics Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-full inline-block shadow-md mb-2">
                      <Trophy className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-700">{user?.points || 0}</div>
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
            <h2 className="text-2xl font-bold mb-4">Your Predictions</h2>
            
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
                      <MatchCard 
                        match={prediction.match} 
                        userPrediction={prediction} 
                      />
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
                  <p className="mb-4">You haven't made any predictions for upcoming matches.</p>
                  <Button 
                    variant="default"
                    className="mt-2 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-blue-600"
                    onClick={() => window.location.href = '/predict'}
                  >
                    Make Your First Prediction
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;