#!/bin/bash

echo "=== Enhancing cPanel Package ==="

# Create a directory for the enhanced package
rm -rf enhanced-package
mkdir -p enhanced-package
cp -r cpanel-package/* enhanced-package/

# Create a proper build script that works in cPanel environment
cat > enhanced-package/build-all.sh << 'EOF'
#!/bin/bash

echo "=== Building ProAce Predictions for cPanel ==="

# Install necessary dependencies
echo "Installing global dependencies..."
npm install -g esbuild typescript

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Build the server
echo "Building server..."
# More resilient server build approach
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
echo "Now you can start the application using: ./start-app.sh"
EOF

# Create improved start app script
cat > enhanced-package/start-app.sh << 'EOF'
#!/bin/bash

echo "=== Starting ProAce Predictions ==="

# Make sure PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Start application with PM2
echo "Starting application with PM2..."
pm2 start pm2.config.js

# Display status
pm2 status

echo "=== Application Started ==="
echo "To check logs: pm2 logs proace-predictions"
EOF

# Create a complete installation guide
cat > enhanced-package/INSTALL.md << 'EOF'
# ProAce Predictions - cPanel Installation Guide

## Step 1: Upload and Extract Files

1. Upload the entire package to your cPanel account using File Manager
2. Extract the files to your desired directory (e.g., `/home/username/expertlive.pro-ace-predictions.co.uk/`)

## Step 2: Set Up Database

1. Log in to cPanel and create a new PostgreSQL database
2. Create a database user and add them to your database with full privileges
3. Import the `db_schema.sql` file into your database using phpPgAdmin

## Step 3: Configure Environment

1. SSH into your server:
   ```
   ssh username@your-domain.com
   ```

2. Navigate to your application directory:
   ```
   cd /home/username/expertlive.pro-ace-predictions.co.uk/
   ```

3. Copy the environment example file and edit it:
   ```
   cp .env.example .env
   nano .env
   ```

4. Update with your database credentials:
   ```
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/your_database
   SESSION_SECRET=your_secure_random_string
   PORT=5000
   NODE_ENV=production
   ```

## Step 4: Build and Start the Application

1. Make scripts executable:
   ```
   chmod +x *.sh
   ```

2. Install dependencies:
   ```
   ./install.sh
   ```

3. Build the server (if needed):
   ```
   ./build-all.sh
   ```

4. Start the application:
   ```
   ./start-app.sh
   ```

## Step 5: Verify Installation

1. Visit your domain in a browser:
   ```
   https://expertlive.pro-ace-predictions.co.uk/
   ```

2. Login with the default admin credentials:
   - Username: `admin`
   - Password: `admin123`

3. Change the default admin password immediately!

## Troubleshooting

If you encounter issues:

1. Check PM2 logs:
   ```
   pm2 logs proace-predictions
   ```

2. Make sure the database connection is correct in your .env file

3. Restart the application:
   ```
   pm2 restart proace-predictions
   ```

4. If necessary, rebuild the server:
   ```
   ./build-all.sh
   ./start-app.sh
   ```

5. Check Apache error logs in cPanel
EOF

# Make scripts executable
chmod +x enhanced-package/*.sh

# Create zip archive
echo "Creating enhanced deployment package..."
cd enhanced-package
zip -r ../proace_predictions_enhanced_package.zip .
cd ..

echo "=== Enhancement Complete ==="
echo "Enhanced deployment package created: proace_predictions_enhanced_package.zip"
echo "This package contains everything needed to run your full application on cPanel"
echo "Please follow the instructions in INSTALL.md after uploading this package"