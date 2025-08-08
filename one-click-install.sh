#!/bin/bash

echo "=== CricProAce One-Click Installer ==="
echo ""

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Set up environment
echo "1. Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "   Created .env file - Please edit with your database credentials"
else
    echo "   .env file already exists"
fi

# Install dependencies
echo "2. Installing dependencies..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm install --production

# Install dev dependencies for build
echo "3. Installing build tools..."
npm install --save-dev vite esbuild @vitejs/plugin-react

# Build the application
echo "4. Building application..."
npm run build || {
    echo "   Build failed, trying alternative method..."
    npx vite build --emptyOutDir
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18
}

# Set permissions
echo "5. Setting permissions..."
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 600 .env
chmod 755 one-click-install.sh

# Create required directories
echo "6. Creating required directories..."
mkdir -p public/uploads/users
mkdir -p public/uploads/teams
mkdir -p public/uploads/tournaments
mkdir -p public/uploads/site

echo ""
echo "=== Installation Complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Configure Node.js app in cPanel:"
echo "   - Application startup file: dist/index.js"
echo "   - Node.js version: 18.x or higher"
echo "3. Save and restart the application"
echo ""
echo "Default admin login: admin / admin123"