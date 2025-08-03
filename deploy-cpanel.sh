#!/bin/bash
# cPanel Deployment Script

echo "🏏 Deploying Cricket Pro Ace to cPanel..."

# Stop existing processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up environment (you'll need to edit .env with your database credentials)
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env with your database credentials before starting the server"
    exit 1
fi

# Start server with PM2
echo "Starting Cricket Pro Ace server..."
pm2 start npm --name "cricproace" -- run dev
pm2 save

echo "✅ Cricket Pro Ace deployed successfully!"
echo "Check: pm2 status"
echo "Logs: pm2 logs cricproace"

sleep 3
pm2 status
