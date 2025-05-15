
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

console.log('Starting ProAce Predictions...');

// Load environment variables from .env file
dotenv.config();

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';
process.env.HOST = '0.0.0.0';

// Start the server process
const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle process termination
const cleanup = () => {
  console.log('Shutting down...');
  server.kill();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
