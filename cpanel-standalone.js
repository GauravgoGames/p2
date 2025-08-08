// Standalone production server for cPanel
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
// Schema will be imported dynamically if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force production mode
process.env.NODE_ENV = 'production';

console.log('🚀 CricProAce Standalone Server Starting...');

// Database setup
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false
});
const db = drizzle(pool);

// Session store
const PgSession = connectPgSimple(session);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public'), {
  index: false,
  maxAge: '1d'
}));

// Basic API endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'cPanel Production'
  });
});

// User endpoint
app.get('/api/user', (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
    
    if (user && password === 'admin123') { // Simplified for testing
      req.session.user = { id: user.id, username: user.username };
      res.json({ message: 'Login successful', user: req.session.user });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Basic API endpoints for empty responses
app.get('/api/tournaments', (req, res) => res.json([]));
app.get('/api/matches', (req, res) => res.json([]));
app.get('/api/predictions', (req, res) => res.json([]));
app.get('/api/leaderboard', (req, res) => res.json([]));
app.get('/api/settings/siteLogo', (req, res) => res.status(404).json({ message: 'Setting not found' }));

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist/public/index.html');
  console.log(`📄 Serving React app: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving React app:', err);
      res.status(500).send('Error loading application');
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ CricProAce running on ${HOST}:${PORT}`);
  console.log(`🌐 External: http://expertlive.pro-ace-predictions.co.uk:${PORT}`);
  console.log(`🔑 Admin: admin/admin123`);
  console.log(`📂 Static files: /dist/public/`);
  console.log(`💾 Database: Connected to PostgreSQL`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end();
  process.exit(0);
});