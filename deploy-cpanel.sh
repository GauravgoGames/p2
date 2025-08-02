#!/bin/bash
# cPanel Deployment Script for Cricket Pro Ace

echo "🏏 Deploying Cricket Pro Ace to cPanel..."

# Stop existing processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up environment
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=postgres://rzi5hw1x8nm8_n2u:Gaurav16D@localhost:5432/rzi5hw1x8nm8_n2
SESSION_SECRET=s3cr3t_KN4n5cP9m2Xz7Qv8EjLd0RgUwTyHaB
PORT=5000
NODE_ENV=production
EOF
fi

# Create uploads directory
mkdir -p uploads

# Start server with PM2
echo "Starting Cricket Pro Ace server..."
pm2 start npm --name "cricproace" -- run dev
pm2 save

echo "✅ Cricket Pro Ace deployed successfully!"
echo "Server Status:"
pm2 status

echo ""
echo "Test the deployment:"
echo "curl http://localhost:5000/"