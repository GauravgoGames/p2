import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

const AuthPage = () => {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Login form schema
  const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });
  
  // Registration form schema - create custom schema for registration
  const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    displayName: z.string().optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    proaceUserId: z.string().optional(),
    securityCode: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
  
  // Form instances
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      email: "",
      proaceUserId: "",
      securityCode: "",
    },
  });
  
  // Form submission handlers
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 font-heading">
              Welcome to ProAce Predictions
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Predict cricket matches, earn points, and climb the leaderboard!
            </p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="w-full">Login</TabsTrigger>
              <TabsTrigger value="register" className="w-full">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            disabled={loginMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              {...field} 
                              disabled={loginMutation.isPending}
                            />
                            <button 
                              type="button" 
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                              onClick={toggleShowPassword}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <a 
                      href="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="How should we call you?" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Required for Verification" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="proaceUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ProAce User ID (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Required for Verification" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="securityCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Code (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="For password recovery - remember this code" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-600 mt-1">
                          Set a security code that you can remember. This will be used to recover your password if you forget it.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                            <button 
                              type="button" 
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                              onClick={toggleShowPassword}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Confirm your password" 
                            {...field} 
                            disabled={registerMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Register"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Side */}
      <div className="hidden md:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary">
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white">
            <div className="max-w-md text-center">
              <h2 className="text-3xl font-bold mb-6 font-heading">Your Cricket Prediction Platform</h2>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2 text-accent">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Predict match and toss winners</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2 text-accent">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Earn points for correct predictions</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2 text-accent">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Track your score via personal dashboard</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2 text-accent">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Compete on the global leaderboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
