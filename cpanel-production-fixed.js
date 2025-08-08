// Production server for cPanel hosting - FIXED VERSION
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force production mode
process.env.NODE_ENV = 'production';

console.log(`🚀 CricProAce Production Server Starting...`);
console.log(`📁 Serving from: ${path.join(__dirname, 'dist/public')}`);

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public'), {
  index: false,  // Don't auto-serve index.html
  maxAge: '1d'   // Cache static assets for 1 day
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'cPanel Production',
    staticPath: path.join(__dirname, 'dist/public')
  });
});

// Import and setup the main application
try {
  const { default: mainApp } = await import('./dist/index.js');
  
  // Use the main application for API routes
  app.use('/api', mainApp);
  
  // Serve React app for all other routes (SPA fallback)
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist/public/index.html');
    console.log(`📄 Serving React app: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving React app:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
  
} catch (error) {
  console.error('❌ Failed to import main application:', error);
  
  // Fallback: serve static files only
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist/public/index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(500).send('Error: Application not found');
      }
    });
  });
}

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ CricProAce running on ${HOST}:${PORT}`);
  console.log(`🌐 External: http://expertlive.pro-ace-predictions.co.uk:${PORT}`);
  console.log(`🔑 Admin: admin/admin123`);
  console.log(`📂 Static files: /dist/public/`);
});