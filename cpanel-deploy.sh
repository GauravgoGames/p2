#!/bin/bash

# CricProAce cPanel Deployment Script
# Run this script on your cPanel server after cloning the repository

echo "🚀 Starting CricProAce cPanel Deployment..."

# Step 1: Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install --production

# Step 2: Create production environment file
echo "⚙️ Creating production environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgres://rzi5hw1x8nm8_n2u:Gaurav16D@localhost:5432/rzi5hw1x8nm8_n2

# Security
SESSION_SECRET=s3cr3t_KN4n5cP9m2Xz7Qv8EjLd0RgUwTyHaB

# Server Configuration
NODE_ENV=production
PORT=5000
EOF

# Step 3: Set proper file permissions
echo "🔒 Setting file permissions..."
chmod -R 755 .
chmod -R 644 *.js *.json *.md *.ts
chmod +x cpanel-deploy.sh

# Step 4: Build the application
echo "🔨 Building application..."
npm run build

# Step 5: Setup database schema
echo "🗄️ Setting up database schema..."
npm run db:push

# Step 6: Create startup script for cPanel
echo "📝 Creating startup script..."
cat > app.js << EOF
// Production startup file for cPanel
require('dotenv').config();
require('./dist/index.js');
EOF

# Step 7: Create .htaccess for static file optimization
echo "⚡ Creating .htaccess for optimization..."
cat > .htaccess << 'EOF'
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access 1 month"
    ExpiresByType image/jpeg "access 1 month"
    ExpiresByType image/gif "access 1 month"
    ExpiresByType image/png "access 1 month"
    ExpiresByType text/css "access 1 month"
    ExpiresByType application/pdf "access 1 month"
    ExpiresByType text/javascript "access 1 month"
    ExpiresByType application/javascript "access 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
EOF

echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next Steps for cPanel:"
echo "1. Go to cPanel → Software → Node.js Apps"
echo "2. Create New App with these settings:"
echo "   - Startup File: app.js"
echo "   - Application Mode: production"
echo "   - Add Environment Variables from .env file"
echo "3. Start the application"
echo "4. Visit your domain to verify deployment"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 Your database: rzi5hw1x8nm8_n2"
echo "🌐 Application will run on port 5000"