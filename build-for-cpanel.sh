#!/bin/bash

# CPanel-specific build script for CricProAce
# This script handles common cPanel Node.js environment issues

echo "Starting cPanel build process..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite

# Set Node options to prevent memory issues
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies with specific flags for cPanel
echo "Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Build frontend first with simplified config
echo "Building frontend..."
npx vite build --mode production

# Build backend
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file is configured"
echo "2. Set up the Node.js app in cPanel with:"
echo "   - Application startup file: dist/index.js"
echo "   - Node.js version: 18.x or higher"
echo "3. Click 'Save' and then 'Restart'"