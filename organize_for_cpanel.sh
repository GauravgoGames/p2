#!/bin/bash

# Organize for cPanel Script
# This script prepares the improved website for cPanel deployment

echo "=== Starting cPanel Preparation Process ==="

# Define repository path
REPO_PATH="p2"
CPANEL_PACKAGE="p2_cpanel"

# Check if repository exists
if [ ! -d "$REPO_PATH" ]; then
  echo "Error: Repository directory not found. Please run the clone_repo.sh script first."
  exit 1
fi

# Create a directory for the cPanel package
echo "Creating cPanel package directory..."
if [ -d "$CPANEL_PACKAGE" ]; then
  rm -rf "$CPANEL_PACKAGE"
fi
mkdir -p "$CPANEL_PACKAGE"

# Copy the improved website to the cPanel package directory
echo "Copying improved website to cPanel package..."
cp -R "$REPO_PATH"/* "$CPANEL_PACKAGE/"
cp -R "$REPO_PATH"/.htaccess "$CPANEL_PACKAGE/" 2>/dev/null || :

# Clean up unnecessary files
echo "Cleaning up unnecessary files..."
rm -rf "$CPANEL_PACKAGE/.git" 2>/dev/null || :
rm -f "$CPANEL_PACKAGE/.gitignore" 2>/dev/null || :
rm -f "$CPANEL_PACKAGE/README.md" 2>/dev/null || :
rm -f "$CPANEL_PACKAGE/package-lock.json" 2>/dev/null || :

# Check for important files
echo "Verifying important files..."
if [ ! -f "$CPANEL_PACKAGE/index.html" ]; then
  echo "Warning: No index.html file found. Your website may not display correctly."
fi

if [ ! -f "$CPANEL_PACKAGE/.htaccess" ]; then
  echo "Warning: No .htaccess file found. Adding a basic one..."
  cat > "$CPANEL_PACKAGE/.htaccess" << EOL
# Basic .htaccess file for cPanel hosting
AddDefaultCharset UTF-8

# Enable URL rewriting
RewriteEngine On

# Set default index files
DirectoryIndex index.html index.htm index.php

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/x-javascript application/json
</IfModule>

# Disable directory browsing
Options -Indexes
EOL
fi

# Create a deployment package (zip file)
echo "Creating deployment package..."
cd "$CPANEL_PACKAGE"
zip -r "../$CPANEL_PACKAGE.zip" .
cd ..

echo "Counting files in the deployment package..."
find "$CPANEL_PACKAGE" -type f | wc -l

echo "Deployment package created: $CPANEL_PACKAGE.zip"
echo "Deployment package size: $(du -h "$CPANEL_PACKAGE.zip" | cut -f1)"

echo "=== cPanel Preparation Complete ==="
echo "Your website is now ready for cPanel deployment."
echo "Please refer to the cpanel_deployment_guide.md file for deployment instructions."
