
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera } from 'lucide-react';

const profileBasicSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
});

const securitySchema = z.object({
  email: z.string().email("Invalid email format"),
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => {
  if (data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileBasicFields = z.infer<typeof profileBasicSchema>;
type SecurityFields = z.infer<typeof securitySchema>;

export default function ProfileUpdatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const basicForm = useForm<ProfileBasicFields>({
    resolver: zodResolver(profileBasicSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    }
  });

  const securityForm = useForm<SecurityFields>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  useEffect(() => {
    if (user) {
      basicForm.reset({
        displayName: user.displayName || '',
      });
      securityForm.reset({
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user, basicForm, securityForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileBasicFields) => {
      // First update basic profile info
      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: data.displayName }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to update profile');
      }

      // If there's a new image, upload it separately
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const imageRes = await fetch('/api/profile/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!imageRes.ok) {
          throw new Error('Failed to upload profile image');
        }
      }

      return profileRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: SecurityFields) => {
      // Update email separately if changed
      if (data.email !== user?.email) {
        const emailRes = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        });
        if (!emailRes.ok) {
          throw new Error('Failed to update email');
        }
      }

      // Update password if provided
      if (data.newPassword) {
        const passwordRes = await fetch('/api/profile/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        });
        if (!passwordRes.ok) {
          throw new Error('Failed to update password');
        }
      }

      return { message: 'Security settings updated successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Success',
        description: 'Security settings updated successfully',
      });
      securityForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const onBasicSubmit = async (data: ProfileBasicFields) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  const onSecuritySubmit = async (data: SecurityFields) => {
    try {
      await updateSecurityMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="security">Security Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Form {...basicForm}>
                <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage 
                          src={imagePreview || user.profileImage || ''} 
                          alt={user.displayName || user.username} 
                        />
                        <AvatarFallback>
                          {user.displayName?.[0] || user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="profile-image" 
                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90"
                      >
                        <Camera className="h-5 w-5" />
                      </label>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  <FormField
                    control={basicForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="security">
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateSecurityMutation.isPending}
                  >
                    {updateSecurityMutation.isPending ? 'Updating...' : 'Update Security Settings'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
