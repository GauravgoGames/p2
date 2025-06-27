import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  users, 
  teams, 
  matches, 
  predictions, 
  pointsLedger,
  siteSettings,
  tournaments,
  tournamentTeams,
  supportTickets,
  ticketMessages,
  userLoves,
  User, 
  InsertUser, 
  Team, 
  InsertTeam, 
  Match,
  Tournament, 
  InsertMatch, 
  UpdateMatchResult, 
  Prediction, 
  InsertPrediction, 
  PointsLedgerEntry,
  SiteSetting,
  SupportTicket,
  TicketMessage,
  TicketMessageWithUsername,
  InsertTournament,
  UserLove,
  InsertUserLove
} from "@shared/schema";
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import { pool } from "./db";
import { IStorage } from "./storage";

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
  viewedByCount?: number;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize the session store with PostgreSQL
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed admin user and teams if needed
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Check if admin user exists
      const adminExists = await this.getUserByUsername('admin');
      
      if (!adminExists) {
        // Seed admin user - must be verified by default
        await db.insert(users).values({
          username: 'admin',
          password: '$2b$12$hBo/ePR99DezMmEpbpB.R.2Q8zwvK5aWA28XTTEqSsfB2GSY3n6YG', // plaintext: admin123
          email: 'admin@proace.com',
          displayName: 'Administrator',
          role: 'admin',
          points: 0,
          isVerified: true,
          securityCode: 'ADMIN123'
        });
        console.log('Admin user created successfully with verification');
      }
      
      // Check if teams exist
      const teamCount = await db.select({ count: teams.id }).from(teams);
      
      if (teamCount.length === 0 || teamCount[0].count === 0) {
        // Seed teams
        await this.seedTeams();
        console.log('Teams seeded successfully');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  private async seedTeams() {
    const teamNames = [
      { name: 'India', logoUrl: '/assets/flags/india.svg', isCustom: false },
      { name: 'Australia', logoUrl: '/assets/flags/australia.svg', isCustom: false },
      { name: 'England', logoUrl: '/assets/flags/england.svg', isCustom: false },
      { name: 'New Zealand', logoUrl: '/assets/flags/new-zealand.svg', isCustom: false },
      { name: 'Pakistan', logoUrl: '/assets/flags/pakistan.svg', isCustom: false },
      { name: 'South Africa', logoUrl: '/assets/flags/south-africa.svg', isCustom: false },
      { name: 'West Indies', logoUrl: '/assets/flags/west-indies.svg', isCustom: false },
      { name: 'Sri Lanka', logoUrl: '/assets/flags/sri-lanka.svg', isCustom: false },
      { name: 'Bangladesh', logoUrl: '/assets/flags/bangladesh.svg', isCustom: false },
      { name: 'Afghanistan', logoUrl: '/assets/flags/afghanistan.svg', isCustom: false }
    ];
    
    for (const team of teamNames) {
      await this.createTeam(team);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      points: 0
    }).returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateUserVerification(id: number, isVerified: boolean): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ isVerified })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions);
  }

  async getPredictionsForMatch(matchId: number): Promise<Prediction[]> {
    return await db.select().from(predictions).where(eq(predictions.matchId, matchId));
  }

  async getTournamentLeaderboard(tournamentId: number, timeframe: string): Promise<LeaderboardUser[]> {
    // Get all matches for this tournament
    const tournamentMatches = await this.getMatchesByTournament(tournamentId);
    const matchIds = tournamentMatches.map(match => match.id);
    
    if (matchIds.length === 0) {
      return [];
    }
    
    // Get all users and predictions for these matches
    const allUsers = await this.getAllUsers();
    const userMap: Map<number, LeaderboardUser> = new Map();
    
    // Initialize leaderboard users
    allUsers.forEach(user => {
      userMap.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName || undefined,
        profileImage: user.profileImage || undefined,
        points: 0,
        correctPredictions: 0,
        totalMatches: 0,
        isVerified: user.isVerified
      });
    });
    
    // Get predictions for tournament matches
    const tournamentPredictions = [];
    if (matchIds.length > 0) {
      for (const matchId of matchIds) {
        const matchPredictions = await db.select()
          .from(predictions)
          .where(eq(predictions.matchId, matchId));
        tournamentPredictions.push(...matchPredictions);
      }
    }
    
    // Calculate statistics
    for (const prediction of tournamentPredictions) {
      const match = tournamentMatches.find(m => m.id === prediction.matchId);
      if (!match || match.status !== 'completed') continue;
      
      const leaderboardUser = userMap.get(prediction.userId);
      if (!leaderboardUser) continue;
      
      leaderboardUser.totalMatches++;
      
      // Add points for correct predictions
      if (prediction.pointsEarned) {
        leaderboardUser.points += prediction.pointsEarned;
      }
      
      // Count correct predictions
      if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
        leaderboardUser.correctPredictions++;
      }
      
      if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
        leaderboardUser.correctPredictions++;
      }
    }
    
    // Sort by points and return
    return Array.from(userMap.values())
      .filter(user => user.totalMatches > 0)
      .sort((a, b) => {
        // First, sort by points
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        
        // If points are equal, sort by success ratio
        const aRatio = a.totalMatches > 0 ? (a.correctPredictions / (a.totalMatches * 2)) : 0;
        const bRatio = b.totalMatches > 0 ? (b.correctPredictions / (b.totalMatches * 2)) : 0;
        
        if (bRatio !== aRatio) {
          return bRatio - aRatio;
        }
        
        // If both points and ratio are equal, sort by total matches
        return b.totalMatches - a.totalMatches;
      });
  }
  
  async deleteUser(id: number): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id));
    if (!result) {
      throw new Error(`User with id ${id} not found`);
    }
  }
  
  async deleteTeam(id: number): Promise<void> {
    // First check if team exists and is custom
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    if (!team.isCustom) {
      throw new Error('Cannot delete pre-defined team');
    }
    
    const result = await db.delete(teams).where(eq(teams.id, id));
    if (!result) {
      throw new Error('Failed to delete team');
    }
  }

  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }
  
  async getTeamById(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }
  
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  // Tournament-Team relationship methods
  async addTeamToTournament(tournamentId: number, teamId: number): Promise<void> {
    await db.insert(tournamentTeams).values({
      tournamentId,
      teamId
    });
  }

  async removeTeamFromTournament(tournamentId: number, teamId: number): Promise<void> {
    await db.delete(tournamentTeams)
      .where(and(
        eq(tournamentTeams.tournamentId, tournamentId),
        eq(tournamentTeams.teamId, teamId)
      ));
  }

  async getTeamsByTournament(tournamentId: number): Promise<Team[]> {
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        isCustom: teams.isCustom
      })
      .from(teams)
      .innerJoin(tournamentTeams, eq(teams.id, tournamentTeams.teamId))
      .where(eq(tournamentTeams.tournamentId, tournamentId));
    
    return result;
  }

  async getTournamentsByTeam(teamId: number): Promise<Tournament[]> {
    const result = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        description: tournaments.description,
        imageUrl: tournaments.imageUrl,
        startDate: tournaments.startDate,
        endDate: tournaments.endDate,
        createdAt: tournaments.createdAt
      })
      .from(tournaments)
      .innerJoin(tournamentTeams, eq(tournaments.id, tournamentTeams.tournamentId))
      .where(eq(tournamentTeams.teamId, teamId));
    
    return result;
  }
  
  // Match methods
  async createMatch(matchData: InsertMatch): Promise<MatchWithTeams> {
    const [match] = await db.insert(matches).values(matchData).returning();
    return this.populateMatchWithTeams(match);
  }
  
  async getMatchById(id: number): Promise<MatchWithTeams | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    if (!match) return undefined;
    return this.populateMatchWithTeams(match);
  }
  
  async getMatches(status?: string): Promise<MatchWithTeams[]> {
    let query = db.select().from(matches) as any;
    
    if (status) {
      query = query.where(eq(matches.status, status as any));
    }
    
    // No sorting in the query, we'll sort after fetching
    const matchesData = await query;
    
    // Sort matches by date (upcoming and ongoing first, then completed)
    matchesData.sort((a: any, b: any) => {
      // First by status (upcoming -> ongoing -> completed)
      const statusOrder: Record<string, number> = {
        'ongoing': 0,
        'upcoming': 1,
        'completed': 2
      };
      
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Then by date
      const dateA = new Date(a.matchDate);
      const dateB = new Date(b.matchDate);
      
      if (a.status === 'upcoming') {
        // For upcoming, show soonest first
        return dateA.getTime() - dateB.getTime();
      } else {
        // For ongoing and completed, show most recent first
        return dateB.getTime() - dateA.getTime();
      }
    });
    
    return Promise.all(matchesData.map((match: any) => this.populateMatchWithTeams(match)));
  }
  
  async updateMatch(id: number, matchData: Partial<Match>): Promise<MatchWithTeams> {
    const [updatedMatch] = await db.update(matches)
      .set(matchData)
      .where(eq(matches.id, id))
      .returning();
    
    if (!updatedMatch) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    return this.populateMatchWithTeams(updatedMatch);
  }
  
  async updateMatchResult(id: number, result: UpdateMatchResult): Promise<MatchWithTeams> {
    const [updatedMatch] = await db.update(matches)
      .set({
        ...result,
        status: 'completed'
      })
      .where(eq(matches.id, id))
      .returning();
    
    if (!updatedMatch) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    // Calculate points for users who made predictions for this match
    await this.calculatePoints(id);
    
    return this.populateMatchWithTeams(updatedMatch);
  }
  
  async deleteMatch(id: number): Promise<void> {
    const result = await db.delete(matches).where(eq(matches.id, id));
    if (!result) {
      throw new Error(`Match with id ${id} not found`);
    }
  }
  
  // Prediction methods
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions)
      .values(prediction)
      .returning();
    
    return newPrediction;
  }
  
  async getUserPredictions(userId: number): Promise<PredictionWithDetails[]> {
    const userPredictions = await db.select()
      .from(predictions)
      .where(eq(predictions.userId, userId));
    
    const result: PredictionWithDetails[] = [];
    
    for (const prediction of userPredictions) {
      const match = await this.getMatchById(prediction.matchId);
      if (match) {
        const predictedTossWinner = prediction.predictedTossWinnerId ? 
          await this.getTeamById(prediction.predictedTossWinnerId) : undefined;
          
        const predictedMatchWinner = prediction.predictedMatchWinnerId ?
          await this.getTeamById(prediction.predictedMatchWinnerId) : undefined;
          
        result.push({
          ...prediction,
          match,
          predictedTossWinner,
          predictedMatchWinner
        });
      }
    }
    
    // Sort by match start time (upcoming first, then completed)
    result.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'upcoming': 0,
        'ongoing': 1,
        'completed': 2
      };
      
      if (statusOrder[a.match.status] !== statusOrder[b.match.status]) {
        return statusOrder[a.match.status] - statusOrder[b.match.status];
      }
      
      const dateA = new Date(a.match.matchDate);
      const dateB = new Date(b.match.matchDate);
      
      return dateA.getTime() - dateB.getTime();
    });
    
    return result;
  }
  
  async getUserPredictionForMatch(userId: number, matchId: number): Promise<Prediction | undefined> {
    const [prediction] = await db.select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, userId),
          eq(predictions.matchId, matchId)
        )
      );
    
    return prediction;
  }
  
  async updatePrediction(id: number, predictionData: Partial<InsertPrediction>): Promise<Prediction> {
    const [updatedPrediction] = await db.update(predictions)
      .set(predictionData)
      .where(eq(predictions.id, id))
      .returning();
    
    if (!updatedPrediction) {
      throw new Error(`Prediction with id ${id} not found`);
    }
    
    return updatedPrediction;
  }
  
  // Leaderboard methods
  async getLeaderboard(timeframe: string): Promise<LeaderboardUser[]> {
    const allUsers = await this.getAllUsers();
    const userMap: Map<number, LeaderboardUser> = new Map();
    
    // Initialize leaderboard users
    allUsers.forEach(user => {
      userMap.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName || undefined,
        profileImage: user.profileImage || undefined,
        points: user.points || 0,
        correctPredictions: 0,
        totalMatches: 0,
        isVerified: user.isVerified,
        viewedByCount: user.viewedByCount || 0
      });
    });
    
    // Get all predictions with time filtering if needed
    let predictionsQuery = db.select().from(predictions);
    
    if (timeframe !== 'all-time') {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'this-week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'this-month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'this-year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      // Add filtering by createdAt
      predictionsQuery = predictionsQuery.where(
        sql`${predictions.createdAt} >= ${startDate.toISOString()}`
      );
    }
    
    const allPredictions = await predictionsQuery;
    
    // Calculate statistics for each user
    for (const prediction of allPredictions) {
      const match = await this.getMatchById(prediction.matchId);
      if (!match || match.status !== 'completed') continue;
      
      const leaderboardUser = userMap.get(prediction.userId);
      if (!leaderboardUser) continue;
      
      leaderboardUser.totalMatches++;
      
      // Check if toss prediction was correct
      if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
        leaderboardUser.correctPredictions++;
      }
      
      // Check if match winner prediction was correct
      if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
        leaderboardUser.correctPredictions++;
      }
    }
    
    // Sort by three-tier criteria:
    // 1. Points (higher is better)
    // 2. Success ratio (higher is better)
    // 3. Total matches (higher is better)
    return Array.from(userMap.values())
      .sort((a, b) => {
        // First, sort by points
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        
        // If points are equal, sort by success ratio
        const aRatio = a.totalMatches > 0 ? (a.correctPredictions / (a.totalMatches * 2)) : 0;
        const bRatio = b.totalMatches > 0 ? (b.correctPredictions / (b.totalMatches * 2)) : 0;
        
        if (bRatio !== aRatio) {
          return bRatio - aRatio;
        }
        
        // If both points and ratio are equal, sort by total matches
        return b.totalMatches - a.totalMatches;
      });
  }
  
  // Point calculation
  async calculatePoints(matchId: number): Promise<void> {
    const match = await this.getMatchById(matchId);
    if (!match || match.status !== 'completed') {
      throw new Error(`Match with id ${matchId} is not completed`);
    }
    
    // Get all predictions for this match
    const matchPredictions = await db.select()
      .from(predictions)
      .where(eq(predictions.matchId, matchId));
    
    for (const prediction of matchPredictions) {
      let totalPoints = 0;
      
      // Points for correct toss winner prediction
      if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
        totalPoints += 1;
        await this.addPointsToUser(
          prediction.userId, 
          1, 
          matchId, 
          'Correct toss winner prediction'
        );
      }
      
      // Points for correct match winner prediction
      if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
        totalPoints += 1;
        await this.addPointsToUser(
          prediction.userId, 
          1, 
          matchId, 
          'Correct match winner prediction'
        );
      }
      
      // Update the prediction with earned points
      await db.update(predictions)
        .set({ pointsEarned: totalPoints })
        .where(eq(predictions.id, prediction.id));
    }
  }
  
  async addPointsToUser(userId: number, points: number, matchId: number, reason: string): Promise<void> {
    // Update user points
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    await this.updateUser(userId, { points: (user.points || 0) + points });
    
    // Add to points ledger
    await db.insert(pointsLedger)
      .values({
        userId,
        matchId,
        points,
        reason
      });
  }
  
  // Helper methods
  private async populateMatchWithTeams(match: Match): Promise<MatchWithTeams> {
    const team1 = await this.getTeamById(match.team1Id);
    const team2 = await this.getTeamById(match.team2Id);
    
    if (!team1 || !team2) {
      throw new Error('Teams not found for match');
    }
    
    let tossWinner: Team | undefined;
    if (match.tossWinnerId) {
      tossWinner = await this.getTeamById(match.tossWinnerId);
    }
    
    let matchWinner: Team | undefined;
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
    try {
      const [setting] = await db.select()
        .from(siteSettings)
        .where(eq(siteSettings.key, key));
      
      return setting?.value || null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async updateSetting(key: string, value: string): Promise<void> {
    try {
      // First try to update
      const result = await db.update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      
      // If no rows affected, insert
      if (result.length === 0) {
        await db.insert(siteSettings)
          .values({
            key,
            value,
          });
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw new Error(`Failed to update setting: ${key}`);
    }
  }

  // Tournament methods
  async createTournament(tournament: any): Promise<Tournament> {
    const [newTournament] = await db.insert(tournaments)
      .values(tournament)
      .returning();
    return newTournament;
  }

  async getTournamentById(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select()
      .from(tournaments)
      .where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(asc(tournaments.createdAt));
  }

  async updateTournament(id: number, tournamentData: Partial<Tournament>): Promise<Tournament> {
    const [updated] = await db.update(tournaments)
      .set(tournamentData)
      .where(eq(tournaments.id, id))
      .returning();
    return updated;
  }

  async deleteTournament(id: number): Promise<void> {
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  async getMatchesByTournament(tournamentId: number): Promise<MatchWithTeams[]> {
    const matchesList = await db.select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(asc(matches.matchDate));
    
    const matchesWithTeams = await Promise.all(
      matchesList.map(match => this.populateMatchWithTeams(match))
    );
    
    return matchesWithTeams;
  }

  // Support ticket methods
  async createSupportTicket(userId: number, subject: string, priority: string = 'medium'): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values({
      userId,
      subject,
      priority: priority as 'low' | 'medium' | 'high',
      status: 'open'
    }).returning();
    return ticket;
  }

  async getUserTickets(userId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async getTicketById(ticketId: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
    return ticket;
  }

  async updateTicketStatus(ticketId: number, status: string, assignedToUserId?: number): Promise<SupportTicket> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedToUserId !== undefined) {
      updateData.assignedToUserId = assignedToUserId;
    }
    
    const [updatedTicket] = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();
    
    if (!updatedTicket) {
      throw new Error('Ticket not found');
    }
    
    return updatedTicket;
  }

  async addTicketMessage(ticketId: number, userId: number, message: string, isAdminReply: boolean = false): Promise<TicketMessage> {
    const [ticketMessage] = await db.insert(ticketMessages).values({
      ticketId,
      userId,
      message,
      isAdminReply
    }).returning();
    return ticketMessage;
  }

  async getTicketMessages(ticketId: number): Promise<TicketMessageWithUsername[]> {
    const messages = await db.select({
      id: ticketMessages.id,
      ticketId: ticketMessages.ticketId,
      userId: ticketMessages.userId,
      message: ticketMessages.message,
      isAdminReply: ticketMessages.isAdminReply,
      createdAt: ticketMessages.createdAt,
      username: users.username,
      displayName: users.displayName
    })
    .from(ticketMessages)
    .innerJoin(users, eq(ticketMessages.userId, users.id))
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(asc(ticketMessages.createdAt));
    
    return messages;
  }

  // Social engagement methods
  async incrementUserLoveCount(userId: number): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ lovedByCount: sql`${users.lovedByCount} + 1` })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }

  async incrementUserViewCount(userId: number): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ viewedByCount: sql`${users.viewedByCount} + 1` })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }

  // Authenticated love system methods
  async toggleUserLove(loverId: number, lovedUserId: number): Promise<{ isLoved: boolean; lovedByCount: number }> {
    if (loverId === lovedUserId) {
      throw new Error('Users cannot love themselves');
    }

    // Check if love relationship already exists
    const existingLove = await db.select()
      .from(userLoves)
      .where(and(eq(userLoves.loverId, loverId), eq(userLoves.lovedUserId, lovedUserId)))
      .limit(1);

    let isLoved: boolean;

    if (existingLove.length > 0) {
      // Remove love relationship
      await db.delete(userLoves)
        .where(and(eq(userLoves.loverId, loverId), eq(userLoves.lovedUserId, lovedUserId)));
      
      // Safely decrement love count (ensure it doesn't go below 0)
      await db.update(users)
        .set({ lovedByCount: sql`GREATEST(${users.lovedByCount} - 1, 0)` })
        .where(eq(users.id, lovedUserId));
      
      isLoved = false;
    } else {
      // Create love relationship
      await db.insert(userLoves)
        .values({ loverId, lovedUserId });
      
      // Increment love count
      await db.update(users)
        .set({ lovedByCount: sql`${users.lovedByCount} + 1` })
        .where(eq(users.id, lovedUserId));
      
      isLoved = true;
    }

    // Get updated love count
    const user = await db.select({ lovedByCount: users.lovedByCount })
      .from(users)
      .where(eq(users.id, lovedUserId))
      .limit(1);

    return {
      isLoved,
      lovedByCount: user[0]?.lovedByCount || 0
    };
  }

  async getUserLoveStatus(loverId: number, lovedUserId: number): Promise<boolean> {
    const existingLove = await db.select()
      .from(userLoves)
      .where(and(eq(userLoves.loverId, loverId), eq(userLoves.lovedUserId, lovedUserId)))
      .limit(1);

    return existingLove.length > 0;
  }

  async getUserLovers(userId: number): Promise<User[]> {
    const lovers = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      profileImage: users.profileImage,
      isVerified: users.isVerified,
      role: users.role,
      points: users.points,
      email: users.email,
      password: users.password,
      proaceUserId: users.proaceUserId,
      proaceDisqusId: users.proaceDisqusId,
      securityCode: users.securityCode,
      lovedByCount: users.lovedByCount,
      viewedByCount: users.viewedByCount,
      createdAt: users.createdAt
    })
    .from(userLoves)
    .innerJoin(users, eq(userLoves.loverId, users.id))
    .where(eq(userLoves.lovedUserId, userId))
    .orderBy(desc(userLoves.createdAt));

    return lovers;
  }
}

export const storage = new DatabaseStorage();