import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  isAuthenticated: boolean;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const localQueryClient = useQueryClient();
  
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      localQueryClient.setQueryData(["/api/user"], user);
      
      // Invalidate all queries to refresh data after login
      localQueryClient.invalidateQueries();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.displayName || user.username}!`,
      });
      
      // Redirect to home page after login
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Fix issue #2: Don't auto-login after registration
      // Instead, notify user to login with their credentials
      
      // Clear the user data to prevent auto-login
      localQueryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created! Please login with your credentials.",
      });
      
      // Redirect to login page
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Username may already be taken",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear user data
      localQueryClient.setQueryData(["/api/user"], null);
      
      // Invalidate all queries
      localQueryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to auth page after logout
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Make sure to refresh auth state when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
