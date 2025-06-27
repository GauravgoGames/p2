#!/bin/bash

# CPanel Build Fix Script for CricProAce
# This script resolves common build issues in cPanel environments

echo "=== CPanel Build Fix for CricProAce ==="
echo ""

# Step 1: Clean environment
echo "Step 1: Cleaning build environment..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .parcel-cache

# Step 2: Set Node.js environment
echo "Step 2: Setting Node.js environment..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Step 3: Install production dependencies only
echo "Step 3: Installing production dependencies..."
npm install --production --no-optional

# Step 4: Install build dependencies separately
echo "Step 4: Installing build tools..."
npm install --save-dev vite esbuild @vitejs/plugin-react

# Step 5: Create simplified Vite config for production
echo "Step 5: Creating production Vite config..."
cat > vite.config.production.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
  },
  root: path.resolve("./client"),
  build: {
    outDir: path.resolve("./dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
EOF

# Step 6: Build frontend with production config
echo "Step 6: Building frontend..."
npx vite build --config vite.config.production.js

# Step 7: Build backend
echo "Step 7: Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18

# Step 8: Clean up
echo "Step 8: Cleaning up temporary files..."
rm -f vite.config.production.js

echo ""
echo "=== Build completed successfully! ==="
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database credentials"
echo "2. In cPanel Node.js app setup:"
echo "   - Application root: /home/yourusername/public_html/cricproace"
echo "   - Application startup file: dist/index.js"
echo "   - Node.js version: 18.x or higher"
echo "3. Add environment variables from .env"
echo "4. Save and restart the application"