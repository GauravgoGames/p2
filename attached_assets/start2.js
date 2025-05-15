// Simple startup script for cPanel
const { spawn } = require('child_process');
console.log("Starting ProAce Predictions...");

// Load environment variables from .env file
require('dotenv').config();

// Set the PORT environment variable if not already set
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

// Start the server
const server = spawn('node', ['server/index.js'], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});