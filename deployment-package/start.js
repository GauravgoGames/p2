#!/usr/bin/env node
const { spawn } = require('child_process');
console.log('Starting ProAce Predictions...');

// Set default port to 3000 if not specified
process.env.PORT = process.env.PORT || '3000';

const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});