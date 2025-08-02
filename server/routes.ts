import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { 
  insertMatchSchema, 
  updateMatchResultSchema, 
  insertTeamSchema, 
  insertPredictionSchema,
  insertTournamentSchema 
} from "@shared/schema";
import { uploadTeamLogo, uploadUserProfile, uploadSiteLogo, uploadTournamentImage, getPublicUrl } from "./upload";
import multer from "multer";

// Configure multer for backup uploads
const uploadBackup = multer({
  dest: 'uploads/backups/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/sql' || file.mimetype === 'text/plain' || file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('Only SQL files are allowed'));
    }
  }
});
import { 
  validate,
  validateRegister,
  validateLogin,
  validateCreateMatch,
  validateCreatePrediction,
  validateCreateTournament,
  validateId,
  validateUsername,
  validateProfileUpdate,
  validateTimeframeQuery,
  validateCreateTicket,
  validateTicketMessage,
  validateImageUpload,
  sanitizeFilename
} from './validators';
import {
  securityHeaders,
  generateCSRFToken,
  validateCSRFToken,
  detectSuspiciousActivity,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  validatePasswordStrength
} from './security-config';

// Helper: Admin authorization middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied" });
  }
  
  next();
};

// Helper: User authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add health check endpoint for deployment (before other routes)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      message: 'CricProAce Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'cricproace-api'
    });
  });

  // Add API health check for deployments that expect API endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      message: 'CricProAce Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'cricproace-api'
    });
  });

  // Ensure upload directories exist
  const uploadDirs = [
    'public/uploads',
    'public/uploads/teams',
    'public/uploads/profiles',
    'public/uploads/site',
    'public/uploads/tournaments'
  ];
  
  for (const dir of uploadDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating upload directory: ${dir}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
  
  // Set up authentication routes
  setupAuth(app);
  
  // Current user endpoint
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Remove sensitive information
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });
  
  // Serve static files from public directory
  app.use('/uploads', (req, res, next) => {
    // Set caching headers for images 
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    next();
  }, express.static(path.join(process.cwd(), 'public/uploads')));
  
  // API routes
  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams" });
    }
  });
  
  app.post("/api/teams", isAdmin, async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data", error });
    }
  });

  app.put("/api/teams/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      const updatedTeam = await storage.updateTeam(id, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Error updating team" });
    }
  });

  app.get("/api/teams/:id/tournaments", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      const tournaments = await storage.getTournamentsByTeam(id);
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching team tournaments:", error);
      res.status(500).json({ message: "Error fetching team tournaments" });
    }
  });

  app.delete("/api/teams/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error('Team deletion error:', error);
      if (error instanceof Error) {
        switch (error.message) {
          case 'Cannot delete pre-defined team':
            return res.status(403).json({ message: error.message });
          case 'Team not found':
            return res.status(404).json({ message: error.message });
          case 'Failed to delete team':
            return res.status(500).json({ message: error.message });
          default:
            return res.status(500).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Error deleting team" });
    }
  });
  
  // Team logo upload
  app.post("/api/teams/upload-logo", isAdmin, uploadTeamLogo.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Ensure upload directories exist
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public/uploads/teams');
        
        if (!fs.existsSync(uploadDir)) {
          console.log('Creating team logo upload directory:', uploadDir);
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      } catch (dirError) {
        console.error('Error ensuring upload directory exists:', dirError);
      }
      
      const logoUrl = getPublicUrl(req.file.path);
      console.log("Team logo uploaded successfully:", logoUrl);
      console.log("File path:", req.file.path);
      console.log("File details:", req.file);
      res.json({ logoUrl });
    } catch (error) {
      console.error("Error uploading team logo:", error);
      res.status(500).json({ message: "Error uploading team logo", error: (error as Error).message });
    }
  });
  
  // Matches
  app.get("/api/matches", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const matches = await storage.getMatches(status);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Error fetching matches", error: (error as Error).message });
    }
  });
  
  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const match = await storage.getMatchById(id);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match details" });
    }
  });
  
  app.post("/api/matches", isAdmin, async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error) {
      res.status(400).json({ message: "Invalid match data", error });
    }
  });
  
  app.patch("/api/matches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const match = await storage.getMatchById(id);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Handle match result update
      if (req.body.status === 'completed') {
        const validatedData = updateMatchResultSchema.parse(req.body);
        const updatedMatch = await storage.updateMatchResult(id, validatedData);
        return res.json(updatedMatch);
      }
      
      // Handle general match update
      const updatedMatch = await storage.updateMatch(id, req.body);
      res.json(updatedMatch);
    } catch (error) {
      res.status(400).json({ message: "Invalid match data", error });
    }
  });
  
  // Special endpoint for match status update (can be called from client)
  app.patch("/api/matches/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const match = await storage.getMatchById(id);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Only allow status changes to 'ongoing' from this endpoint
      if (req.body.status !== 'ongoing') {
        return res.status(400).json({ message: "This endpoint can only update status to 'ongoing'" });
      }
      
      // Only allow changing from 'upcoming' to 'ongoing'
      if (match.status !== 'upcoming') {
        return res.status(400).json({ message: "Only upcoming matches can be changed to ongoing" });
      }
      
      const updatedMatch = await storage.updateMatch(id, { status: 'ongoing' });
      res.json(updatedMatch);
    } catch (error) {
      res.status(400).json({ message: "Error updating match status", error });
    }
  });

  // Update match - allows admin to update any match details at any time
  app.put("/api/matches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { 
        matchDate, 
        location, 
        status, 
        tossWinnerId, 
        matchWinnerId, 
        team1Score, 
        team2Score, 
        resultSummary, 
        discussionLink 
      } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const match = await storage.getMatchById(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (matchDate) {
        updateData.matchDate = new Date(matchDate);
      }
      
      if (location !== undefined) {
        updateData.location = location;
      }
      
      if (status) {
        updateData.status = status;
      }
      
      if (tossWinnerId !== undefined) {
        updateData.tossWinnerId = tossWinnerId ? parseInt(tossWinnerId.toString()) : null;
      }
      
      if (matchWinnerId !== undefined) {
        updateData.matchWinnerId = matchWinnerId ? parseInt(matchWinnerId.toString()) : null;
      }
      
      if (team1Score !== undefined) {
        updateData.team1Score = team1Score || null;
      }
      
      if (team2Score !== undefined) {
        updateData.team2Score = team2Score || null;
      }
      
      if (resultSummary !== undefined) {
        updateData.resultSummary = resultSummary || null;
      }
      
      if (discussionLink !== undefined) {
        updateData.discussionLink = discussionLink || null;
      }
      
      // Update the match
      const updatedMatch = await storage.updateMatch(id, updateData);
      
      // If match winner is set and status is completed, recalculate points
      if (updateData.matchWinnerId && updateData.status === 'completed') {
        await storage.recalculatePointsForMatch(id);
      }
      
      res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Error updating match" });
    }
  });
  
  app.delete("/api/matches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      // First delete all predictions associated with this match (cascade deletion)
      await storage.deletePredictionsForMatch(id);
      // Then delete the match itself
      await storage.deleteMatch(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting match:", error);
      res.status(500).json({ message: "Error deleting match" });
    }
  });
  
  // Predictions
  app.get("/api/predictions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const predictions = await storage.getUserPredictions(userId);
      
      // Filter out toss predictions for premium tournaments with hidden toss predictions
      const filteredPredictions = await Promise.all(predictions.map(async (prediction: any) => {
        if (prediction.match && prediction.match.tournamentId) {
          const tournament = await storage.getTournamentById(prediction.match.tournamentId!);
          if (tournament && tournament.isPremium && tournament.hideTossPredictions) {
            // Remove toss prediction data for premium tournaments
            return {
              ...prediction,
              predictedTossWinnerId: null,
              predictedTossWinner: null
            };
          }
        }
        return prediction;
      }));
      
      res.json(filteredPredictions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching predictions" });
    }
  });
  
  // Admin route to get all predictions for dashboard stats
  app.get("/api/admin/all-predictions", isAdmin, async (req, res) => {
    try {
      const allPredictions = await storage.getAllPredictions();
      res.json(allPredictions);
    } catch (error) {
      console.error("Error fetching all predictions:", error);
      res.status(500).json({ message: "Error fetching all predictions" });
    }
  });

  // Get prediction statistics for a specific match (vote bands)
  app.get("/api/matches/:id/prediction-stats", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const match = await storage.getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const predictions = await storage.getPredictionsForMatch(matchId);
      
      // Check if toss predictions should be hidden for premium tournaments
      const tournament = await storage.getTournamentById(match.tournamentId!);
      const hideTossPredictions = tournament && tournament.isPremium && tournament.hideTossPredictions;
      
      // Count toss predictions for each team (set to 0 if hidden)
      const tossTeam1Predictions = hideTossPredictions ? 0 : predictions.filter((p: any) => p.predictedTossWinnerId === match.team1Id).length;
      const tossTeam2Predictions = hideTossPredictions ? 0 : predictions.filter((p: any) => p.predictedTossWinnerId === match.team2Id).length;
      const totalTossPredictions = tossTeam1Predictions + tossTeam2Predictions;

      // Count match predictions for each team
      const matchTeam1Predictions = predictions.filter((p: any) => p.predictedMatchWinnerId === match.team1Id).length;
      const matchTeam2Predictions = predictions.filter((p: any) => p.predictedMatchWinnerId === match.team2Id).length;
      const totalMatchPredictions = matchTeam1Predictions + matchTeam2Predictions;

      // Calculate toss percentages
      const tossTeam1Percentage = totalTossPredictions > 0 ? Math.round((tossTeam1Predictions / totalTossPredictions) * 100) : 0;
      const tossTeam2Percentage = totalTossPredictions > 0 ? Math.round((tossTeam2Predictions / totalTossPredictions) * 100) : 0;

      // Calculate match percentages
      const matchTeam1Percentage = totalMatchPredictions > 0 ? Math.round((matchTeam1Predictions / totalMatchPredictions) * 100) : 0;
      const matchTeam2Percentage = totalMatchPredictions > 0 ? Math.round((matchTeam2Predictions / totalMatchPredictions) * 100) : 0;

      const totalPredictions = Math.max(totalTossPredictions, totalMatchPredictions);

      res.json({
        matchId,
        totalPredictions,
        toss: {
          team1: {
            id: match.team1Id,
            name: match.team1?.name || 'Team 1',
            predictions: tossTeam1Predictions,
            percentage: tossTeam1Percentage
          },
          team2: {
            id: match.team2Id,
            name: match.team2?.name || 'Team 2',
            predictions: tossTeam2Predictions,
            percentage: tossTeam2Percentage
          }
        },
        match: {
          team1: {
            id: match.team1Id,
            name: match.team1?.name || 'Team 1',
            predictions: matchTeam1Predictions,
            percentage: matchTeam1Percentage
          },
          team2: {
            id: match.team2Id,
            name: match.team2?.name || 'Team 2',
            predictions: matchTeam2Predictions,
            percentage: matchTeam2Percentage
          }
        }
      });
    } catch (error) {
      console.error("Error fetching prediction stats:", error);
      res.status(500).json({ message: "Error fetching prediction statistics" });
    }
  });
  
  app.post("/api/predictions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Check if user is verified
      const user = await storage.getUserById(userId);
      if (!user?.isVerified) {
        return res.status(403).json({ message: "Only verified users can make predictions. Please contact admin for verification." });
      }
      
      const validatedData = insertPredictionSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if match is still open for predictions
      const match = await storage.getMatchById(validatedData.matchId);
      if (!match || match.status !== 'upcoming') {
        return res.status(400).json({ message: "Predictions are closed for this match" });
      }
      
      // Check premium access if match is in a premium tournament
      if (match.tournamentId) {
        const tournament = await storage.getTournamentById(match.tournamentId);
        if (tournament?.isPremium) {
          const hasAccess = await storage.isPremiumUser(match.tournamentId, userId);
          if (!hasAccess) {
            return res.status(403).json({ message: "This is a premium tournament. Only selected users can make predictions." });
          }
        }
      }
      
      // Check if user has already predicted for this match
      const existingPrediction = await storage.getUserPredictionForMatch(userId, validatedData.matchId);
      if (existingPrediction) {
        // Update the existing prediction
        const updatedPrediction = await storage.updatePrediction(existingPrediction.id, validatedData);
        return res.json(updatedPrediction);
      }
      
      // Create new prediction
      const prediction = await storage.createPrediction(validatedData);
      res.status(201).json(prediction);
    } catch (error) {
      res.status(400).json({ message: "Invalid prediction data", error });
    }
  });
  
  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || 'all-time';
      const tournamentId = req.query.tournamentId ? parseInt(req.query.tournamentId as string, 10) : undefined;
      
      if (tournamentId) {
        // Get tournament-specific leaderboard
        const leaderboard = await storage.getTournamentLeaderboard(tournamentId, timeframe);
        res.json(leaderboard);
      } else {
        // Get overall leaderboard
        const leaderboard = await storage.getLeaderboard(timeframe);
        res.json(leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Error fetching leaderboard", error: (error as Error).message });
    }
  });
  
  // Users
  // Public user profile endpoint
  app.get("/api/users/:username", async (req, res) => {
    try {
      const username = req.params.username.trim();
      
      // Log the request for debugging
      console.log(`[DEBUG] Searching for user: "${username}"`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[DEBUG] User not found: "${username}"`);
        
        // Check if it's a common case issue or similar username
        const allUsers = await storage.getAllUsers();
        const similarUsers = allUsers.filter(u => 
          u.username.toLowerCase().includes(username.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(username.toLowerCase())
        );
        
        if (similarUsers.length > 0) {
          console.log(`[DEBUG] Similar users found:`, similarUsers.map(u => u.username));
        }
        
        return res.status(404).json({ 
          message: "User not found",
          searchedFor: username,
          availableUsers: allUsers.map(u => u.username)
        });
      }
      
      // Use current user points from users table instead of calculating from pointsLedger
      const actualPoints = Number(user.points) || 0;
      
      // Get user statistics with fallbacks
      let correctPredictions = 0;
      let totalMatches = 0;
      let viewedByCount = 0;
      
      try {
        const userStats = await storage.getUserStats(user.id);
        correctPredictions = userStats?.correctPredictions || 0;
        totalMatches = userStats?.totalMatches || 0;
        viewedByCount = user.viewedByCount || 0;
      } catch (error) {
        console.warn(`Could not fetch stats for user ${user.id}, using defaults:`, error);
      }
      
      // Remove sensitive information and ensure all required fields exist
      const { password, ...safeUser } = user;
      res.json({ 
        ...safeUser, 
        points: actualPoints,
        correctPredictions,
        totalMatches,
        viewedByCount,
        displayName: user.displayName || user.username,
        profileImage: user.profileImage || null,
        isVerified: user.isVerified || false
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Public user predictions endpoint
  app.get("/api/users/:username/predictions", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const predictions = await storage.getUserPredictions(user.id);
      
      // Filter predictions to hide toss predictions for premium tournaments with hideTossPredictions enabled
      const filteredPredictions = await Promise.all(
        predictions.map(async (prediction) => {
          // Get tournament details to check if toss predictions should be hidden
          const tournament = await storage.getTournamentById(prediction.match.tournamentId!);
          if (tournament && tournament.isPremium && tournament.hideTossPredictions) {
            // Remove toss prediction data for premium tournaments with hidden toss predictions
            return {
              ...prediction,
              predictedTossWinnerId: null,
              predictedTossWinner: null
            };
          }
          
          return prediction;
        })
      );
      
      res.json(filteredPredictions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching predictions" });
    }
  });





  app.post("/api/users/:username/view", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.incrementUserViewCount(user.id);
      res.json({ 
        viewedByCount: updatedUser.viewedByCount,
        message: "View count updated"
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating view count" });
    }
  });

  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Admin route to get all users for point management
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Admin route to update user points
  app.put("/api/admin/users/:id/points", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { points } = req.body;

      if (isNaN(userId) || isNaN(points) || points < 0) {
        return res.status(400).json({ message: "Invalid user ID or points value" });
      }

      const updatedUser = await storage.updateUserPoints(userId, points);
      res.json({ message: "Points updated successfully", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Error updating user points" });
    }
  });
  
  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updateData = { ...req.body };
      
      // Clean empty string fields to prevent overwriting with empty values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key];
        }
      });
      
      // Handle password update properly
      if (updateData.password && updateData.password.trim() !== '') {
        updateData.password = await hashPassword(updateData.password.trim());
      } else {
        // Remove password field if empty to avoid overwriting existing password
        delete updateData.password;
      }
      
      // Handle security code update
      if (updateData.securityCode && updateData.securityCode.trim() !== '') {
        updateData.securityCode = updateData.securityCode.trim();
      } else if (updateData.securityCode === '') {
        delete updateData.securityCode;
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      
      // Remove password and security code from response
      const { password, securityCode, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Admin route to edit user points
  app.put("/api/admin/users/:id/points", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { points } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (typeof points !== 'number' || points < 0) {
        return res.status(400).json({ message: "Points must be a non-negative number" });
      }
      
      // Update user points directly
      const updatedUser = await storage.updateUserPoints(userId, points);
      
      res.json({ 
        message: "User points updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user points:", error);
      res.status(500).json({ message: "Error updating user points" });
    }
  });
  
  // Profile
  app.patch("/api/profile", isAuthenticated, validateProfileUpdate, validate, async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Validate update data
      const allowedUpdates = ['displayName', 'email'];
      const updates = Object.keys(req.body).reduce((acc: any, key) => {
        if (allowedUpdates.includes(key)) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });
  
  // Change password
  app.post("/api/profile/change-password", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const passwordValid = await comparePasswords(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error changing password" });
    }
  });
  
  // User profile image upload
  app.post("/api/profile/upload-image", isAuthenticated, uploadUserProfile.single('image'), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const profileImage = getPublicUrl(req.file.path);
      
      // Update user profile with new image URL
      const updatedUser = await storage.updateUser(userId, { profileImage });
      res.json({ profileImage, user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Error uploading profile image", error });
    }
  });
  
  // Site Settings - Issue #8
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const value = await storage.getSetting(key);
      
      if (value === null) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving setting" });
    }
  });
  
  app.put("/api/settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      await storage.updateSetting(key, value);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Error updating setting" });
    }
  });
  
  // Site logo upload
  app.post("/api/settings/upload-logo", isAdmin, uploadSiteLogo.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Generate unique timestamp to avoid browser caching
      const timestamp = Date.now();
      
      // Get the logo URL with cache-busting parameter
      const logoUrl = `${getPublicUrl(req.file.path)}?t=${timestamp}`;
      
      console.log("Site logo uploaded successfully:", logoUrl);
      console.log("File path:", req.file.path);
      
      // Update site logo setting with cache-busting URL
      await storage.updateSetting('siteLogo', logoUrl);
      
      // Return the updated logo URL with cache-busting parameter
      res.json({ logoUrl });
    } catch (error) {
      console.error("Error uploading site logo:", error);
      res.status(500).json({ message: "Error uploading site logo", error: (error as Error).message });
    }
  });

  // General upload route for images
  app.post("/api/upload", isAdmin, uploadTournamentImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const imageUrl = getPublicUrl(req.file.path);
      console.log("Image uploaded successfully:", imageUrl);
      console.log("File path:", req.file.path);
      
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Error uploading image", error: (error as Error).message });
    }
  });

  // Tournament Routes
  
  // Get all tournaments
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      // Add match count for each tournament
      const tournamentsWithCounts = await Promise.all(
        tournaments.map(async (tournament) => {
          const matches = await storage.getMatchesByTournament(tournament.id);
          return {
            ...tournament,
            matchCount: matches.length
          };
        })
      );
      res.json(tournamentsWithCounts);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Error fetching tournaments" });
    }
  });

  // Get tournament by ID
  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const tournament = await storage.getTournamentById(id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ message: "Error fetching tournament" });
    }
  });

  // Get matches by tournament
  app.get("/api/tournaments/:id/matches", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const matches = await storage.getMatchesByTournament(tournamentId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching tournament matches:", error);
      res.status(500).json({ message: "Error fetching tournament matches" });
    }
  });

  // Create tournament (admin only)
  app.post("/api/tournaments", isAdmin, async (req, res) => {
    try {
      const { selectedUserIds, ...tournamentData } = req.body;
      const validatedData = insertTournamentSchema.parse(tournamentData);
      
      // Check for duplicate tournament name
      const existingTournament = await storage.getTournamentByName(validatedData.name);
      if (existingTournament) {
        return res.status(400).json({ 
          message: "Tournament name already exists", 
          error: `A tournament named "${validatedData.name}" already exists. Please choose a different name.` 
        });
      }
      
      const tournament = await storage.createTournament(validatedData);
      
      // If premium tournament with selected users, add them to premium users table
      if (tournament.isPremium && selectedUserIds && Array.isArray(selectedUserIds)) {
        for (const userId of selectedUserIds) {
          try {
            await storage.addPremiumUser(tournament.id, userId);
          } catch (error) {
            console.error(`Error adding premium user ${userId} to tournament ${tournament.id}:`, error);
          }
        }
      }
      
      res.status(201).json(tournament);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      if (error.code === '23505' && error.constraint === 'tournaments_name_unique') {
        res.status(400).json({ 
          message: "Tournament name already exists", 
          error: "Please choose a different tournament name." 
        });
      } else {
        res.status(400).json({ message: "Invalid tournament data", error: error?.message || String(error) });
      }
    }
  });

  // Update tournament (admin only)
  app.put("/api/tournaments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { selectedUserIds, ...tournamentData } = req.body;
      const updatedTournament = await storage.updateTournament(id, tournamentData);
      
      // Handle premium user updates if this is a premium tournament
      if (updatedTournament.isPremium && selectedUserIds && Array.isArray(selectedUserIds)) {
        // Clear existing premium users for this tournament
        const existingPremiumUsers = await storage.getPremiumUsers(id);
        for (const premiumUser of existingPremiumUsers) {
          await storage.removePremiumUser(id, premiumUser.userId);
        }
        
        // Add new premium users
        for (const userId of selectedUserIds) {
          try {
            await storage.addPremiumUser(id, userId);
          } catch (error) {
            console.error(`Error adding premium user ${userId} to tournament ${id}:`, error);
          }
        }
      } else if (!updatedTournament.isPremium) {
        // If tournament is no longer premium, remove all premium users
        const existingPremiumUsers = await storage.getPremiumUsers(id);
        for (const premiumUser of existingPremiumUsers) {
          await storage.removePremiumUser(id, premiumUser.userId);
        }
      }
      
      res.json(updatedTournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(400).json({ message: "Invalid tournament data", error });
    }
  });

  // Update tournament (admin only) - PATCH method
  app.patch("/api/tournaments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { selectedUserIds, ...tournamentData } = req.body;
      const updatedTournament = await storage.updateTournament(id, tournamentData);
      
      // Handle premium user updates if this is a premium tournament
      if (updatedTournament.isPremium && selectedUserIds && Array.isArray(selectedUserIds)) {
        // Clear existing premium users for this tournament
        const existingPremiumUsers = await storage.getPremiumUsers(id);
        for (const premiumUser of existingPremiumUsers) {
          await storage.removePremiumUser(id, premiumUser.userId);
        }
        
        // Add new premium users
        for (const userId of selectedUserIds) {
          try {
            await storage.addPremiumUser(id, userId);
          } catch (error) {
            console.error(`Error adding premium user ${userId} to tournament ${id}:`, error);
          }
        }
      } else if (!updatedTournament.isPremium) {
        // If tournament is no longer premium, remove all premium users
        const existingPremiumUsers = await storage.getPremiumUsers(id);
        for (const premiumUser of existingPremiumUsers) {
          await storage.removePremiumUser(id, premiumUser.userId);
        }
      }
      
      res.json(updatedTournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      res.status(400).json({ message: "Invalid tournament data", error });
    }
  });

  // Get selected users for premium tournament (admin only)
  app.get("/api/tournaments/:id/selected-users", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const premiumUsers = await storage.getPremiumUsers(tournamentId);
      
      // Get full user details for each premium user
      const users = await Promise.all(
        premiumUsers.map(async (premiumUser: any) => {
          const user = await storage.getUserById(premiumUser.userId);
          return {
            id: user?.id,
            username: user?.username,
            displayName: user?.displayName || user?.username
          };
        })
      );
      
      res.json(users.filter(user => user.id)); // Filter out any null users
    } catch (error) {
      console.error("Error fetching selected users:", error);
      res.status(500).json({ message: "Error fetching selected users" });
    }
  });

  // Delete tournament (admin only)
  app.delete("/api/tournaments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteTournament(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ message: "Error deleting tournament" });
    }
  });

  // Team-Tournament Association Routes
  
  // Get teams by tournament
  app.get("/api/tournaments/:id/teams", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const teams = await storage.getTeamsByTournament(tournamentId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching tournament teams:", error);
      res.status(500).json({ message: "Error fetching tournament teams" });
    }
  });

  // Add team to tournament (for team creation with tournament association)
  app.post("/api/tournaments/:tournamentId/teams", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const { teamId } = req.body;
      
      await storage.addTeamToTournament(tournamentId, teamId);
      res.status(200).json({ message: "Team added to tournament successfully" });
    } catch (error) {
      console.error("Error adding team to tournament:", error);
      res.status(500).json({ message: "Error adding team to tournament" });
    }
  });

  // Add team to tournament (alternative route)
  app.post("/api/tournaments/:tournamentId/teams/:teamId", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const teamId = parseInt(req.params.teamId, 10);
      
      await storage.addTeamToTournament(tournamentId, teamId);
      res.status(201).json({ message: "Team added to tournament successfully" });
    } catch (error) {
      console.error("Error adding team to tournament:", error);
      res.status(500).json({ message: "Error adding team to tournament" });
    }
  });

  // Remove team from tournament
  app.delete("/api/tournaments/:tournamentId/teams/:teamId", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId, 10);
      const teamId = parseInt(req.params.teamId, 10);
      
      await storage.removeTeamFromTournament(tournamentId, teamId);
      res.status(200).json({ message: "Team removed from tournament successfully" });
    } catch (error) {
      console.error("Error removing team from tournament:", error);
      res.status(500).json({ message: "Error removing team from tournament" });
    }
  });

  // Tournament Analysis Routes
  
  // Get tournament analysis data
  app.get("/api/tournaments/:id/analysis", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      
      // Get tournament leaderboard
      const leaderboard = await storage.getTournamentLeaderboard(tournamentId, 'all-time');
      
      // Transform to analysis format
      const analysisData = leaderboard.map((user, index) => {
        const accuracy = user.totalMatches > 0 ? (user.correctPredictions / (user.totalMatches * 2)) * 100 : 0;
        
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
          totalMatches: user.totalMatches,
          correctTossPredictions: Math.floor(user.correctPredictions / 2),
          correctMatchPredictions: Math.ceil(user.correctPredictions / 2),
          totalPoints: user.points,
          accuracy: accuracy,
          rank: index + 1
        };
      });
      
      res.json(analysisData);
    } catch (error) {
      console.error("Error fetching tournament analysis:", error);
      res.status(500).json({ message: "Error fetching tournament analysis" });
    }
  });

  // Get tournament matches analysis
  app.get("/api/tournaments/:id/matches-analysis", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      
      // Get matches for tournament - filter to only completed matches
      const allMatches = await storage.getMatchesByTournament(tournamentId);
      const matches = allMatches.filter(match => match.status === 'completed');
      
      const matchesAnalysis = await Promise.all(
        matches.map(async (match) => {
          // Get prediction stats for this match
          const predictions = await storage.getPredictionsForMatch(match.id);
          
          // Calculate toss predictions
          const tossTeam1Predictions = predictions.filter(p => p.predictedTossWinnerId === match.team1Id).length;
          const tossTeam2Predictions = predictions.filter(p => p.predictedTossWinnerId === match.team2Id).length;
          const totalTossPredictions = tossTeam1Predictions + tossTeam2Predictions;
          
          // Calculate match predictions
          const matchTeam1Predictions = predictions.filter(p => p.predictedMatchWinnerId === match.team1Id).length;
          const matchTeam2Predictions = predictions.filter(p => p.predictedMatchWinnerId === match.team2Id).length;
          const totalMatchPredictions = matchTeam1Predictions + matchTeam2Predictions;
          
          // Get user predictions with results
          const userPredictions = await Promise.all(
            predictions.map(async (prediction) => {
              const user = await storage.getUser(prediction.userId);
              if (!user) return null;
              
              const tossCorrect = match.tossWinnerId && prediction.predictedTossWinnerId === match.tossWinnerId;
              const matchCorrect = match.matchWinnerId && prediction.predictedMatchWinnerId === match.matchWinnerId;
              const pointsEarned = (tossCorrect ? 1 : 0) + (matchCorrect ? 1 : 0);
              
              return {
                userId: user.id,
                username: user.username,
                displayName: user.displayName,
                profileImage: user.profileImage,
                predictedTossWinner: prediction.predictedTossWinnerId === match.team1Id ? match.team1.name : match.team2.name,
                predictedMatchWinner: prediction.predictedMatchWinnerId === match.team1Id ? match.team1.name : match.team2.name,
                tossCorrect: !!tossCorrect,
                matchCorrect: !!matchCorrect,
                pointsEarned
              };
            })
          );
          
          return {
            id: match.id,
            team1: {
              id: match.team1.id,
              name: match.team1.name,
              logoUrl: match.team1.logoUrl
            },
            team2: {
              id: match.team2.id,
              name: match.team2.name,
              logoUrl: match.team2.logoUrl
            },
            matchDate: match.matchDate.toISOString(),
            status: match.status,
            location: match.location,
            tossWinner: match.tossWinner ? {
              id: match.tossWinner.id,
              name: match.tossWinner.name
            } : undefined,
            matchWinner: match.matchWinner ? {
              id: match.matchWinner.id,
              name: match.matchWinner.name
            } : undefined,
            totalPredictions: predictions.length,
            tossStats: {
              team1Predictions: tossTeam1Predictions,
              team2Predictions: tossTeam2Predictions,
              team1Percentage: totalTossPredictions > 0 ? Math.round((tossTeam1Predictions / totalTossPredictions) * 100) : 0,
              team2Percentage: totalTossPredictions > 0 ? Math.round((tossTeam2Predictions / totalTossPredictions) * 100) : 0
            },
            matchStats: {
              team1Predictions: matchTeam1Predictions,
              team2Predictions: matchTeam2Predictions,
              team1Percentage: totalMatchPredictions > 0 ? Math.round((matchTeam1Predictions / totalMatchPredictions) * 100) : 0,
              team2Percentage: totalMatchPredictions > 0 ? Math.round((matchTeam2Predictions / totalMatchPredictions) * 100) : 0
            },
            userPredictions: userPredictions.filter(Boolean)
          };
        })
      );
      
      res.json(matchesAnalysis);
    } catch (error) {
      console.error("Error fetching tournament matches analysis:", error);
      res.status(500).json({ message: "Error fetching tournament matches analysis" });
    }
  });

  // Admin User Management Routes
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Update user verification status (admin only)
  app.patch("/api/admin/users/:id/verify", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { isVerified } = req.body;
      
      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "isVerified must be a boolean value" });
      }
      
      const updatedUser = await storage.updateUserVerification(userId, isVerified);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user verification:", error);
      res.status(500).json({ message: "Error updating user verification" });
    }
  });

  // Support Ticket Routes
  
  // Create a new support ticket (user only)
  app.post("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { subject, priority } = req.body;
      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      const ticket = await storage.createSupportTicket(userId, subject, priority);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Error creating ticket" });
    }
  });

  // Get user's tickets
  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const tickets = await storage.getUserTickets(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Error fetching tickets" });
    }
  });

  // Get all tickets (admin only)
  app.get("/api/admin/tickets", isAdmin, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Error fetching tickets" });
    }
  });

  // Get specific ticket with messages
  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      const isUserAdmin = req.user?.role === 'admin';

      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      const ticket = await storage.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user owns the ticket or is admin
      if (ticket.userId !== userId && !isUserAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getTicketMessages(ticketId);
      res.json({ ticket, messages });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Error fetching ticket" });
    }
  });

  // Add message to ticket
  app.post("/api/tickets/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      const isUserAdmin = req.user?.role === 'admin';
      const { message } = req.body;

      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      const ticket = await storage.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user owns the ticket or is admin
      if (ticket.userId !== userId && !isUserAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const ticketMessage = await storage.addTicketMessage(
        ticketId, 
        userId!, 
        message.trim(), 
        isUserAdmin
      );

      res.json(ticketMessage);
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ message: "Error adding message" });
    }
  });

  // Update ticket status (admin only)
  app.patch("/api/tickets/:id/status", isAdmin, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const { status, assignedToUserId } = req.body;

      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedTicket = await storage.updateTicketStatus(ticketId, status, assignedToUserId);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Error updating ticket status" });
    }
  });

  // Update ticket (admin only) - alternative route for admin support page
  app.patch("/api/admin/tickets/:id", isAdmin, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const { status, assignedToUserId } = req.body;

      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedTicket = await storage.updateTicketStatus(ticketId, status, assignedToUserId);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Error updating ticket" });
    }
  });

  // Premium Tournament Management Routes
  
  // Add premium user to tournament (admin only)
  app.post("/api/tournaments/:id/premium-users", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const premiumUser = await storage.addPremiumUser(tournamentId, userId);
      res.status(201).json(premiumUser);
    } catch (error) {
      console.error("Error adding premium user:", error);
      res.status(500).json({ message: "Error adding premium user" });
    }
  });

  // Remove premium user from tournament (admin only)
  app.delete("/api/tournaments/:id/premium-users/:userId", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);
      
      await storage.removePremiumUser(tournamentId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing premium user:", error);
      res.status(500).json({ message: "Error removing premium user" });
    }
  });

  // Get premium users for tournament (admin only)
  app.get("/api/tournaments/:id/premium-users", isAdmin, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const premiumUsers = await storage.getPremiumUsers(tournamentId);
      res.json(premiumUsers);
    } catch (error) {
      console.error("Error fetching premium users:", error);
      res.status(500).json({ message: "Error fetching premium users" });
    }
  });

  // Check if user has premium access to tournament
  app.get("/api/tournaments/:id/premium-access", isAuthenticated, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      
      const isPremium = await storage.isPremiumUser(tournamentId, userId);
      res.json({ isPremium });
    } catch (error) {
      console.error("Error checking premium access:", error);
      res.status(500).json({ message: "Error checking premium access" });
    }
  });

  // Tournament-specific leaderboard
  app.get("/api/tournaments/:id/leaderboard", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      const leaderboard = await storage.getTournamentLeaderboard(tournamentId, "all");
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching tournament leaderboard:", error);
      res.status(500).json({ message: "Error fetching tournament leaderboard" });
    }
  });

  // Backup and Restore Routes
  app.get("/api/admin/backups", isAdmin, async (req, res) => {
    try {
      const { SimpleBackupManager } = await import('./simple-backup');
      const backups = await SimpleBackupManager.listBackups();
      res.json(backups || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Error fetching backups", error: (error as Error).message });
    }
  });

  app.post("/api/admin/backup/create", isAdmin, async (req, res) => {
    try {
      const { SimpleBackupManager } = await import('./simple-backup');
      const backup = await SimpleBackupManager.createBackup();
      res.json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Error creating backup", error: (error as Error).message });
    }
  });

  app.get("/api/admin/backup/download/:backupId", isAdmin, async (req, res) => {
    try {
      const { SimpleBackupManager } = await import('./simple-backup');
      const backupData = await SimpleBackupManager.downloadBackup(req.params.backupId);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.backupId}.sql"`);
      res.send(backupData);
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(404).json({ message: "Backup not found" });
    }
  });

  app.delete("/api/admin/backup/delete/:backupId", isAdmin, async (req, res) => {
    try {
      const { SimpleBackupManager } = await import('./simple-backup');
      await SimpleBackupManager.deleteBackup(req.params.backupId);
      res.json({ message: "Backup deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ message: "Error deleting backup", error: (error as Error).message });
    }
  });

  app.post("/api/admin/backup/restore", isAdmin, uploadBackup.single('backup'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No backup file uploaded" });
      }

      const fs = await import('fs');
      const sqlContent = fs.readFileSync(req.file.path, 'utf8');
      
      const { SimpleBackupManager } = await import('./simple-backup');
      const result = await SimpleBackupManager.restoreBackup(sqlContent);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        message: "Backup restored successfully",
        recordCount: result.recordCount
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ message: "Error restoring backup", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
