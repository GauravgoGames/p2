#!/bin/bash

echo "Creating complete P2 repository package with ALL files..."

# Remove any existing package
rm -rf p2-complete-repo
rm -f p2-complete-repo.zip

# Create fresh directory
mkdir -p p2-complete-repo

# Copy ALL core application files
echo "Copying core application files..."
cp -r client p2-complete-repo/
cp -r server p2-complete-repo/
cp -r shared p2-complete-repo/
cp -r public p2-complete-repo/

# Copy all configuration files
echo "Copying configuration files..."
cp package.json p2-complete-repo/
cp package-lock.json p2-complete-repo/
cp tsconfig.json p2-complete-repo/
cp vite.config.ts p2-complete-repo/
cp tailwind.config.ts p2-complete-repo/
cp postcss.config.js p2-complete-repo/
cp components.json p2-complete-repo/
cp drizzle.config.ts p2-complete-repo/

# Copy all documentation and deployment files
echo "Copying documentation and deployment files..."
cp DEPLOYMENT.md p2-complete-repo/ 2>/dev/null || true
cp DEPLOYMENT_GUIDE.md p2-complete-repo/ 2>/dev/null || true

# Copy all shell scripts and utilities
echo "Copying scripts and utilities..."
cp *.sh p2-complete-repo/ 2>/dev/null || true
cp *.js p2-complete-repo/ 2>/dev/null || true

# Copy deployment packages (but not the zip files)
echo "Copying deployment packages..."
cp -r cpanel-package p2-complete-repo/ 2>/dev/null || true
cp -r deployment p2-complete-repo/ 2>/dev/null || true
cp -r deployment-package p2-complete-repo/ 2>/dev/null || true
cp -r enhanced-package p2-complete-repo/ 2>/dev/null || true
cp -r fresh_cpanel_package p2-complete-repo/ 2>/dev/null || true

# Copy database and other configuration files
echo "Copying database files..."
cp db_schema.sql p2-complete-repo/ 2>/dev/null || true
cp *.md p2-complete-repo/ 2>/dev/null || true

# Create environment template
echo "Creating environment template..."
cat > p2-complete-repo/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# Security
SESSION_SECRET=your_secure_session_secret_here

# Server Configuration
PORT=5000
NODE_ENV=production
EOF

# Create comprehensive .gitignore
cat > p2-complete-repo/.gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# PM2
.pm2

# Uploads (but keep directory structure)
public/uploads/*
!public/uploads/.gitkeep

# Backup files
backup-*
*.backup

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF

# Create README for the complete repo
cat > p2-complete-repo/README.md << 'EOF'
# P2 - ProAce Predictions Platform

Complete cricket prediction platform with advanced tournament management and user analytics.

## Latest Updates
- Mobile-responsive navigation with complete menu items
- Performance charts optimized for mobile devices  
- Header navigation with MainSite integration
- Footer enhanced with external links
- Tournament interface improvements
- Complete mobile/tablet responsiveness

## Quick Start

### Local Development
```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:push
npm run dev
```

### Production Deployment (cPanel)
```bash
npm install
npm run build
npm run db:push
pm2 start dist/index.js --name proace-predictions
```

## Project Structure
- `client/` - React frontend application
- `server/` - Node.js backend API
- `shared/` - Shared types and database schemas
- `public/` - Static assets and file uploads
- Various deployment packages for different hosting scenarios

## Features
- User authentication and profile management
- Cricket match predictions with points system
- Tournament management and analysis
- Real-time leaderboards with interactive charts
- Admin dashboard for comprehensive management
- Mobile-responsive design for all devices
- File upload system for logos and profiles

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Passport.js
- Database: PostgreSQL with Drizzle ORM
- Charts: Recharts for data visualization
- Process Management: PM2 for production

## Deployment Packages
The repository includes multiple deployment configurations:
- `cpanel-package/` - cPanel-specific deployment
- `deployment/` - General deployment scripts
- `enhanced-package/` - Enhanced features package
- `fresh_cpanel_package/` - Latest cPanel deployment

Choose the appropriate package based on your hosting environment.
EOF

# Copy the .env file as example
cp .env p2-complete-repo/.env.example 2>/dev/null || true

# Exclude certain files/folders from the final package
echo "Creating zip file (excluding development files)..."
cd p2-complete-repo

# Create the zip excluding unnecessary files
zip -r ../p2-complete-repo.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.log" \
  -x "dist/*" \
  -x "build/*" \
  -x "attached_assets/*" \
  -x "github-upload/*" \
  -x "complete-github-package/*" \
  -x "*.zip"

cd ..

echo ""
echo "✅ Complete P2 repository package created!"
echo ""
echo "📦 Package includes:"
echo "   ✓ Complete React frontend with mobile improvements"
echo "   ✓ Full Node.js backend with all APIs"
echo "   ✓ Database schemas and configurations"
echo "   ✓ All deployment packages and scripts"
echo "   ✓ Documentation and setup guides"
echo "   ✓ Environment templates"
echo "   ✓ Git configuration"
echo ""
echo "📁 Directory: p2-complete-repo/"
echo "📁 Zip file: p2-complete-repo.zip"
echo ""
echo "🚀 This is the complete P2 repository ready for GitHub!"
echo "   Upload this to replace your existing P2 repository"
echo ""

# Show size comparison
if [ -f "complete-github-package.zip" ]; then
    echo "📊 Size comparison:"
    echo "   Previous package: $(du -sh complete-github-package.zip | cut -f1)"
    echo "   Complete P2 repo: $(du -sh p2-complete-repo.zip | cut -f1)"
    echo ""
fi

echo "🎯 This package contains ALL original P2 files plus our improvements!"