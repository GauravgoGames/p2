#!/bin/bash

echo "=== Building ProAce Predictions for cPanel Deployment ==="

# Create a directory for the deployment package
mkdir -p deployment-package

# Build the React client
echo "Building React client..."
npm run build

# Check if build was successful
if [ ! -d "dist/public" ]; then
  echo "Error: Build failed. Client files not found."
  exit 1
fi

echo "Copying files to deployment package..."
# Copy server files
cp -r dist deployment-package/
cp -r public deployment-package/
cp -r server deployment-package/
cp -r shared deployment-package/

# Copy configuration files
cp package.json deployment-package/
cp drizzle.config.ts deployment-package/
cp push-schema.js deployment-package/
cp db_schema.sql deployment-package/

# Copy deployment scripts
cp cpanel-complete-setup.sh deployment-package/
cp -r node_modules/.bin deployment-package/node_modules/ 2>/dev/null || mkdir -p deployment-package/node_modules/.bin

# Create PM2 config
cat > deployment-package/pm2.config.js << 'EOF'
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

# Create .htaccess file
cat > deployment-package/.htaccess << 'EOF'
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

# Create simplified start script
cat > deployment-package/start.js << 'EOF'
// Simple startup script
const { spawn } = require('child_process');
console.log("Starting ProAce Predictions...");

const server = spawn('node', ['dist/index.js'], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
EOF

# Create sample .env file (to be modified on server)
cat > deployment-package/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgres://your_username:your_password@localhost:5432/your_database

# Security
SESSION_SECRET=change_this_to_a_secure_random_string

# Server Configuration
PORT=5000
NODE_ENV=production
EOF

# Create a README with installation instructions
cat > deployment-package/README.md << 'EOF'
# ProAce Predictions - cPanel Installation

## Quick Installation

1. Upload all files to your cPanel account
2. Set up PostgreSQL database through cPanel
3. Copy `.env.example` to `.env` and update database connection details:
   ```
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/your_database
   ```
4. Run the setup script:
   ```
   chmod +x cpanel-complete-setup.sh
   ./cpanel-complete-setup.sh
   ```

## Checking Installation

1. Visit your domain in a browser
2. Check PM2 logs if there are any issues:
   ```
   pm2 logs proace-predictions
   ```

## Default Admin Login

Username: admin
Password: admin123

**Change the default password immediately after login!**
EOF

# Create an installation script
cat > deployment-package/install.sh << 'EOF'
#!/bin/bash

echo "=== Installing ProAce Predictions on cPanel ==="

# Install production dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Ensure correct permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 755 *.sh
chmod -R 755 public/uploads

echo "Installation complete!"
echo "Please edit your .env file with proper database credentials before running cpanel-complete-setup.sh"
EOF

# Make scripts executable
chmod +x deployment-package/*.sh

# Create zip archive
echo "Creating deployment zip archive..."
cd deployment-package
zip -r ../proace_predictions_cpanel_package.zip .
cd ..

echo "=== Build Complete ==="
echo "Deployment package created: proace_predictions_cpanel_package.zip"
echo "Upload this package to your cPanel hosting, extract it,"
echo "and follow the instructions in README.md to complete installation."