import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Save, RefreshCw } from 'lucide-react';

const SiteSettings = () => {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch current site logo
  const { data: siteLogo, isLoading, refetch } = useQuery({
    queryKey: ['/api/settings/siteLogo'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/siteLogo');
        if (res.status === 404) {
          return null;
        }
        if (!res.ok) throw new Error('Failed to fetch site logo');
        const data = await res.json();
        return data.value;
      } catch (error) {
        console.error('Error fetching site logo:', error);
        return null;
      }
    }
  });
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Upload site logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Logo upload failed');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Logo Uploaded',
        description: 'Site logo has been successfully updated',
      });
      setLogoFile(null);
      setLogoPreview(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to upload logo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handle logo upload
  const handleLogoUpload = async () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold font-heading mb-6">Site Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Site Appearance</CardTitle>
          <CardDescription>
            Customize your platform's appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Site Logo</h3>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center w-40 h-40">
                  {isLoading ? (
                    <Skeleton className="w-full h-full" />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full" />
                  ) : siteLogo ? (
                    <img src={siteLogo} alt="Site logo" className="max-h-full max-w-full" />
                  ) : (
                    <div className="text-neutral-400 text-center">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <span className="text-xs">Upload logo</span>
                    </div>
                  )}
                </div>
                
                {siteLogo && !logoPreview && (
                  <div className="absolute -right-3 top-0">
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
              <div className="flex-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleLogoChange}
                />
                
                <Button 
                  type="button" 
                  onClick={triggerFileInput}
                  className="mb-2"
                >
                  Choose File
                </Button>
                
                <p className="text-xs text-neutral-500 mt-1">
                  Recommended size: 512x512px. Max 5MB.
                </p>
                
                {logoFile && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      type="button" 
                      onClick={handleLogoUpload}
                      disabled={uploadLogoMutation.isPending}
                    >
                      {uploadLogoMutation.isPending ? 
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 
                        <Save className="mr-2 h-4 w-4" />
                      }
                      Save Logo
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;