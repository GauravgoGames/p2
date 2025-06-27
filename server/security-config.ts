import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Security headers for API responses
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// CSRF token generation and validation
const csrfTokens = new Map<string, { token: string; timestamp: number }>();

export const generateCSRFToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    timestamp: Date.now()
  });
  
  // Clean up old tokens (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, data] of csrfTokens.entries()) {
    if (data.timestamp < oneHourAgo) {
      csrfTokens.delete(id);
    }
  }
  
  return token;
};

export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF validation for GET requests and public endpoints
  if (req.method === 'GET' || req.path.startsWith('/api/embed/')) {
    return next();
  }
  
  const sessionId = req.sessionID;
  const providedToken = req.headers['x-csrf-token'] as string;
  
  if (!sessionId || !providedToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  
  const storedData = csrfTokens.get(sessionId);
  if (!storedData || storedData.token !== providedToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  next();
};

// SQL injection prevention helpers
export const sanitizeInput = (input: string): string => {
  // Remove SQL meta-characters
  return input
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%": return "\\" + char;
        default: return char;
      }
    });
};

// IP-based fraud detection
const suspiciousIPs = new Map<string, { count: number; lastAttempt: number }>();

export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '';
  const now = Date.now();
  
  const activity = suspiciousIPs.get(ip) || { count: 0, lastAttempt: 0 };
  
  // Reset count if last attempt was more than 1 hour ago
  if (now - activity.lastAttempt > 60 * 60 * 1000) {
    activity.count = 0;
  }
  
  activity.count++;
  activity.lastAttempt = now;
  suspiciousIPs.set(ip, activity);
  
  // Block if too many suspicious attempts
  if (activity.count > 50) {
    return res.status(429).json({ 
      message: 'Suspicious activity detected. Please try again later.' 
    });
  }
  
  // Clean up old entries
  for (const [storedIp, data] of suspiciousIPs.entries()) {
    if (now - data.lastAttempt > 24 * 60 * 60 * 1000) { // 24 hours
      suspiciousIPs.delete(storedIp);
    }
  }
  
  next();
};

// Session security configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  },
  name: 'sessionId' // Change from default 'connect.sid'
};

// Password strength validation
export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

// Account lockout mechanism
const accountLockouts = new Map<string, { attempts: number; lockedUntil?: number }>();

export const checkAccountLockout = (username: string): boolean => {
  const lockout = accountLockouts.get(username);
  if (!lockout) return false;
  
  if (lockout.lockedUntil && lockout.lockedUntil > Date.now()) {
    return true; // Account is locked
  }
  
  // Reset if lockout period has expired
  if (lockout.lockedUntil && lockout.lockedUntil <= Date.now()) {
    accountLockouts.delete(username);
  }
  
  return false;
};

export const recordFailedLogin = (username: string) => {
  const lockout = accountLockouts.get(username) || { attempts: 0 };
  lockout.attempts++;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (lockout.attempts >= 5) {
    lockout.lockedUntil = Date.now() + 30 * 60 * 1000;
  }
  
  accountLockouts.set(username, lockout);
};

export const clearFailedLogins = (username: string) => {
  accountLockouts.delete(username);
};

// Content Security Policy for embedded widgets
export const embedCSP = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    frameAncestors: ["*"], // Allow embedding in any domain
  },
};