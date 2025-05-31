#!/bin/bash

echo "=== Setting Up ProAce Predictions on cPanel ==="

# Create necessary directories if they don't exist
mkdir -p public/uploads
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file. Please update it with your database credentials."
  cp .env.example .env
fi

# Ensure correct permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 755 *.sh
chmod -R 755 public/uploads

# Try to build the server
echo "Building server..."
./build-server.sh

# Start the application using PM2
export HOME="$(cd ~ && pwd)"
export PORT=5000

echo "Starting ProAce Predictions with PM2..."
npm install -g pm2
pm2 start pm2.config.js

echo "=== Setup Complete ==="
echo "Visit your website at: https://expertlive.pro-ace-predictions.co.uk/"
echo "Check PM2 logs with: pm2 logs proace-predictions"
