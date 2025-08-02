import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cors from "cors";
import { 
  validateAndSanitizeInput, 
  validateContentType,
  adminIPWhitelist 
} from "./security-utils";

const app = express();

// Enhanced Security middleware with development-friendly CSP
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com"]
        : ["'self'", "https://replit.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: isDevelopment
        ? ["'self'", "ws:", "wss:", "http:", "https:"]
        : ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: isDevelopment ? ["'self'", "blob:"] : ["'none'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || true
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Enhanced Rate limiting with security hardening
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Reduced to 500 requests per windowMs for better security
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.round(Date.now() / 1000)
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit for auth attempts
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      retryAfter: Math.round(Date.now() / 1000)
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Very strict for admin endpoints
  message: { error: 'Too many requests to sensitive endpoints.' },
  standardHeaders: true,
  legacyHeaders: false
});

const applyRateLimiters = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for static assets and non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Apply strict limiting to admin endpoints
  if (req.path.startsWith('/api/admin/')) {
    return strictLimiter(req, res, next);
  }
  
  // Apply auth limiting to authentication endpoints
  if (req.path === '/api/login' || req.path === '/api/register' || 
      req.path.startsWith('/api/forgot-password')) {
    return authLimiter(req, res, next);
  }
  
  // Apply general limiting to all other API endpoints
  return generalLimiter(req, res, next);
};

app.use(applyRateLimiters);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Enhanced body parsing middleware with security hardening
app.use(express.json({ 
  limit: '10kb',
  strict: true,
  type: ['application/json']
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '10kb',
  parameterLimit: 100
}));

// Enhanced input validation and security middleware
app.use(validateAndSanitizeInput);

// Content-Type validation for API endpoints
app.use('/api', validateContentType(['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']));

// IP whitelisting for admin endpoints (if configured)
app.use('/api/admin', adminIPWhitelist);

// Additional security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add comprehensive security headers (development-aware)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
  
  // Relax COEP in development for Vite compatibility
  if (!isDevelopment) {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000 for Replit
  // or use PORT environment variable for deployments
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = "0.0.0.0"; // Listen on all interfaces for deployment compatibility
  
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on ${host}:${port} (${process.env.NODE_ENV || 'development'} mode)`);
  });
})();
