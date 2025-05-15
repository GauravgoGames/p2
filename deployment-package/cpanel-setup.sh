#!/bin/bash
# Setup script for ProAce Predictions on cPanel

echo "======================================"
echo "ProAce Predictions - cPanel Setup Tool"
echo "======================================"
echo ""

# Variables - Edit these to match your environment
APP_PATH="$PWD"
DB_NAME="rzi5hw1x8nm8_n2"
DB_USER="rzi5hw1x8nm8_n2u"
DB_PASS="Gaurav16D"
DB_HOST="localhost"
DB_PORT="5432"
SESSION_SECRET=$(openssl rand -hex 32)

echo "Step 1: Setting up environment..."
# Create .env file
cat > "$APP_PATH/.env" << EOF
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
PORT=3000
NODE_ENV=production
EOF

echo "Step 2: Setting file permissions..."
# Set permissions
chmod -R 755 "$APP_PATH"
chmod -R 755 "$APP_PATH/public/uploads"
chmod 644 "$APP_PATH/.env"
chmod 644 "$APP_PATH/.htaccess"

echo "Step 3: Creating Apache configuration..."
# Create .htaccess file
cat > "$APP_PATH/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
EOF

echo "Step 4: Installing Node.js dependencies..."
# Install dependencies
cd "$APP_PATH"
npm install --production

echo "Step 5: Setting up process management..."
# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Stop any existing instances
pm2 stop proace-predictions 2>/dev/null
pm2 delete proace-predictions 2>/dev/null

# Start the application
pm2 start start.js --name proace-predictions

# Configure PM2 to start on server reboot
PM2_STARTUP=$(pm2 startup | grep -o "sudo .*")
echo "To enable startup on boot, run this command:"
echo "$PM2_STARTUP"
pm2 save

echo ""
echo "Setup completed!"
echo "Your ProAce Predictions platform should now be accessible at:"
echo "https://expertlive.pro-ace-predictions.co.uk/"
echo ""
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "IMPORTANT: Change the default password immediately after logging in!"
echo "======================================"