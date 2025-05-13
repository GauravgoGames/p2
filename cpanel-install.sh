
#!/bin/bash
# ProAce Predictions - One-Click GitHub Install Script

echo "===== ProAce Predictions - One-Click GitHub Install ====="
echo "Setting up application..."

# Create required directories
mkdir -p public/uploads/{teams,profiles,site,users}
chmod -R 755 public/uploads

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Setup database config
if [ ! -f ".env" ]; then
  echo "Creating .env configuration..."
  cp .env.example .env
  
  # Generate random session secret
  SESSION_SECRET=$(openssl rand -hex 32)
  sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 process manager..."
  npm install -g pm2
fi

# Setup and start application
echo "Starting application..."
pm2 delete proace-predictions 2>/dev/null || true
pm2 start start.js --name proace-predictions
pm2 save

# Configure startup
echo "Configuring startup..."
pm2 startup | grep -o "sudo .*" > startup_command.txt

echo "===== Installation Complete ====="
echo "Your ProAce Predictions application is ready!"
echo ""
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "IMPORTANT: Please change the admin password after first login!"
