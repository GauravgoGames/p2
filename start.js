
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting ProAce Predictions...');

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') });

// Set default port if not specified
process.env.PORT = process.env.PORT || '5000';

// Start the server process
const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
  cwd: __dirname
});

// Handle server events
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.kill('SIGTERM');
});
