import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from '@/pages/profile-page';
import ProfileUpdatePage from '@/pages/profile-update-page';
import UserProfilePage from "@/pages/user-profile-page";
import PredictNowPage from "@/pages/predict-now-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import HelpPage from "@/pages/help-page";
import TournamentsPage from "@/pages/tournaments-page";
import TournamentDetailPage from "@/pages/tournament-detail-page";
import TournamentAnalysisPage from "@/pages/tournament-analysis-page";
import AdminDashboard from "@/pages/admin/dashboard";
import ManageMatches from "@/pages/admin/manage-matches";
import ManageUsers from "@/pages/admin/manage-users";
import ManageTeams from "@/pages/admin/manage-teams";
import SiteSettings from "@/pages/admin/site-settings";
import AdminAddTournament from "@/pages/admin-add-tournament";
import ManageTournaments from "@/pages/admin/manage-tournaments";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/predict" component={PredictNowPage} />
          <Route path="/tournaments" component={TournamentsPage} />
          <Route path="/tournaments/:id" component={TournamentDetailPage} />
          <Route path="/tournaments/:tournamentId/analysis" component={TournamentAnalysisPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/help" component={HelpPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/profile/update" component={ProfileUpdatePage} />
          <Route path="/users/:username" component={ProfilePage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly={true} />
          <ProtectedRoute path="/admin/matches" component={ManageMatches} adminOnly={true} />
          <ProtectedRoute path="/admin/users" component={ManageUsers} adminOnly={true} />
          <ProtectedRoute path="/admin/teams" component={ManageTeams} adminOnly={true} />
          <ProtectedRoute path="/admin/tournaments" component={ManageTournaments} adminOnly={true} />
          <ProtectedRoute path="/admin/settings" component={SiteSettings} adminOnly={true} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;