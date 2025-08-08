// Production server for cPanel hosting
// This runs the built application on cPanel
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Import the built application
import('./dist/index.js')
  .then(module => {
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';
    
    console.log(`🚀 CricProAce starting on ${HOST}:${PORT}`);
    console.log(`🌐 External: http://expertlive.pro-ace-predictions.co.uk:${PORT}`);
    console.log(`🔑 Admin: admin/admin123`);
    
    // Server will be started by the imported module
  })
  .catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });