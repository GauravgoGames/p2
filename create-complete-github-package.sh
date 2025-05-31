#!/bin/bash

echo "Creating complete GitHub package with all essential files..."

# Remove any existing package
rm -rf complete-github-package
rm -f complete-github-package.zip

# Create fresh directory
mkdir -p complete-github-package

# Copy Frontend (React/Client) files
echo "Copying frontend files..."
cp -r client complete-github-package/

# Copy Backend (Server) files
echo "Copying backend files..."
cp -r server complete-github-package/

# Copy Shared files (Database schemas, types)
echo "Copying shared files..."
cp -r shared complete-github-package/

# Copy Public assets (but exclude user uploads for GitHub)
echo "Copying public assets..."
mkdir -p complete-github-package/public
cp -r public/favicon.ico complete-github-package/public/ 2>/dev/null || true
cp -r public/vite.svg complete-github-package/public/ 2>/dev/null || true
# Create empty upload directories structure
mkdir -p complete-github-package/public/uploads/{users,teams,tournaments,profiles,site}

# Copy Configuration files
echo "Copying configuration files..."
cp package.json complete-github-package/
cp package-lock.json complete-github-package/
cp tsconfig.json complete-github-package/
cp vite.config.ts complete-github-package/
cp tailwind.config.ts complete-github-package/
cp postcss.config.js complete-github-package/
cp components.json complete-github-package/

# Copy Database configuration
echo "Copying database files..."
cp drizzle.config.ts complete-github-package/

# Create environment template
echo "Creating environment template..."
cat > complete-github-package/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# Security
SESSION_SECRET=your_secure_session_secret_here

# Server Configuration
PORT=5000
NODE_ENV=production
EOF

# Copy deployment files
echo "Creating deployment scripts..."
cp DEPLOYMENT_GUIDE.md complete-github-package/ 2>/dev/null || echo "DEPLOYMENT_GUIDE.md not found, skipping"
cp cpanel-deploy.sh complete-github-package/ 2>/dev/null || echo "cpanel-deploy.sh not found, skipping"

# Create PM2 ecosystem file
cat > complete-github-package/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'proace-predictions',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Create .htaccess for cPanel
cat > complete-github-package/.htaccess << 'EOF'
# Enable Rewrite Engine
RewriteEngine On
RewriteBase /

# Serve static assets directly
RewriteRule ^assets/(.*)$ dist/public/assets/$1 [L]
RewriteRule ^uploads/(.*)$ public/uploads/$1 [L]

# API requests - proxy to Node.js server
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# For all other paths, serve the React app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ dist/public/index.html [L]
EOF

# Create comprehensive README
cat > complete-github-package/README.md << 'EOF'
# ProAce Predictions - Cricket Prediction Platform

A comprehensive sports prediction platform for cricket matches with advanced tournament management and user analytics.

## 🚀 Recent Updates (Latest Version)
- ✅ **Mobile Navigation**: Complete mobile menu with Tournaments, Tournament Analysis, Update Profile
- ✅ **Responsive Charts**: Performance Comparison graph optimized for mobile devices
- ✅ **Header Improvements**: MainSite link directing to main website
- ✅ **Footer Enhancement**: Contact Us and Privacy Policy external links
- ✅ **Clean UI**: Tournament selector without confusing status indicators
- ✅ **Mobile Responsiveness**: Full tablet and mobile optimization

## 🎯 Features
- User authentication and profile management
- Cricket match predictions (toss and match winner)
- Tournament management and detailed analysis
- Real-time leaderboards with interactive charts
- Admin dashboard for comprehensive management
- Responsive design for all device sizes
- File upload system for team logos, user profiles
- Advanced prediction analytics and user performance tracking

## 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Node.js + Express + Passport.js
- **Database**: PostgreSQL with Drizzle ORM
- **Charts**: Recharts for data visualization
- **File Handling**: Multer for uploads
- **Process Management**: PM2 for production

## 📁 Project Structure
```
├── client/           # React frontend application
├── server/           # Node.js backend API
├── shared/           # Shared types and database schemas
├── public/           # Static assets and uploads
├── ecosystem.config.js  # PM2 configuration
├── .htaccess         # cPanel rewrite rules
└── .env.example      # Environment variables template
```

## 🚀 Quick Start

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy .env.example to .env)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### cPanel Production Deployment
1. Upload files to your cPanel directory
2. Set up .env file with your database credentials
3. Install dependencies: `npm install`
4. Build application: `npm run build`
5. Start with PM2: `pm2 start ecosystem.config.js`

## 📊 Key Components
- **Match Predictions**: Users can predict toss and match winners
- **Tournament Analysis**: Comprehensive user prediction matrices
- **Leaderboard System**: Points-based ranking with performance charts
- **Admin Panel**: Complete management of matches, teams, tournaments
- **Mobile Responsive**: Optimized for all screen sizes

## 🔧 Environment Variables
See `.env.example` for required environment variables including database URL, session secrets, and server configuration.

## 📱 Mobile Features
- Complete navigation menu in mobile view
- Horizontal scrolling charts for better mobile experience
- Touch-friendly interface elements
- Responsive grid layouts for all screen sizes

## 🎨 UI/UX Features
- Clean, modern design with Tailwind CSS
- Interactive charts and data visualizations
- Real-time updates and notifications
- Intuitive admin interface
- Professional tournament management tools

## 📈 Performance
- Optimized for cPanel hosting
- Efficient database queries with Drizzle ORM
- Static asset optimization
- PM2 process management for reliability

---
**Live Site**: [Expert Live Pro Ace Predictions](https://expertlive.pro-ace-predictions.co.uk/)
**Main Website**: [Pro Ace Predictions](https://www.pro-ace-predictions.co.uk/)
EOF

# Create installation guide
cat > complete-github-package/INSTALL.md << 'EOF'
# Installation Guide for cPanel

## Prerequisites
- cPanel hosting with Node.js support
- PostgreSQL database access
- SSH access to your server

## Step-by-Step Installation

### 1. Prepare cPanel Environment
```bash
ssh your-username@your-domain.com
cd /home/your-username/your-domain.com/
```

### 2. Clone or Upload Files
```bash
# If using git
git clone https://github.com/your-username/your-repo.git .

# Or upload and extract the zip file
```

### 3. Configure Environment
```bash
# Create .env file
cp .env.example .env
# Edit .env with your database credentials
nano .env
```

### 4. Install Dependencies
```bash
npm install
# Fix permissions if needed
find node_modules/.bin -type f -exec chmod +x {} \;
```

### 5. Database Setup
```bash
# Push database schema
npm run db:push
```

### 6. Build Application
```bash
npm run build
```

### 7. Start Application
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Or using npm
npm start
```

### 8. Verify Installation
```bash
pm2 status
pm2 logs proace-predictions
```

## Updating Existing Installation
```bash
# Stop application
pm2 stop proace-predictions

# Backup current installation
cp -r . ../backup-$(date +%Y%m%d)

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Update database if needed
npm run db:push

# Restart application
pm2 restart proace-predictions
```

## Troubleshooting
- Check PM2 logs: `pm2 logs proace-predictions`
- Verify Node.js version: `node --version`
- Check database connection in .env file
- Ensure proper file permissions
EOF

echo "Creating zip file..."
cd complete-github-package
zip -r ../complete-github-package.zip . -x "node_modules/*" ".git/*" "*.log"
cd ..

echo ""
echo "✅ Complete GitHub package created successfully!"
echo ""
echo "📦 Package contents:"
echo "   - Frontend (React/TypeScript)"
echo "   - Backend (Node.js/Express)"
echo "   - Database schemas (Drizzle ORM)"
echo "   - Configuration files"
echo "   - Deployment scripts"
echo "   - Documentation"
echo ""
echo "📁 Files ready in: complete-github-package/"
echo "📁 Zip file: complete-github-package.zip"
echo ""
echo "🚀 Ready for GitHub upload and cPanel deployment!"