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
  insertPredictionSchema 
} from "@shared/schema";
import { uploadTeamLogo, uploadUserProfile, uploadSiteLogo, getPublicUrl } from "./upload";

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
  // Ensure upload directories exist
  const uploadDirs = [
    'public/uploads',
    'public/uploads/teams',
    'public/uploads/profiles',
    'public/uploads/site'
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
      res.status(500).json({ message: "Error fetching matches" });
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

  app.delete("/api/matches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteMatch(id);
      res.status(204).send();
    } catch (error) {
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
      res.json(predictions);
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

  app.post("/api/predictions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
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
      const leaderboard = await storage.getLeaderboard(timeframe);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });

  // Users
  // Public user profile endpoint
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive information
      const { password, ...safeUser } = user;
      res.json(safeUser);
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
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching predictions" });
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

  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
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

  // Profile
  app.patch("/api/profile", isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}