import { 
  User, 
  InsertUser, 
  Team, 
  InsertTeam, 
  Match, 
  InsertMatch, 
  UpdateMatchResult, 
  Prediction, 
  InsertPrediction, 
  PointsLedgerEntry 
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
}

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Team methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: number): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  
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
  updatePrediction(id: number, predictionData: Partial<InsertPrediction>): Promise<Prediction>;
  getAllPredictions(): Promise<Prediction[]>;
  
  // Leaderboard methods
  getLeaderboard(timeframe: string): Promise<LeaderboardUser[]>;
  
  // Point calculation
  calculatePoints(matchId: number): Promise<void>;
  addPointsToUser(userId: number, points: number, matchId: number, reason: string): Promise<void>;
}

export class MemStorage implements IStorage {
  // Making predictions map public to allow access from routes
  users: Map<number, User>;
  teams: Map<number, Team>;
  matches: Map<number, Match>;
  predictions: Map<number, Prediction>;
  private pointsLedger: Map<number, PointsLedgerEntry>;
  private settings: Map<string, string>;
  
  sessionStore: session.SessionStore;
  
  private userCounter: number;
  private teamCounter: number;
  private matchCounter: number;
  private predictionCounter: number;
  private pointsLedgerCounter: number;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    this.users = new Map();
    this.teams = new Map();
    this.matches = new Map();
    this.predictions = new Map();
    this.pointsLedger = new Map();
    this.settings = new Map();
    
    this.userCounter = 1;
    this.teamCounter = 1;
    this.matchCounter = 1;
    this.predictionCounter = 1;
    this.pointsLedgerCounter = 1;
    
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
      id: this.userCounter++
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...userData, id, points: 0 };
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
  
  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error("User not found");
    }
    this.users.delete(id);
  }
  
  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamCounter++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
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
    const match: Match = { ...matchData, id };
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
    
    const updatedMatch = { ...match, ...result, status: 'completed' };
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
    for (const [predId, prediction] of this.predictions.entries()) {
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
      pointsEarned: 0 
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
          displayName: user.displayName,
          profileImage: user.profileImage,
          points: user.points,
          correctPredictions,
          totalMatches: filteredPredictions.length
        };
      })
    );
    
    // Sort by points (highest first)
    return leaderboardEntries.sort((a, b) => b.points - a.points);
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
      
      // Toss winner prediction point - award for all match statuses except void
      if (match.status !== 'void' && prediction.predictedTossWinnerId === match.tossWinnerId) {
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
}

// Use in-memory storage for now to fix immediate issues
export const storage = new MemStorage();
