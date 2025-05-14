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
  User, 
  InsertUser, 
  Team, 
  InsertTeam, 
  Match, 
  InsertMatch, 
  UpdateMatchResult, 
  Prediction, 
  InsertPrediction, 
  PointsLedgerEntry,
  SiteSetting
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
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
  correctWinnerPredictions?: number;
  correctTossPredictions?: number;
  winnerPredictionAccuracy?: string;
  tossPredictionAccuracy?: string;
  strikeRate?: string;
  matchCounted?: boolean;
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
        // Seed admin user
        await db.insert(users).values({
          username: 'admin',
          password: '$2a$12$s9zUh8Xb3gFE9gCO3jaRAOyKjS.Zj5FJT8nXNw4SqBU5Nr7ZJVdIe', // plaintext: admin123
          email: 'admin@proace.com',
          displayName: 'Administrator',
          role: 'admin',
          points: 0
        });
        console.log('Admin user created successfully');
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
      { name: 'India', logoUrl: '/assets/flags/india.svg' },
      { name: 'Australia', logoUrl: '/assets/flags/australia.svg' },
      { name: 'England', logoUrl: '/assets/flags/england.svg' },
      { name: 'New Zealand', logoUrl: '/assets/flags/new-zealand.svg' },
      { name: 'Pakistan', logoUrl: '/assets/flags/pakistan.svg' },
      { name: 'South Africa', logoUrl: '/assets/flags/south-africa.svg' },
      { name: 'West Indies', logoUrl: '/assets/flags/west-indies.svg' },
      { name: 'Sri Lanka', logoUrl: '/assets/flags/sri-lanka.svg' },
      { name: 'Bangladesh', logoUrl: '/assets/flags/bangladesh.svg' },
      { name: 'Afghanistan', logoUrl: '/assets/flags/afghanistan.svg' }
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
    let query = db.select().from(matches);

    if (status) {
      query = query.where(eq(matches.status, status as any));
    }

    // No sorting in the query, we'll sort after fetching
    const matchesData = await query;

    // Sort matches by date (upcoming and ongoing first, then completed)
    matchesData.sort((a, b) => {
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

    return Promise.all(matchesData.map(match => this.populateMatchWithTeams(match)));
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
        displayName: user.displayName,
        profileImage: user.profileImage,
        points: user.points || 0,
        correctPredictions: 0,
        totalMatches: 0
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
        // Assuming createdAt is stored as ISO string
        (predictions.createdAt as any) >= startDate.toISOString()
      );
    }

    const allPredictions = await predictionsQuery;

    // First pass: Count unique matches per user
    const userMatches = new Map<number, Set<number>>();
    for (const prediction of allPredictions) {
      const match = await this.getMatchById(prediction.matchId);
      if (!match || match.status !== 'completed') continue;

      if (!userMatches.has(prediction.userId)) {
        userMatches.set(prediction.userId, new Set());
      }
      userMatches.get(prediction.userId)?.add(match.id);
    }

    // Update total matches for each user
    for (const [userId, matches] of userMatches) {
      const user = userMap.get(userId);
      if (user) {
        user.totalMatches = matches.size;
      }
    }

    // Second pass: Calculate predictions and accuracy
    for (const prediction of allPredictions) {
      const match = await this.getMatchById(prediction.matchId);
      if (!match || match.status !== 'completed') continue;

      const leaderboardUser = userMap.get(prediction.userId);
      if (!leaderboardUser) continue;

      // Check predictions
      if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
        leaderboardUser.correctTossPredictions = (leaderboardUser.correctTossPredictions || 0) + 1;
      }

      if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
        leaderboardUser.correctWinnerPredictions = (leaderboardUser.correctWinnerPredictions || 0) + 1;
      }
    }

    // Third pass: Calculate final statistics
    for (const user of userMap.values()) {
      if (user.totalMatches > 0) {
        const winnerAccuracy = ((user.correctWinnerPredictions || 0) / user.totalMatches) * 100;
        const tossAccuracy = ((user.correctTossPredictions || 0) / user.totalMatches) * 100;
        user.strikeRate = ((winnerAccuracy + tossAccuracy) / 2).toFixed(1);
        user.correctPredictions = (user.correctWinnerPredictions || 0) + (user.correctTossPredictions || 0);
      } else {
        user.strikeRate = '0.0';
        user.correctPredictions = 0;
      }

    }

    // Sort by points (descending) and then by correct predictions (descending)
    return Array.from(userMap.values())
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.correctPredictions - a.correctPredictions;
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
      // Points for correct toss winner prediction
      if (match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId) {
        await this.addPointsToUser(
          prediction.userId, 
          1, 
          matchId, 
          'Correct toss winner prediction'
        );
      }

      // Points for correct match winner prediction
      if (match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId) {
        await this.addPointsToUser(
          prediction.userId, 
          1, 
          matchId, 
          'Correct match winner prediction'
        );
      }
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
}