
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

console.log('Starting ProAce Predictions...');

// Load environment variables from .env file
dotenv.config();

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';
process.env.HOST = '0.0.0.0';

// Start the server process
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${process.env.PORT} is already in use. Please free up the port and try again.`);
  } else {
    console.error('Failed to start server:', err);
  }
  process.exit(1);
});

// Handle process termination
const cleanup = () => {
  console.log('Shutting down...');
  if (server && !server.killed) {
    server.kill('SIGKILL');
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
