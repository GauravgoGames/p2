#!/bin/bash

# CricProAce cPanel Deployment Script
# This script automates the deployment process for cPanel

echo "========================================="
echo "CricProAce Deployment Script for cPanel"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Step 1: Build the application
echo ""
echo "Step 1: Building the application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed. Please check the error messages above."
    exit 1
fi

# Step 2: Create production environment file if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo ""
    echo "Step 2: Creating .env.example file..."
    cat > .env.example << EOF
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGDATABASE=database_name
PGUSER=username
PGPASSWORD=password

# Application Settings
NODE_ENV=production
SESSION_SECRET=your-random-session-secret-here
PORT=5000

# Optional: External Services (add as needed)
# OPENAI_API_KEY=your-api-key-here
# STRIPE_SECRET_KEY=your-stripe-key-here
EOF
    print_status ".env.example created"
else
    print_status ".env.example already exists"
fi

# Step 3: Create .htaccess file for Apache
echo ""
echo "Step 3: Creating .htaccess file..."
cat > .htaccess << EOF
DirectoryIndex disabled
RewriteEngine On

# Handle Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:\${NODE_PORT}/$1 [P,L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent access to sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

<Files ~ "(\.env|\.git|\.gitignore|package-lock\.json)$">
    Order allow,deny
    Deny from all
</Files>
EOF
print_status ".htaccess created"

# Step 4: Create deployment information file
echo ""
echo "Step 4: Creating deployment info..."
cat > DEPLOYMENT.md << EOF
# CricProAce Deployment Information

## Version Information
- Deployment Date: $(date)
- Node.js Version Required: 18.x or higher
- Database: PostgreSQL

## Features Included in This Release
- User authentication with secure password reset
- Tournament and match management
- Real-time prediction system with percentage bar graphs
- Social engagement features (Love/View counts)
- Comprehensive leaderboard with 3-tier ranking
- WordPress integration support
- Admin panel with verification system
- Support ticket system
- Security features (rate limiting, CSRF protection, input validation)
- Embeddable widgets for external sites

## Default Admin Credentials
- Username: admin
- Password: admin123

**IMPORTANT**: Change these credentials immediately after deployment!

## Post-Deployment Checklist
- [ ] Change admin password
- [ ] Configure environment variables in cPanel
- [ ] Set up SSL certificate
- [ ] Test all major features
- [ ] Configure automated backups
- [ ] Review security settings

## Database Schema
The application will automatically create all required tables on first run.
No manual SQL execution is needed.
EOF
print_status "Deployment information created"

# Step 5: Prepare files for deployment
echo ""
echo "Step 5: Cleaning up unnecessary files..."

# Create a deployment directory
mkdir -p deploy-ready

# Copy necessary files
cp -r dist deploy-ready/
cp -r public deploy-ready/
cp package.json deploy-ready/
cp package-lock.json deploy-ready/
cp .env.example deploy-ready/
cp .htaccess deploy-ready/
cp DEPLOYMENT.md deploy-ready/
cp DEPLOYMENT_GUIDE.md deploy-ready/
cp README.md deploy-ready/
cp SECURITY.md deploy-ready/
cp WORDPRESS_INTEGRATION.md deploy-ready/

print_status "Files prepared for deployment"

# Step 6: Create deployment archive
echo ""
echo "Step 6: Creating deployment archive..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="cricproace_deploy_${TIMESTAMP}.zip"

cd deploy-ready
zip -r "../${ARCHIVE_NAME}" .
cd ..

if [ -f "${ARCHIVE_NAME}" ]; then
    print_status "Deployment archive created: ${ARCHIVE_NAME}"
    echo ""
    echo "Archive contains:"
    unzip -l "${ARCHIVE_NAME}" | head -20
    echo "..."
else
    print_error "Failed to create deployment archive"
    exit 1
fi

# Clean up temporary directory
rm -rf deploy-ready

echo ""
echo "========================================="
echo "Deployment preparation complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Upload ${ARCHIVE_NAME} to your cPanel"
echo "2. Extract it in your desired directory"
echo "3. Follow the instructions in DEPLOYMENT_GUIDE.md"
echo ""
print_warning "Remember to backup your existing installation before deploying!"