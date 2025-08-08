# CPanel Build Error Fix Guide

## Problem
The Vite build is failing in cPanel with the error:
```
EACCES: permission denied, unlink '/home/cricproace/expertlive.pro-ace-predictions.co.uk/node_modules/vite/dist/node/chunks/dep-CHZKKrU.mjs'
```

## Solution

### Method 1: Quick Fix (Recommended)
Run these commands in cPanel terminal:

```bash
# 1. Fix permissions
chmod -R 755 node_modules
rm -rf node_modules/.vite

# 2. Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Build with proper permissions
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Method 2: Alternative Build Process
If Method 1 fails, use this approach:

```bash
# 1. Create a build directory with proper permissions
mkdir -p ~/build-temp
cd ~/build-temp

# 2. Copy project files
cp -r ~/public_html/cricproace/* .

# 3. Build in temp directory
npm install
npm run build

# 4. Copy built files back
cp -r dist/* ~/public_html/cricproace/dist/
cd ~/public_html/cricproace
rm -rf ~/build-temp
```

### Method 3: Manual Build Process
If automated builds continue to fail:

```bash
# 1. Build frontend only
cd ~/public_html/cricproace
npx vite build --emptyOutDir

# 2. Build backend separately
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --target=node18

# 3. Verify build
ls -la dist/
```

## Common Issues and Solutions

### Issue 1: Permission Denied
```bash
# Fix file permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod -R 755 node_modules
```

### Issue 2: Memory Limit
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Issue 3: Module Resolution
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf .parcel-cache
npm cache clean --force
```

## Verified Working Configuration

### package.json build script
```json
"build": "NODE_OPTIONS='--max-old-space-size=4096' vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

### cPanel Node.js App Settings
- Node.js version: 18.x or 20.x
- Application mode: Production
- Application root: /home/username/public_html/cricproace
- Application startup file: dist/index.js
- Entry point: dist/index.js

## Post-Build Checklist
1. ✓ Verify `dist/` directory exists
2. ✓ Check `dist/index.js` is present
3. ✓ Ensure `dist/public/` contains frontend assets
4. ✓ Confirm `.env` file has database credentials
5. ✓ Test application startup in cPanel

## Emergency Fallback
If all else fails, contact your hosting provider to:
1. Increase process limits
2. Grant temporary elevated permissions
3. Install Node.js modules globally