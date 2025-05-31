#!/bin/bash

# cPanel Deployment Script for ProAce Predictions
# Run this script on your cPanel server via SSH

echo "Starting cPanel deployment for ProAce Predictions..."

# Configuration - Update these paths for your cPanel setup
DOMAIN_PATH="/home/your-username/public_html/predictions"  # Update this path
BACKUP_PATH="/home/your-username/backups"
DATABASE_NAME="your_database_name"  # Update this
PM2_APP_NAME="proace-predictions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating backup...${NC}"
mkdir -p $BACKUP_PATH
cp -r $DOMAIN_PATH $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)

echo -e "${YELLOW}Step 2: Navigating to project directory...${NC}"
cd $DOMAIN_PATH

echo -e "${YELLOW}Step 3: Stopping PM2 processes...${NC}"
pm2 stop $PM2_APP_NAME || echo "PM2 app not running"

echo -e "${YELLOW}Step 4: Pulling latest changes from GitHub...${NC}"
git pull origin main

echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 6: Building the application...${NC}"
npm run build

echo -e "${YELLOW}Step 7: Running database migrations (if needed)...${NC}"
npm run db:push

echo -e "${YELLOW}Step 8: Starting PM2 application...${NC}"
pm2 start ecosystem.config.js || pm2 start npm --name "$PM2_APP_NAME" -- start

echo -e "${YELLOW}Step 9: Saving PM2 configuration...${NC}"
pm2 save
pm2 startup

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}Your website should now be live with the latest updates${NC}"

echo -e "${YELLOW}Checking application status...${NC}"
pm2 status

echo -e "${YELLOW}Recent logs:${NC}"
pm2 logs $PM2_APP_NAME --lines 10