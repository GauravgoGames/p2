import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [verifiedData, setVerifiedData] = useState<{ username: string; securityCode: string } | null>(null);
  
  // Verify form state
  const [verifyUsername, setVerifyUsername] = useState('');
  const [verifySecurityCode, setVerifySecurityCode] = useState('');
  
  // Reset form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Verify security code mutation
  const verifyMutation = useMutation({
    mutationFn: async (data: { username: string; securityCode: string }) => {
      const res = await apiRequest('POST', '/api/forgot-password/verify', data);
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Security Code Verified',
        description: 'Please enter your new password',
      });
      setVerifiedData({ username: variables.username, securityCode: variables.securityCode });
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setStep('reset');
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid security code',
        variant: 'destructive',
      });
    },
  });

  // Reset password mutation
  const resetMutation = useMutation({
    mutationFn: async (data: { username: string; securityCode: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/forgot-password/reset', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successful',
        description: 'You can now login with your new password',
      });
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: {[key: string]: string} = {};
    if (!verifyUsername.trim()) newErrors.username = 'Username is required';
    if (!verifySecurityCode.trim()) newErrors.securityCode = 'Security code is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    verifyMutation.mutate({ username: verifyUsername, securityCode: verifySecurityCode });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: {[key: string]: string} = {};
    if (!newPassword.trim()) newErrors.newPassword = 'New password is required';
    if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (verifiedData) {
      resetMutation.mutate({
        username: verifiedData.username,
        securityCode: verifiedData.securityCode,
        newPassword: newPassword
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/auth">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              {step === 'verify' ? (
                <Shield className="h-6 w-6 text-blue-600" />
              ) : (
                <Lock className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <CardTitle>
              {step === 'verify' ? 'Verify Security Code' : 'Reset Password'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {step === 'verify' 
                ? 'Enter your username and security code to verify your identity'
                : 'Enter your new password to complete the reset process'
              }
            </p>
          </CardHeader>
          <CardContent>
            {step === 'verify' ? (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username</label>
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={verifyUsername}
                    onChange={(e) => setVerifyUsername(e.target.value)}
                    disabled={verifyMutation.isPending}
                  />
                  {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Security Code</label>
                  <Input
                    type="text"
                    placeholder="Enter your security code"
                    value={verifySecurityCode}
                    onChange={(e) => setVerifySecurityCode(e.target.value)}
                    disabled={verifyMutation.isPending}
                  />
                  {errors.securityCode && <p className="text-sm text-red-600 mt-1">{errors.securityCode}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify Security Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Security code verified for: <strong>{verifiedData?.username}</strong>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.newPassword && <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center space-y-4">
              <div className="text-sm text-gray-600">
                <strong>Important:</strong> The security code is set during registration and can be updated by administrators.
              </div>
              <div>
                <a 
                  href="https://www.pro-ace-predictions.co.uk/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Contact Admin/Support
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;