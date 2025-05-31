#!/bin/bash

echo "=== Setting Up Complete ProAce Predictions App on cPanel ==="

# Create necessary directories
mkdir -p public/uploads
mkdir -p logs

# Create .env file with proper configuration
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgres://rzi5hw1x8nm8_n2u:Gaurav16D@localhost:5432/rzi5hw1x8nm8_n2
# Security
SESSION_SECRET=secure_production_key_for_proace_predictions
# Server Configuration
PORT=5000
NODE_ENV=production
EOF

# Create PM2 config file
cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "proace-predictions",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      max_memory_restart: "200M",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      combine_logs: true,
      error_file: "logs/error.log",
      out_file: "logs/output.log",
      exp_backoff_restart_delay: 100
    }
  ]
};
EOF

# Create .htaccess file for proxying requests to the Node.js server
cat > .htaccess << 'EOF'
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

# Ensure correct permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod -R 755 public/uploads
chmod 755 *.sh
chmod 755 node_modules/.bin/* 2>/dev/null || :

# Start the application using PM2
export HOME="/home/rzi5hw1x8nm8"
export PORT=5000

echo "Starting ProAce Predictions with PM2..."
pm2 start pm2.config.js

echo "=== Setup Complete ==="
echo "Visit your website at: https://expertlive.pro-ace-predictions.co.uk/"
echo "Check PM2 logs with: pm2 logs proace-predictions"