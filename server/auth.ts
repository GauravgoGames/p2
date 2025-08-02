import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from 'bcryptjs';
import { storage } from "./storage";
import { User } from "@shared/schema";
import { 
  validatePasswordStrength,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins
} from './security-config';

declare global {
  namespace Express {
    // Define Express User interface to match our User type
    interface User {
      id: number;
      username: string;
      email: string | null;
      password: string;
      displayName: string | null;
      profileImage: string | null;
      role: 'user' | 'admin';
      points: number;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express): void {
  const sessionSecret = process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (reduced from 30 days)
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    },
    name: 'cricpro_sid', // Change from default session name
    rolling: true // Reset expiry on activity
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check for account lockout first
        if (checkAccountLockout(username)) {
          return done(null, false, { message: 'Account temporarily locked due to too many failed login attempts' });
        }

        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          recordFailedLogin(username);
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        
        if (!passwordMatch) {
          recordFailedLogin(username);
          return done(null, false, { message: 'Invalid credentials' });
        } else {
          // Clear failed login attempts on successful login
          clearFailedLogins(username);
          return done(null, user);
        }
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // @ts-ignore - Type issue with null vs undefined
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, displayName } = req.body;
      
      // Basic validation
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ message: "Username must be 3-20 characters and contain only letters, numbers, and underscores" });
      }
      
      // Enhanced password strength validation
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email: email || null,
        displayName: displayName || null,
      });
      
      // Check if the request is coming from the admin panel
      const isAdminCreation = req.headers['x-admin-creation'] === 'true';
      
      if (isAdminCreation) {
        // For admin user creation, don't auto-login the created user
        return res.status(201).json(user);
      } else {
        // For regular registration, log in the user as before
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(201).json(user);
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error creating user account" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Forgot password - verify security code
  app.post("/api/forgot-password/verify", async (req, res) => {
    try {
      const { username, securityCode } = req.body;
      
      if (!username || !securityCode) {
        return res.status(400).json({ message: "Username and security code are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.securityCode) {
        return res.status(400).json({ message: "Security code not set for this user" });
      }
      
      if (user.securityCode !== securityCode.trim()) {
        return res.status(400).json({ message: "Invalid security code" });
      }
      
      res.json({ message: "Security code verified", userId: user.id });
    } catch (error) {
      console.error("Error verifying security code:", error);
      res.status(500).json({ message: "Error verifying security code" });
    }
  });

  // Forgot password - reset password
  app.post("/api/forgot-password/reset", async (req, res) => {
    try {
      const { username, securityCode, newPassword } = req.body;
      
      if (!username || !securityCode || !newPassword) {
        return res.status(400).json({ message: "Username, security code, and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.securityCode || user.securityCode !== securityCode.trim()) {
        return res.status(400).json({ message: "Invalid security code" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password");
      res.status(500).json({ message: "Error resetting password" });
    }
  });
}
