
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting ProAce Predictions...');

// Load environment variables
dotenv.config();

// Set default port
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = 'production';

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
