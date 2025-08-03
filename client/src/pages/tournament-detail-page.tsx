import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, MapPin, ArrowLeft, Filter, Crown, Users, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import MatchCard from '@/components/match-card';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isPremium?: boolean;
  hideTossPredictions?: boolean;
}

interface LeaderboardUser {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  points: number;
  correctPredictions: number;
  totalMatches: number;
  isVerified?: boolean;
  viewedByCount?: number;
}

interface Match {
  id: number;
  tournamentName: string;
  team1: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  team2: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  location: string;
  matchDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'tie' | 'void';
  tossWinnerId?: number;
  matchWinnerId?: number;
  team1Score?: string;
  team2Score?: string;
  resultSummary?: string;
}

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id ? parseInt(params.id) : null;

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) throw new Error('Failed to fetch tournament');
      return response.json();
    },
    enabled: !!tournamentId,
    retry: 1,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!tournamentId,
    retry: 1,
  });

  // Get user predictions for all matches
  const { data: userPredictions = [] } = useQuery({
    queryKey: ['/api/predictions'],
    queryFn: async () => {
      const response = await fetch('/api/predictions');
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json();
    }
  });

  // Get tournament-specific leaderboard
  const { data: tournamentLeaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardUser[]>({
    queryKey: [`/api/tournaments/${tournamentId}/leaderboard`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch tournament leaderboard');
      return response.json();
    },
    enabled: !!tournamentId,
    retry: 1,
  });

  // Check if user has premium access (only if tournament is premium)
  const { data: premiumAccess } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/premium-access`],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/premium-access`);
      if (!response.ok) return { isPremium: false };
      return response.json();
    },
    enabled: !!tournamentId && !!tournament?.isPremium,
    retry: 1,
  });

  if (tournamentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="mb-8">
          <Skeleton className="h-64 w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Tournament Not Found</h2>
          <p className="text-gray-500 mb-4">The tournament you're looking for doesn't exist.</p>
          <Link href="/tournaments">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/tournaments">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>
      </Link>

      {/* Tournament Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card className="overflow-hidden">
          <div className="relative">
            {tournament.imageUrl ? (
              <img 
                src={tournament.imageUrl} 
                alt={tournament.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Trophy className="h-24 w-24 text-blue-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white shadow-lg">{tournament.name}</h1>
                {tournament.isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{matches.length} matches</span>
                </div>
                {tournament.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {tournament.isPremium && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>Premium Tournament</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {tournament.description && (
            <CardContent className="p-6">
              <p className="text-gray-600 text-lg leading-relaxed">{tournament.description}</p>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Matches Section with Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {matches.length} total matches
            </span>
          </div>
        </div>
        
        {matchesLoading ? (
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Card className="p-8 border-dashed border-2 border-gray-200 bg-gray-50">
            <div className="text-center py-6 text-gray-600">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-2">No Matches Yet</h3>
              <p>Matches for this tournament haven't been scheduled yet.</p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All 
                <Badge variant="secondary" className="text-xs">
                  {matches.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
                <Badge variant="secondary" className="text-xs">
                  {tournamentLeaderboard.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                Upcoming
                <Badge variant="secondary" className="text-xs">
                  {matches.filter(m => m.status === 'upcoming').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="flex items-center gap-2">
                Ongoing
                <Badge variant="secondary" className="text-xs">
                  {matches.filter(m => m.status === 'ongoing').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                Completed
                <Badge variant="secondary" className="text-xs">
                  {matches.filter(m => m.status === 'completed').length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.map((match, index) => {
                  const userPrediction = userPredictions.find((p: any) => p.matchId === match.id);
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MatchCard 
                        match={match as any} 
                        userPrediction={userPrediction}
                        tournament={tournament}
                        hasAccess={!tournament?.isPremium || premiumAccess?.isPremium}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.filter(m => m.status === 'upcoming').map((match, index) => {
                  const userPrediction = userPredictions.find((p: any) => p.matchId === match.id);
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MatchCard 
                        match={match as any} 
                        userPrediction={userPrediction}
                        tournament={tournament}
                        hasAccess={!tournament?.isPremium || premiumAccess?.isPremium}
                      />
                    </motion.div>
                  );
                })}
              </div>
              {matches.filter(m => m.status === 'upcoming').length === 0 && (
                <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="text-center py-4 text-gray-600">
                    <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>No upcoming matches</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ongoing">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.filter(m => m.status === 'ongoing').map((match, index) => {
                  const userPrediction = userPredictions.find((p: any) => p.matchId === match.id);
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MatchCard 
                        match={match as any} 
                        userPrediction={userPrediction}
                        tournament={tournament}
                        hasAccess={!tournament?.isPremium || premiumAccess?.isPremium}
                      />
                    </motion.div>
                  );
                })}
              </div>
              {matches.filter(m => m.status === 'ongoing').length === 0 && (
                <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="text-center py-4 text-gray-600">
                    <Trophy className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>No ongoing matches</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.filter(m => m.status === 'completed').map((match, index) => {
                  const userPrediction = userPredictions.find((p: any) => p.matchId === match.id);
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MatchCard 
                        match={match as any} 
                        userPrediction={userPrediction}
                        tournament={tournament}
                        hasAccess={!tournament?.isPremium || premiumAccess?.isPremium}
                      />
                    </motion.div>
                  );
                })}
              </div>
              {matches.filter(m => m.status === 'completed').length === 0 && (
                <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
                  <div className="text-center py-4 text-gray-600">
                    <Trophy className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p>No completed matches</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="leaderboard">
              {leaderboardLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : tournamentLeaderboard.length === 0 ? (
                <Card className="p-12 border-dashed border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-center py-8 text-gray-600">
                    <div className="relative mb-6">
                      <Trophy className="h-16 w-16 mx-auto text-gray-300" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">!</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">No Tournament Predictions Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Be the first to make predictions for this tournament and climb to the top of the leaderboard!
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Leaderboard Header with Stats */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Tournament Leaderboard</h3>
                        <p className="text-blue-100">
                          Top performers in the {tournament?.name} tournament
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-blue-100 mb-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">Total Participants</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {tournamentLeaderboard.length}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top 3 Podium */}
                  {tournamentLeaderboard.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {/* Second Place */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-center"
                      >
                        <Card className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-400 to-gray-600"></div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                            {tournamentLeaderboard[1]?.profileImage ? (
                              <img 
                                src={tournamentLeaderboard[1].profileImage}
                                alt={tournamentLeaderboard[1].displayName || tournamentLeaderboard[1].username}
                                className="w-16 h-16 rounded-full object-cover mb-3 border-4 border-gray-300"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-3 border-4 border-gray-300">
                                {(tournamentLeaderboard[1]?.displayName || tournamentLeaderboard[1]?.username)?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <h4 className="font-bold text-gray-800 text-lg truncate w-full">
                              {tournamentLeaderboard[1]?.displayName || tournamentLeaderboard[1]?.username}
                            </h4>
                            <div className="text-2xl font-bold text-gray-600 mb-1">
                              {tournamentLeaderboard[1]?.points}
                            </div>
                            <div className="text-sm text-gray-500">points</div>
                          </div>
                        </Card>
                      </motion.div>

                      {/* First Place */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0 }}
                        className="text-center"
                      >
                        <Card className="p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 relative overflow-hidden shadow-xl scale-105">
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                              <Trophy className="h-7 w-7 text-white" />
                            </div>
                            {tournamentLeaderboard[0]?.profileImage ? (
                              <img 
                                src={tournamentLeaderboard[0].profileImage}
                                alt={tournamentLeaderboard[0].displayName || tournamentLeaderboard[0].username}
                                className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-yellow-400"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-3 border-4 border-yellow-400">
                                {(tournamentLeaderboard[0]?.displayName || tournamentLeaderboard[0]?.username)?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <h4 className="font-bold text-gray-800 text-xl truncate w-full">
                              {tournamentLeaderboard[0]?.displayName || tournamentLeaderboard[0]?.username}
                            </h4>
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {tournamentLeaderboard[0]?.points}
                            </div>
                            <div className="text-sm text-gray-600">points</div>
                          </div>
                        </Card>
                      </motion.div>

                      {/* Third Place */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center"
                      >
                        <Card className="p-6 bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800"></div>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-3 shadow-lg">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                            {tournamentLeaderboard[2]?.profileImage ? (
                              <img 
                                src={tournamentLeaderboard[2].profileImage}
                                alt={tournamentLeaderboard[2].displayName || tournamentLeaderboard[2].username}
                                className="w-16 h-16 rounded-full object-cover mb-3 border-4 border-amber-400"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-3 border-4 border-amber-400">
                                {(tournamentLeaderboard[2]?.displayName || tournamentLeaderboard[2]?.username)?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <h4 className="font-bold text-gray-800 text-lg truncate w-full">
                              {tournamentLeaderboard[2]?.displayName || tournamentLeaderboard[2]?.username}
                            </h4>
                            <div className="text-2xl font-bold text-amber-600 mb-1">
                              {tournamentLeaderboard[2]?.points}
                            </div>
                            <div className="text-sm text-gray-500">points</div>
                          </div>
                        </Card>
                      </motion.div>
                    </div>
                  )}

                  {/* Full Leaderboard */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                      Complete Rankings
                    </h4>
                    {tournamentLeaderboard.map((user, index) => {
                      const rank = index + 1;
                      const successRatio = user.totalMatches > 0 ? Math.round((user.correctPredictions / (user.totalMatches * 2)) * 100) : 0;
                      
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                            rank === 1 ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white' :
                            rank === 2 ? 'border-l-gray-400 bg-gradient-to-r from-gray-50 to-white' :
                            rank === 3 ? 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-white' :
                            'border-l-blue-500 bg-white hover:border-l-blue-600'
                          }`}>
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-md ${
                                    rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                    rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                    rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                    'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                  }`}>
                                    {rank <= 3 ? (
                                      <Trophy className="h-5 w-5" />
                                    ) : (
                                      rank
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    {user.profileImage ? (
                                      <img 
                                        src={user.profileImage} 
                                        alt={user.displayName || user.username}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200">
                                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 text-lg">
                                          {user.displayName || user.username}
                                        </span>
                                        {user.isVerified && (
                                          <CheckCircle className="h-5 w-5 text-blue-500" />
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>{user.totalMatches} matches</span>
                                        <span>•</span>
                                        <span className={`font-medium ${successRatio >= 70 ? 'text-green-600' : successRatio >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                          {successRatio}% success rate
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-blue-600">
                                    {user.points}
                                  </div>
                                  <div className="text-sm text-gray-500 font-medium">
                                    points
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}