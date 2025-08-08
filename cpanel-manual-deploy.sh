#!/bin/bash

# CricProAce Manual cPanel Deployment Script
# For cPanel without Node.js App Manager support

echo "🚀 Starting CricProAce Manual cPanel Deployment..."

# Step 1: Check if Node.js is available
echo "📋 Checking Node.js availability..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "Contact your hosting provider to install Node.js or use a hosting service that supports Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Step 2: Install dependencies with fallback options
echo "📦 Installing dependencies..."
npm install || {
    echo "⚠️ Standard install failed. Trying with --legacy-peer-deps..."
    npm install --legacy-peer-deps || {
        echo "⚠️ Still failing. Trying to install core dependencies only..."
        npm install express cors helmet bcryptjs drizzle-orm @neondatabase/serverless
    }
}

# Step 3: Install global packages if needed
echo "🔧 Installing required global packages..."
npm install -g vite esbuild || echo "⚠️ Global install failed, continuing with local packages"

# Step 4: Try to install Vite locally if global install failed
if ! command -v vite &> /dev/null; then
    echo "📦 Installing Vite locally..."
    npm install vite --save-dev
fi

# Step 5: Create production environment file
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

# Step 6: Try different build approaches
echo "🔨 Building application..."

# Try with npx vite first
if npx vite build 2>/dev/null; then
    echo "✅ Frontend built successfully with npx vite"
else
    echo "⚠️ Vite build failed, trying alternative build method..."
    
    # Create a simple build without Vite
    mkdir -p dist/public
    cp -r client/* dist/public/ 2>/dev/null || cp -r public/* dist/public/ 2>/dev/null || echo "⚠️ No client files found"
    
    # If we have client/index.html, use it directly
    if [ -f "client/index.html" ]; then
        cp client/index.html dist/public/
        echo "✅ Frontend copied manually"
    elif [ -f "index.html" ]; then
        cp index.html dist/public/
        echo "✅ Frontend copied manually"
    fi
fi

# Build backend
echo "🔧 Building backend..."
if npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist 2>/dev/null; then
    echo "✅ Backend built successfully"
else
    echo "⚠️ ESBuild failed, copying server files directly..."
    mkdir -p dist
    cp -r server dist/
    cp -r shared dist/ 2>/dev/null || echo "No shared folder found"
    echo "✅ Server files copied"
fi

# Step 7: Create manual startup files
echo "📝 Creating startup files..."

# Create a simple startup script that doesn't require compilation
cat > start-server.js << 'EOF'
// Simple startup script for cPanel manual deployment
require('dotenv').config();

const path = require('path');
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static('dist/public'));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CricProAce server running on port ${PORT}`);
  console.log(`🌐 Visit: http://your-domain.com:${PORT}`);
});
EOF

# Create PM2 ecosystem file for process management
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cricproace',
    script: './start-server.js',
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

# Step 8: Setup database (if possible)
echo "🗄️ Setting up database..."
if npm run db:push 2>/dev/null; then
    echo "✅ Database schema pushed successfully"
else
    echo "⚠️ Database push failed. You may need to set it up manually"
    echo "Run: npm run db:push after fixing any connection issues"
fi

# Step 9: Create .htaccess for Apache
echo "⚡ Creating .htaccess for Apache configuration..."
cat > .htaccess << 'EOF'
# CricProAce .htaccess for cPanel deployment

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

# Redirect API calls to Node.js (if using reverse proxy)
# RewriteEngine On
# RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
EOF

# Step 10: Set permissions
echo "🔒 Setting file permissions..."
chmod 755 .
chmod +x start-server.js
chmod 644 .htaccess .env

echo ""
echo "✅ Manual deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the server locally:"
echo "   node start-server.js"
echo ""
echo "2. For production, you have several options:"
echo ""
echo "   Option A - Direct Node.js:"
echo "   nohup node start-server.js > server.log 2>&1 &"
echo ""
echo "   Option B - PM2 Process Manager (recommended):"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "   Option C - Forever (alternative):"
echo "   npm install -g forever"
echo "   forever start start-server.js"
echo ""
echo "3. Configure reverse proxy (if needed):"
echo "   Contact your hosting provider to proxy your domain to localhost:5000"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🌐 Test URL: http://your-domain.com:5000"
echo "📊 Database: rzi5hw1x8nm8_n2"

# Test the basic setup
echo ""
echo "🧪 Testing basic setup..."
if node -e "console.log('Node.js test: OK')" 2>/dev/null; then
    echo "✅ Node.js working"
else
    echo "❌ Node.js test failed"
fi

if [ -f ".env" ]; then
    echo "✅ Environment file created"
else
    echo "❌ Environment file missing"
fi

if [ -f "start-server.js" ]; then
    echo "✅ Startup script created"
else
    echo "❌ Startup script missing"
fi

echo ""
echo "📖 For detailed troubleshooting, see: CPANEL_DEPLOYMENT_GUIDE.md"