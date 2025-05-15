
// Simple startup script
const { spawn } = require('child_process');
console.log("Starting ProAce Predictions...");

// Load environment variables from .env file
require('dotenv').config();

// Set the PORT environment variable if not already set
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server
const server = spawn('node', ['dist/server/index.js'], { 
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
const cleanup = () => {
  console.log('Shutting down...');
  if (server && !server.killed) {
    server.kill();
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
