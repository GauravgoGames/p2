#!/bin/bash

# Clone Repository Script
# This script clones the GauravgoGames/p2 GitHub repository and sets up the project structure

echo "=== Starting Repository Clone Process ==="
echo "Cloning GauravgoGames/p2 repository..."

# Check if the repository directory already exists
if [ -d "p2" ]; then
  echo "Repository directory already exists. Removing it to ensure a clean clone."
  rm -rf p2
fi

# Clone the repository
git clone https://github.com/GauravgoGames/p2.git

# Check if the clone was successful
if [ $? -eq 0 ]; then
  echo "Repository cloned successfully!"
  
  # Navigate into the repository directory
  cd p2
  
  # Display repository information
  echo "=== Repository Information ==="
  echo "Last commit:"
  git log -1 --pretty=format:"%h - %an, %ar : %s"
  
  echo -e "\nRepository structure:"
  find . -type f -name "*.html" -o -name "*.css" -o -name "*.js" | sort
  
  echo -e "\nClone process complete. You can now analyze and improve the website."
  echo "Run 'node ../analyze_website.js' to analyze the website structure."
else
  echo "Error: Failed to clone the repository. Please check the repository URL and your internet connection."
  exit 1
fi
