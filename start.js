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