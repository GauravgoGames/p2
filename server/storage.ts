import { 
  User, 
  InsertUser, 
  Team, 
  InsertTeam, 
  Tournament,
  InsertTournament,
  Match, 
  InsertMatch, 
  UpdateMatchResult, 
  Prediction, 
  InsertPrediction, 
  PointsLedgerEntry,
  SupportTicket,
  InsertSupportTicket,
  TicketMessage,
  TicketMessageWithUsername,
  InsertTicketMessage
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Define interfaces for data relationships
interface MatchWithTeams extends Match {
  team1: Team;
  team2: Team;
  tossWinner?: Team;
  matchWinner?: Team;
}

interface PredictionWithDetails extends Prediction {
  match: MatchWithTeams;
  predictedTossWinner?: Team;
  predictedMatchWinner?: Team;
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
}

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserVerification(id: number, isVerified: boolean): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Social engagement methods
  incrementUserViewCount(userId: number): Promise<User>;
  
  // Team methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: number): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  
  // Tournament methods
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournamentById(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament>;
  deleteTournament(id: number): Promise<void>;
  getMatchesByTournament(tournamentId: number): Promise<MatchWithTeams[]>;
  
  // Tournament-Team relationship methods
  addTeamToTournament(tournamentId: number, teamId: number): Promise<void>;
  removeTeamFromTournament(tournamentId: number, teamId: number): Promise<void>;
  getTeamsByTournament(tournamentId: number): Promise<Team[]>;
  
  // Site settings methods
  getSetting(key: string): Promise<string | null>;
  updateSetting(key: string, value: string): Promise<void>;
  
  // Match methods
  createMatch(match: InsertMatch): Promise<MatchWithTeams>;
  getMatchById(id: number): Promise<MatchWithTeams | undefined>;
  getMatches(status?: string): Promise<MatchWithTeams[]>;
  updateMatch(id: number, matchData: Partial<Match>): Promise<MatchWithTeams>;
  updateMatchResult(id: number, result: UpdateMatchResult): Promise<MatchWithTeams>;
  deleteMatch(id: number): Promise<void>;
  
  // Prediction methods
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getUserPredictions(userId: number): Promise<PredictionWithDetails[]>;
  getUserPredictionForMatch(userId: number, matchId: number): Promise<Prediction | undefined>;
  getPredictionsForMatch(matchId: number): Promise<Prediction[]>;
  updatePrediction(id: number, predictionData: Partial<InsertPrediction>): Promise<Prediction>;
  getAllPredictions(): Promise<Prediction[]>;
  deletePredictionsByMatch(matchId: number): Promise<void>;
  deletePredictionsForMatch(matchId: number): Promise<void>;
  recalculatePointsForMatch(matchId: number): Promise<void>;
  
  // Leaderboard methods
  getLeaderboard(timeframe: string): Promise<LeaderboardUser[]>;
  getTournamentLeaderboard(tournamentId: number, timeframe: string): Promise<LeaderboardUser[]>;
  
  // Point calculation
  calculatePoints(matchId: number): Promise<void>;
  addPointsToUser(userId: number, points: number, matchId: number, reason: string): Promise<void>;
  
  // Support ticket methods
  createSupportTicket(userId: number, subject: string, priority?: string): Promise<SupportTicket>;
  getUserTickets(userId: number): Promise<SupportTicket[]>;
  getAllTickets(): Promise<SupportTicket[]>;
  getTicketById(ticketId: number): Promise<SupportTicket | undefined>;
  updateTicketStatus(ticketId: number, status: string, assignedToUserId?: number): Promise<SupportTicket>;
  addTicketMessage(ticketId: number, userId: number, message: string, isAdminReply?: boolean): Promise<TicketMessage>;
  getTicketMessages(ticketId: number): Promise<TicketMessageWithUsername[]>;
  
  // Premium tournament methods
  addPremiumUser(tournamentId: number, userId: number): Promise<any>;
  removePremiumUser(tournamentId: number, userId: number): Promise<void>;
  getPremiumUsers(tournamentId: number): Promise<any[]>;
  isPremiumUser(tournamentId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Making predictions map public to allow access from routes
  users: Map<number, User>;
  teams: Map<number, Team>;
  tournaments: Map<number, Tournament>;
  matches: Map<number, Match>;
  predictions: Map<number, Prediction>;
  private pointsLedger: Map<number, PointsLedgerEntry>;
  private settings: Map<string, string>;
  private tournamentTeams: Map<string, boolean>; // key: "tournamentId-teamId"
  private supportTickets: Map<number, SupportTicket>;
  private ticketMessages: Map<number, TicketMessage>;
  
  sessionStore: session.Store;
  
  private userCounter: number;
  private teamCounter: number;
  private tournamentCounter: number;
  private matchCounter: number;
  private predictionCounter: number;
  private pointsLedgerCounter: number;
  private ticketCounter: number;
  private ticketMessageCounter: number;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    this.users = new Map();
    this.teams = new Map();
    this.tournaments = new Map();
    this.matches = new Map();
    this.predictions = new Map();
    this.pointsLedger = new Map();
    this.settings = new Map();
    this.tournamentTeams = new Map();
    this.supportTickets = new Map();
    this.ticketMessages = new Map();
    
    this.userCounter = 1;
    this.teamCounter = 1;
    this.tournamentCounter = 1;
    this.matchCounter = 1;
    this.predictionCounter = 1;
    this.pointsLedgerCounter = 1;
    this.ticketCounter = 1;
    this.ticketMessageCounter = 1;
    
    // Initialize default settings
    this.settings.set('siteLogo', '/uploads/site/default-logo.svg');
    this.settings.set('siteTitle', 'ProAce Predictions');
    this.settings.set('siteDescription', 'The premier platform for cricket match predictions');
    
    // Create an admin user
    this.createAdminUser();
    
    // Initialize with sample teams if needed
    this.seedTeams();
  }
  
  // Create an admin user
  private async createAdminUser() {
    // Import the hashing function from auth.ts
    const { hashPassword } = await import('./auth');
    
    // Create an admin user with a simple password for development
    const hashedPassword = await hashPassword('admin123');
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@proace.com',
      displayName: 'Admin User',
      profileImage: null,
      role: 'admin' as const,
      points: 0
    };
    
    this.users.set(this.userCounter, {
      ...adminUser,
      id: this.userCounter++,
      isVerified: true,
      proaceUserId: null,
      proaceDisqusId: null,
      createdAt: new Date(),
      securityCode: null,
      viewedByCount: 0
    });
    
    console.log('Admin user created successfully');
  }
  
  private async seedTeams() {
    const teamNames = [
      { name: "India", logoUrl: "https://pixabay.com/get/g5c86181836dd959d1a23153e53c0cad25798d8e538537750732f3d50f29823f22f7f53b5f0b4412ecd06fdbc0daf4aafed45e5b8332d92b390c005670b3cf002_1280.jpg", isCustom: false },
      { name: "Australia", logoUrl: "https://pixabay.com/get/gf2951af83df3827c3a3ad9655a5068db031a23bbc5171e67b313a882bb7f2274cecea2f49e579f36289244c97971a82709f889356b9e6f5d4a0a2a702e5d5b29_1280.jpg", isCustom: false },
      { name: "England", logoUrl: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64", isCustom: false },
      { name: "South Africa", logoUrl: "https://pixabay.com/get/gd15b26232863318d0b8afa3f7e7c50f53694c7d59c8f8c522252517351b55ae827dd4c26bec3b8f3b47348ec3d948551f2bf7e7a2c5234d9142a05b184b329d6_1280.jpg", isCustom: false },
      { name: "New Zealand", logoUrl: "https://images.unsplash.com/photo-1558981852-426c6c22a060?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64", isCustom: false },
      { name: "Pakistan", logoUrl: "https://images.unsplash.com/photo-1595429035839-c99c298ffdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64", isCustom: false },
      { name: "West Indies", logoUrl: "https://pixabay.com/get/g560b0792084e667735645f82d08c54f4af88e3c1d9ea3cfb3a91ecdb6c5539e8d4165744c676da05585e011f1e936fae7ee162629329b46d4bfd7f232ffbb6f2_1280.jpg", isCustom: false },
      { name: "Sri Lanka", logoUrl: "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64", isCustom: false }
    ];

    for (const team of teamNames) {
      await this.createTeam(team);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { 
      ...userData, 
      id, 
      points: 0,
      isVerified: false,
      proaceUserId: userData.proaceUserId || null,
      proaceDisqusId: userData.proaceDisqusId ?? null,
      createdAt: new Date(),
      displayName: userData.displayName || null,
      email: userData.email || null,
      profileImage: userData.profileImage || null,
      role: userData.role || 'user',
      securityCode: userData.securityCode || null,
      viewedByCount: 0
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserVerification(id: number, isVerified: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, isVerified };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error("User not found");
    }
    this.users.delete(id);
  }
  
  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamCounter++;
    const newTeam: Team = { 
      ...team, 
      id,
      logoUrl: team.logoUrl ?? null 
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    const team = this.teams.get(id);
    if (!team) {
      throw new Error('Team not found');
    }
    this.teams.delete(id);
  }
  
  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }
  
  // Match methods
  async createMatch(matchData: InsertMatch): Promise<MatchWithTeams> {
    const id = this.matchCounter++;
    const match: Match = { 
      ...matchData, 
      id,
      tournamentId: matchData.tournamentId || null,
      tossWinnerId: null,
      matchWinnerId: null,
      team1Score: null,
      team2Score: null,
      resultSummary: null,
      status: matchData.status || "upcoming",
      discussionLink: matchData.discussionLink || null
    };
    this.matches.set(id, match);
    
    return this.populateMatchWithTeams(match);
  }
  
  async getMatchById(id: number): Promise<MatchWithTeams | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    return this.populateMatchWithTeams(match);
  }
  
  async getMatches(status?: string): Promise<MatchWithTeams[]> {
    let allMatches = Array.from(this.matches.values());
    
    // Filter by status if provided
    if (status) {
      allMatches = allMatches.filter(match => match.status === status);
    }
    
    // Sort matches: ongoing -> upcoming -> completed
    allMatches.sort((a, b) => {
      const statusOrder = { ongoing: 0, upcoming: 1, completed: 2 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder];
      const bOrder = statusOrder[b.status as keyof typeof statusOrder];
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same status, sort by date (newest first for ongoing/upcoming, oldest first for completed)
      if (a.status === 'completed') {
        return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      } else {
        return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      }
    });
    
    // Populate with team details
    const matchesWithTeams = await Promise.all(
      allMatches.map(match => this.populateMatchWithTeams(match))
    );
    
    return matchesWithTeams;
  }
  
  async updateMatch(id: number, matchData: Partial<Match>): Promise<MatchWithTeams> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    
    const updatedMatch = { ...match, ...matchData };
    this.matches.set(id, updatedMatch);
    
    return this.populateMatchWithTeams(updatedMatch);
  }
  
  async updateMatchResult(id: number, result: UpdateMatchResult): Promise<MatchWithTeams> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    
    const updatedMatch = { ...match, ...result, status: 'completed' as const };
    this.matches.set(id, updatedMatch);
    
    // Calculate points for users who made predictions
    await this.calculatePoints(id);
    
    return this.populateMatchWithTeams(updatedMatch);
  }
  
  async deleteMatch(id: number): Promise<void> {
    if (!this.matches.has(id)) {
      throw new Error("Match not found");
    }
    this.matches.delete(id);
    
    // Delete associated predictions
    for (const [predId, prediction] of Array.from(this.predictions.entries())) {
      if (prediction.matchId === id) {
        this.predictions.delete(predId);
      }
    }
  }
  
  // Prediction methods
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const id = this.predictionCounter++;
    const newPrediction: Prediction = { 
      ...prediction, 
      id, 
      createdAt: new Date(), 
      pointsEarned: 0,
      predictedTossWinnerId: prediction.predictedTossWinnerId ?? null,
      predictedMatchWinnerId: prediction.predictedMatchWinnerId ?? null
    };
    
    this.predictions.set(id, newPrediction);
    return newPrediction;
  }
  
  async getUserPredictions(userId: number): Promise<PredictionWithDetails[]> {
    const userPredictions = Array.from(this.predictions.values())
      .filter(pred => pred.userId === userId);
    
    const predictionsWithDetails = await Promise.all(
      userPredictions.map(async prediction => {
        const match = await this.getMatchById(prediction.matchId);
        const predictedTossWinner = prediction.predictedTossWinnerId 
          ? await this.getTeamById(prediction.predictedTossWinnerId) 
          : undefined;
        
        const predictedMatchWinner = prediction.predictedMatchWinnerId 
          ? await this.getTeamById(prediction.predictedMatchWinnerId) 
          : undefined;
        
        return {
          ...prediction,
          match: match!,
          predictedTossWinner,
          predictedMatchWinner
        };
      })
    );
    
    // Sort by match date (newest first)
    predictionsWithDetails.sort((a, b) => {
      return new Date(b.match.matchDate).getTime() - new Date(a.match.matchDate).getTime();
    });
    
    return predictionsWithDetails;
  }
  
  async getUserPredictionForMatch(userId: number, matchId: number): Promise<Prediction | undefined> {
    return Array.from(this.predictions.values()).find(
      p => p.userId === userId && p.matchId === matchId
    );
  }

  async getPredictionsForMatch(matchId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      p => p.matchId === matchId
    );
  }
  
  async updatePrediction(id: number, predictionData: Partial<InsertPrediction>): Promise<Prediction> {
    const prediction = this.predictions.get(id);
    if (!prediction) {
      throw new Error("Prediction not found");
    }
    
    const updatedPrediction = { ...prediction, ...predictionData };
    this.predictions.set(id, updatedPrediction);
    return updatedPrediction;
  }
  
  async getAllPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values());
  }
  
  // Leaderboard methods
  async getLeaderboard(timeframe: string): Promise<LeaderboardUser[]> {
    // Get all users
    const users = Array.from(this.users.values());
    
    // Create leaderboard entries
    const leaderboardEntries: LeaderboardUser[] = await Promise.all(
      users.map(async user => {
        const userPredictions = Array.from(this.predictions.values())
          .filter(pred => pred.userId === user.id);
        
        // Filter predictions based on timeframe
        const filteredPredictions = this.filterPredictionsByTimeframe(userPredictions, timeframe);
        
        const correctPredictions = filteredPredictions.reduce((sum, pred) => sum + (pred.pointsEarned || 0), 0);
        
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName || undefined,
          profileImage: user.profileImage || undefined,
          points: user.points,
          correctPredictions,
          totalMatches: filteredPredictions.length,
          isVerified: user.isVerified
        };
      })
    );
    
    // Sort by points (highest first)
    return leaderboardEntries.sort((a, b) => b.points - a.points);
  }
  
  async getTournamentLeaderboard(tournamentId: number, timeframe: string): Promise<LeaderboardUser[]> {
    // Get all users
    const users = Array.from(this.users.values());
    
    // Get matches for the specific tournament
    const tournamentMatches = Array.from(this.matches.values()).filter(
      match => match.tournamentId === tournamentId
    );
    
    // Create leaderboard entries
    const leaderboardEntries: LeaderboardUser[] = await Promise.all(
      users.map(async user => {
        const userPredictions = Array.from(this.predictions.values())
          .filter(pred => pred.userId === user.id && 
                  tournamentMatches.some(match => match.id === pred.matchId));
        
        // Filter predictions based on timeframe
        const filteredPredictions = this.filterPredictionsByTimeframe(userPredictions, timeframe);
        
        const correctPredictions = filteredPredictions.reduce((sum, pred) => sum + (pred.pointsEarned || 0), 0);
        
        // Calculate tournament-specific points
        let tournamentPoints = 0;
        for (const prediction of filteredPredictions) {
          const match = this.matches.get(prediction.matchId);
          if (match && match.status === 'completed') {
            // Check if toss prediction was correct
            if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
              tournamentPoints++;
            }
            // Check if match winner prediction was correct
            if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
              tournamentPoints++;
            }
          }
        }
        
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName || undefined,
          profileImage: user.profileImage || undefined,
          points: tournamentPoints,
          correctPredictions,
          totalMatches: filteredPredictions.length,
          isVerified: user.isVerified
        };
      })
    );
    
    // Filter out users with no tournament activity and sort by points
    return leaderboardEntries
      .filter(entry => entry.totalMatches > 0)
      .sort((a, b) => b.points - a.points);
  }

  // Points calculation
  async calculatePoints(matchId: number): Promise<void> {
    const match = await this.getMatchById(matchId);
    if (!match || match.status !== 'completed' || !match.tossWinnerId || !match.matchWinnerId) {
      return;
    }
    
    // Get all predictions for this match
    const matchPredictions = Array.from(this.predictions.values())
      .filter(pred => pred.matchId === matchId);
    
    // Calculate points for each prediction
    for (const prediction of matchPredictions) {
      let pointsEarned = 0;
      let reasons = [];
      
      // Toss winner prediction point
      if (prediction.predictedTossWinnerId === match.tossWinnerId) {
        pointsEarned += 1;
        reasons.push("Correct toss prediction");
      }
      
      // Match winner prediction point
      if (prediction.predictedMatchWinnerId === match.matchWinnerId) {
        pointsEarned += 1;
        reasons.push("Correct match prediction");
      }
      
      // Update prediction with points earned
      if (pointsEarned > 0) {
        const updatedPrediction = { ...prediction, pointsEarned };
        this.predictions.set(prediction.id, updatedPrediction);
        
        // Add points to user
        await this.addPointsToUser(
          prediction.userId, 
          pointsEarned, 
          matchId, 
          reasons.join(", ")
        );
      }
    }
  }
  
  async addPointsToUser(userId: number, points: number, matchId: number, reason: string): Promise<void> {
    // Update user points
    const user = await this.getUser(userId);
    if (!user) return;
    
    const updatedUser = { ...user, points: user.points + points };
    this.users.set(userId, updatedUser);
    
    // Add entry to points ledger
    const id = this.pointsLedgerCounter++;
    const ledgerEntry: PointsLedgerEntry = {
      id,
      userId,
      matchId,
      points,
      reason,
      timestamp: new Date()
    };
    
    this.pointsLedger.set(id, ledgerEntry);
  }

  // Tournament methods
  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentCounter++;
    const newTournament: Tournament = {
      id,
      name: tournament.name,
      description: tournament.description || null,
      imageUrl: tournament.imageUrl || null,
      startDate: tournament.startDate || null,
      endDate: tournament.endDate || null,
      createdAt: new Date(),
      isPremium: tournament.isPremium || false,
      hideTossPredictions: tournament.hideTossPredictions || false
    };
    
    this.tournaments.set(id, newTournament);
    return newTournament;
  }

  async getTournamentById(id: number): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament> {
    const tournament = this.tournaments.get(id);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    const updatedTournament = { ...tournament, ...tournamentData };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  async deleteTournament(id: number): Promise<void> {
    this.tournaments.delete(id);
  }

  async getMatchesByTournament(tournamentId: number): Promise<MatchWithTeams[]> {
    const matches = Array.from(this.matches.values()).filter(
      match => match.tournamentId === tournamentId
    );
    
    const matchesWithTeams = await Promise.all(
      matches.map(match => this.populateMatchWithTeams(match))
    );
    
    return matchesWithTeams;
  }
  
  // Helper methods
  private async populateMatchWithTeams(match: Match): Promise<MatchWithTeams> {
    const team1 = await this.getTeamById(match.team1Id);
    const team2 = await this.getTeamById(match.team2Id);
    
    if (!team1 || !team2) {
      throw new Error("Team not found");
    }
    
    let tossWinner;
    let matchWinner;
    
    if (match.tossWinnerId) {
      tossWinner = await this.getTeamById(match.tossWinnerId);
    }
    
    if (match.matchWinnerId) {
      matchWinner = await this.getTeamById(match.matchWinnerId);
    }
    
    return {
      ...match,
      team1,
      team2,
      tossWinner,
      matchWinner
    };
  }
  
  // Tournament-Team relationship methods
  async addTeamToTournament(tournamentId: number, teamId: number): Promise<void> {
    const key = `${tournamentId}-${teamId}`;
    this.tournamentTeams.set(key, true);
  }

  async removeTeamFromTournament(tournamentId: number, teamId: number): Promise<void> {
    const key = `${tournamentId}-${teamId}`;
    this.tournamentTeams.delete(key);
  }

  async getTeamsByTournament(tournamentId: number): Promise<Team[]> {
    const teams: Team[] = [];
    
    for (const [key, _] of Array.from(this.tournamentTeams.entries())) {
      const [tourIdStr, teamIdStr] = key.split('-');
      const tourId = parseInt(tourIdStr);
      const teamId = parseInt(teamIdStr);
      
      if (tourId === tournamentId) {
        const team = await this.getTeamById(teamId);
        if (team) {
          teams.push(team);
        }
      }
    }
    
    return teams;
  }

  // Site settings methods
  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) || null;
  }
  
  async updateSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }
  
  private filterPredictionsByTimeframe(predictions: Prediction[], timeframe: string): Prediction[] {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'weekly':
        // Get predictions from the last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        // Get predictions from the last 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all-time':
      default:
        // No filtering needed for all-time
        return predictions;
    }
    
    return predictions.filter(pred => {
      const predDate = new Date(pred.createdAt);
      return predDate >= startDate && predDate <= now;
    });
  }

  // Support ticket methods
  async createSupportTicket(userId: number, subject: string, priority: string = 'medium'): Promise<SupportTicket> {
    const id = this.ticketCounter++;
    const ticket: SupportTicket = {
      id,
      userId,
      subject,
      status: 'open',
      priority: priority as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      assignedToUserId: null,
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async getUserTickets(userId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      ticket => ticket.userId === userId
    );
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }

  async getTicketById(ticketId: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(ticketId);
  }

  async updateTicketStatus(ticketId: number, status: string, assignedToUserId?: number): Promise<SupportTicket> {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket: SupportTicket = {
      ...ticket,
      status: status as any,
      updatedAt: new Date(),
      assignedToUserId: assignedToUserId || ticket.assignedToUserId,
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : ticket.resolvedAt,
    };

    this.supportTickets.set(ticketId, updatedTicket);
    return updatedTicket;
  }

  async addTicketMessage(ticketId: number, userId: number, message: string, isAdminReply: boolean = false): Promise<TicketMessage> {
    const id = this.ticketMessageCounter++;
    const ticketMessage: TicketMessage = {
      id,
      ticketId,
      userId,
      message,
      isAdminReply,
      createdAt: new Date(),
    };
    this.ticketMessages.set(id, ticketMessage);

    // Update ticket's updatedAt timestamp
    const ticket = this.supportTickets.get(ticketId);
    if (ticket) {
      this.supportTickets.set(ticketId, {
        ...ticket,
        updatedAt: new Date(),
      });
    }

    return ticketMessage;
  }

  async getTicketMessages(ticketId: number): Promise<TicketMessageWithUsername[]> {
    const messages = Array.from(this.ticketMessages.values())
      .filter(message => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Add username information to each message
    const messagesWithUsernames = await Promise.all(
      messages.map(async (message) => {
        const user = await this.getUser(message.userId);
        return {
          ...message,
          username: user?.username || 'Unknown User'
        };
      })
    );
    
    return messagesWithUsernames;
  }

  // Social engagement methods
  async incrementUserViewCount(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      viewedByCount: (user.viewedByCount || 0) + 1
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Premium tournament methods - stub implementations for MemStorage
  async addPremiumUser(tournamentId: number, userId: number): Promise<any> {
    return { tournamentId, userId, id: Date.now() };
  }

  async removePremiumUser(tournamentId: number, userId: number): Promise<void> {
    // No-op for MemStorage
  }

  async getPremiumUsers(tournamentId: number): Promise<any[]> {
    return [];
  }

  async isPremiumUser(tournamentId: number, userId: number): Promise<boolean> {
    return false; // Default to false for MemStorage
  }

  async deletePredictionsByMatch(matchId: number): Promise<void> {
    // Remove all predictions for this match
    const predictionEntries = Array.from(this.predictions.entries());
    for (const [predictionId, prediction] of predictionEntries) {
      if (prediction.matchId === matchId) {
        this.predictions.delete(predictionId);
      }
    }
  }

  async deletePredictionsForMatch(matchId: number): Promise<void> {
    return this.deletePredictionsByMatch(matchId);
  }

  async recalculatePointsForMatch(matchId: number): Promise<void> {
    // Get the match details
    const match = await this.getMatchById(matchId);
    if (!match || match.status !== 'completed') {
      return;
    }
    // Calculate points for this specific match
    await this.calculatePoints(matchId);
  }
}

// Import DatabaseStorage from database-storage.ts
import { storage as databaseStorage } from './database-storage';

// Use DatabaseStorage for PostgreSQL
export const storage = databaseStorage;
