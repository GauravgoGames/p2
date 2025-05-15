
// Server startup script
import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('Starting ProAce Predictions...');

// Load environment variables from .env file
config();

// Set the PORT environment variable if not already set
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

const server = spawn('node', ['dist/server/index.js'], {
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
