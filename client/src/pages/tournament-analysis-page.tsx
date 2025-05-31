import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Users, Calendar, Target, TrendingUp } from 'lucide-react';

interface TournamentAnalysisUser {
  id: number;
  username: string;
  displayName?: string;
  profileImage?: string;
  totalMatches: number;
  correctTossPredictions: number;
  correctMatchPredictions: number;
  totalPoints: number;
  accuracy: number;
  rank: number;
}

interface MatchAnalysis {
  id: number;
  team1: { id: number; name: string; logoUrl?: string };
  team2: { id: number; name: string; logoUrl?: string };
  matchDate: string;
  status: string;
  location: string;
  tossWinner?: { id: number; name: string };
  matchWinner?: { id: number; name: string };
  totalPredictions: number;
  tossStats: {
    team1Predictions: number;
    team2Predictions: number;
    team1Percentage: number;
    team2Percentage: number;
  };
  matchStats: {
    team1Predictions: number;
    team2Predictions: number;
    team1Percentage: number;
    team2Percentage: number;
  };
  userPredictions: Array<{
    userId: number;
    username: string;
    displayName?: string;
    profileImage?: string;
    predictedTossWinner: string;
    predictedMatchWinner: string;
    tossCorrect: boolean;
    matchCorrect: boolean;
    pointsEarned: number;
  }>;
}

interface Tournament {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: string;
}

const TournamentAnalysisPage = () => {
  const { tournamentId: urlTournamentId } = useParams();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(urlTournamentId || null);
  const [visibleMatches, setVisibleMatches] = useState([10]); // Default to show 10 matches

  // Query for all tournaments
  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    },
  });

  // Set default tournament if none selected and tournaments are available
  if (!selectedTournamentId && tournaments && tournaments.length > 0) {
    setSelectedTournamentId(tournaments[0].id.toString());
  }

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', selectedTournamentId],
    queryFn: async () => {
      if (!selectedTournamentId) return null;
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`);
      if (!res.ok) throw new Error('Failed to fetch tournament');
      return res.json();
    },
    enabled: !!selectedTournamentId,
  });

  const { data: analysisData, isLoading: analysisLoading } = useQuery<TournamentAnalysisUser[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'analysis'],
    queryFn: async () => {
      if (!selectedTournamentId) return [];
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/analysis`);
      if (!res.ok) throw new Error('Failed to fetch tournament analysis');
      return res.json();
    },
    enabled: !!selectedTournamentId,
  });

  const { data: matchesAnalysis, isLoading: matchesLoading } = useQuery<MatchAnalysis[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'matches-analysis'],
    queryFn: async () => {
      if (!selectedTournamentId) return [];
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/matches-analysis`);
      if (!res.ok) throw new Error('Failed to fetch matches analysis');
      return res.json();
    },
    enabled: !!selectedTournamentId,
  });

  if (tournamentLoading || analysisLoading || matchesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tournament Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading mb-4">Tournament Analysis</h1>
        <p className="text-neutral-600 mb-4">Comprehensive prediction analysis for tournament matches</p>
        
        {/* Tournament Selector */}
        {tournaments && tournaments.length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-medium">Select Tournament:</Label>
            <Select value={selectedTournamentId || ''} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-64 mt-2">
                <SelectValue placeholder="Choose a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Selected Tournament Info */}
        {tournament && (
          <div className="flex items-center gap-4 mb-4">
            {tournament.imageUrl && (
              <img 
                src={tournament.imageUrl} 
                alt={tournament.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{tournament.name} - Match Analysis</h2>
              <p className="text-neutral-600">{tournament.description}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-600">Total Predictors</p>
                  <p className="font-bold text-lg">{analysisData?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-neutral-600">Total Matches</p>
                  <p className="font-bold text-lg">{matchesAnalysis?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-neutral-600">Avg Accuracy</p>
                  <p className="font-bold text-lg">
                    {analysisData ? Math.round(analysisData.reduce((sum, user) => sum + user.accuracy, 0) / analysisData.length) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-neutral-600">Total Predictions</p>
                  <p className="font-bold text-lg">
                    {matchesAnalysis?.reduce((sum, match) => sum + match.totalPredictions, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User-wise Match Prediction Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>User-wise Match Prediction Analysis</CardTitle>
          <p className="text-sm text-neutral-600">Complete prediction matrix showing each user's predictions across all matches</p>
          
          {/* Matches Slider Control */}
          {matchesAnalysis && matchesAnalysis.length > 5 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">
                Number of matches to display: {visibleMatches[0]} of {matchesAnalysis.length}
              </Label>
              <Slider
                value={visibleMatches}
                onValueChange={setVisibleMatches}
                max={Math.min(matchesAnalysis.length, 100)}
                min={5}
                step={5}
                className="w-full max-w-sm"
              />
              <p className="text-xs text-neutral-500">
                Adjust slider to view more matches (up to {Math.min(matchesAnalysis.length, 100)} matches)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-neutral-300">
                  <th className="sticky left-0 bg-neutral-100 text-left p-2 font-semibold border-r-2 border-neutral-300 min-w-[120px]">
                    Predictor
                  </th>
                  <th className="text-center p-2 font-semibold border-r border-neutral-200 min-w-[80px]">
                    Total Matches
                  </th>
                  <th className="text-center p-2 font-semibold border-r border-neutral-200 min-w-[80px]">
                    Points
                  </th>
                  <th className="text-center p-2 font-semibold border-r-2 border-neutral-300 min-w-[80px]">
                    Accuracy
                  </th>
                  {matchesAnalysis?.slice(0, visibleMatches[0]).map((match, index) => (
                    <th key={match.id} className="text-center p-2 font-semibold border-r border-neutral-200 min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">Match {index + 1}</span>
                        <div className="flex items-center gap-1">
                          <img 
                            src={match.team1.logoUrl || '/placeholder-team.png'} 
                            alt={match.team1.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-xs">{match.team1.name}</span>
                          <span className="text-neutral-400">vs</span>
                          <span className="text-xs">{match.team2.name}</span>
                          <img 
                            src={match.team2.logoUrl || '/placeholder-team.png'} 
                            alt={match.team2.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(match.matchDate).toLocaleDateString()}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
                {/* Match Results Row */}
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <td className="sticky left-0 bg-neutral-50 p-2 font-semibold border-r-2 border-neutral-300">
                    Actual Results
                  </td>
                  <td className="p-2 text-center border-r border-neutral-200">-</td>
                  <td className="p-2 text-center border-r border-neutral-200">-</td>
                  <td className="p-2 text-center border-r-2 border-neutral-300">-</td>
                  {matchesAnalysis?.slice(0, visibleMatches[0]).map((match) => (
                    <td key={match.id} className="p-2 text-center border-r border-neutral-200">
                      {match.status === 'completed' ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs font-medium">{match.tossWinner?.name || 'TBD'}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Medal className="h-3 w-3 text-green-500" />
                            <span className="text-xs font-medium">{match.matchWinner?.name || 'TBD'}</span>
                          </div>
                        </div>
                      ) : match.status === 'void' ? (
                        <Badge variant="destructive" className="text-xs">Void</Badge>
                      ) : match.status === 'tie' ? (
                        <Badge variant="secondary" className="text-xs">Tie</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Upcoming</Badge>
                      )}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysisData?.map((user) => {
                  // Create a map to find user's predictions for each match
                  const userMatchPredictions = new Map();
                  matchesAnalysis?.forEach(match => {
                    const userPred = match.userPredictions.find(p => p.userId === user.id);
                    if (userPred) {
                      userMatchPredictions.set(match.id, userPred);
                    }
                  });

                  return (
                    <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="sticky left-0 bg-white p-2 border-r-2 border-neutral-300">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.profileImage || ''} alt={user.username} />
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs">{user.displayName || user.username}</span>
                        </div>
                      </td>
                      <td className="p-2 text-center border-r border-neutral-200">
                        <Badge variant="outline" className="text-xs">
                          {user.totalMatches}
                        </Badge>
                      </td>
                      <td className="p-2 text-center border-r border-neutral-200">
                        <Badge variant="secondary" className="text-xs font-bold">
                          {user.totalPoints}
                        </Badge>
                      </td>
                      <td className="p-2 text-center border-r-2 border-neutral-300">
                        <Badge className={`text-xs font-bold ${user.accuracy >= 60 ? 'bg-green-100 text-green-800' : user.accuracy >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {user.accuracy.toFixed(1)}%
                        </Badge>
                      </td>
                      {matchesAnalysis?.slice(0, visibleMatches[0]).map((match) => {
                        const prediction = userMatchPredictions.get(match.id);
                        
                        if (!prediction) {
                          return (
                            <td key={match.id} className="p-2 text-center border-r border-neutral-200">
                              <span className="text-neutral-400 text-xs">No Prediction</span>
                            </td>
                          );
                        }

                        // For void and tie matches, no points should be awarded
                        const isVoidOrTie = match.status === 'void' || match.status === 'tie';
                        const tossCorrect = !isVoidOrTie && prediction.tossCorrect;
                        const matchCorrect = !isVoidOrTie && prediction.matchCorrect;
                        const totalPoints = isVoidOrTie ? 0 : prediction.pointsEarned;

                        return (
                          <td key={match.id} className="p-2 text-center border-r border-neutral-200">
                            <div className="space-y-1">
                              {/* Toss Prediction */}
                              <div className={`text-xs p-1 rounded ${
                                isVoidOrTie ? 'bg-neutral-100 text-neutral-600' :
                                tossCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                <div className="flex items-center justify-center gap-1">
                                  <Trophy className="h-2 w-2" />
                                  <span>{prediction.predictedTossWinner}</span>
                                  {isVoidOrTie ? <span className="text-neutral-500">-</span> :
                                   tossCorrect ? <span className="text-green-600">✓</span> :
                                   <span className="text-red-600">✗</span>}
                                </div>
                              </div>
                              
                              {/* Match Prediction */}
                              <div className={`text-xs p-1 rounded ${
                                isVoidOrTie ? 'bg-neutral-100 text-neutral-600' :
                                matchCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                <div className="flex items-center justify-center gap-1">
                                  <Medal className="h-2 w-2" />
                                  <span>{prediction.predictedMatchWinner}</span>
                                  {isVoidOrTie ? <span className="text-neutral-500">-</span> :
                                   matchCorrect ? <span className="text-green-600">✓</span> :
                                   <span className="text-red-600">✗</span>}
                                </div>
                              </div>
                              
                              {/* Points Earned */}
                              <Badge className={`text-xs ${
                                isVoidOrTie ? 'bg-neutral-100 text-neutral-600' :
                                totalPoints > 0 ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {totalPoints} pts
                              </Badge>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentAnalysisPage;