#!/bin/bash

# Create GitHub deployment package
echo "Creating GitHub deployment package..."

# Create a clean directory for GitHub upload
mkdir -p github-upload
rm -rf github-upload/*

# Copy all necessary files
cp -r client github-upload/
cp -r server github-upload/
cp -r shared github-upload/
cp -r public github-upload/

# Copy configuration files
cp package.json github-upload/
cp package-lock.json github-upload/
cp tsconfig.json github-upload/
cp vite.config.ts github-upload/
cp tailwind.config.ts github-upload/
cp postcss.config.js github-upload/
cp drizzle.config.ts github-upload/
cp components.json github-upload/

# Copy environment template
cp .env github-upload/.env.example

# Copy deployment files
cp DEPLOYMENT_GUIDE.md github-upload/
cp update-site.sh github-upload/

# Create README for GitHub
cat > github-upload/README.md << 'EOF'
# ProAce Predictions - Cricket Prediction Platform

A comprehensive sports prediction platform for cricket matches with advanced tournament management and user analytics.

## Recent Updates
- Mobile-responsive navigation with all menu items
- Performance Comparison chart optimized for mobile devices
- Header navigation improvements with MainSite link
- Footer enhanced with Contact Us and Privacy Policy links
- Tournament selector cleanup (removed status indicators)
- Complete mobile/tablet responsiveness improvements

## Features
- User authentication and profiles
- Cricket match predictions (toss and match winner)
- Tournament management and analysis
- Real-time leaderboards with performance charts
- Admin dashboard for match/tournament management
- Responsive design for all device sizes

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js
- Charts: Recharts

## Deployment
See DEPLOYMENT_GUIDE.md for complete setup instructions.

## cPanel Deployment
This project is optimized for cPanel hosting with:
- PM2 process manager
- PostgreSQL database
- File upload handling
- Auto-backup and restore scripts
EOF

echo "GitHub package created in 'github-upload' directory"
echo "Upload these files to your GitHub repository"

# Create a zip for easy download
cd github-upload
zip -r ../github-upload.zip . -x "node_modules/*" ".git/*"
cd ..

echo "Zip file created: github-upload.zip"
echo "You can download this zip and extract it to upload to GitHub"