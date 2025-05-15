import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from 'bcryptjs';
import { storage } from "./storage";
import { User } from "@shared/schema";

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
  const sessionSecret = process.env.SESSION_SECRET || 'proace-predictions-secret-key';
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);
        console.log(`User found:`, user ? 'Yes' : 'No');
        
        if (!user) {
          console.log('User not found');
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match:`, passwordMatch ? 'Yes' : 'No');
        
        if (!passwordMatch) {
          return done(null, false);
        } else {
          // @ts-ignore - Type issue with returned user format
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
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      
      // Create user without logging in
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
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
          // @ts-ignore - Type issues with user format
          return res.status(201).json(user);
        });
      }
    } catch (error) {
      next(error);
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
}
