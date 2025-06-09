#!/bin/bash

echo "Starting CricProAce deployment on cPanel..."

# Install dependencies
npm install

# Build the application
npm run build

# Create necessary directories
mkdir -p public_html/uploads/teams
mkdir -p public_html/uploads/profiles
mkdir -p public_html/uploads/site
mkdir -p public_html/uploads/tournaments

# Set permissions
chmod 755 public_html/uploads
chmod 755 public_html/uploads/teams
chmod 755 public_html/uploads/profiles
chmod 755 public_html/uploads/site
chmod 755 public_html/uploads/tournaments

# Start the application with PM2
pm2 start dist/index.js --name "proace-predictions"
pm2 save
pm2 startup

echo "Deployment completed successfully!"
echo "Your site should now be live!"
