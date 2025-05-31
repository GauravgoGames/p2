#!/bin/bash

echo "=== Installing ProAce Predictions on cPanel ==="

# Install production dependencies
npm install --production

echo "Installation complete!"
echo "Please edit your .env file with proper database credentials before running cpanel-setup.sh"
