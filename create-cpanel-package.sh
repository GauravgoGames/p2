#!/bin/bash

echo "=== Creating cPanel Deployment Package ==="

# Create a directory for the deployment package
rm -rf cpanel-package
mkdir -p cpanel-package/public/uploads
mkdir -p cpanel-package/dist/public/assets
mkdir -p cpanel-package/logs

# Copy essential files
echo "Copying essential files..."
cp -r server cpanel-package/
cp -r shared cpanel-package/
cp package.json cpanel-package/
cp drizzle.config.ts cpanel-package/
cp push-schema.js cpanel-package/
cp db_schema.sql cpanel-package/

# Create client index.html
cat > cpanel-package/dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProAce Cricket Predictions</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .nav-item { transition: all 0.2s; }
    .nav-item:hover { background-color: rgba(255,255,255,0.1); }
    .btn-primary { background-color: #4f46e5; transition: all 0.2s; }
    .btn-primary:hover { background-color: #4338ca; }
  </style>
</head>
<body class="bg-gray-50">
  <div id="root">
    <!-- This will be replaced by the React app when it loads -->
    <header class="bg-gray-800 text-white">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center">
          <h1 class="text-xl font-bold">ProAce Cricket Predictions</h1>
        </div>
        <div class="hidden md:flex space-x-1">
          <a href="/" class="nav-item px-3 py-2 rounded">Home</a>
          <a href="/predictions" class="nav-item px-3 py-2 rounded">Predictions</a>
          <a href="/leaderboard" class="nav-item px-3 py-2 rounded">Leaderboard</a>
          <a href="/login" class="nav-item px-3 py-2 rounded">Login</a>
        </div>
      </nav>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">Welcome to ProAce Cricket Predictions</h2>
          <p class="mb-2">Your platform for cricket match predictions and competitions.</p>
          <p class="mb-4">Predict match outcomes, earn points, and compete with other cricket fans!</p>
          <div id="api-status" class="mb-4">Checking API connection...</div>
          <a href="/login" class="btn-primary text-white px-4 py-2 rounded inline-block">Login / Register</a>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">Leaderboard</h2>
          <div id="leaderboard">Loading leaderboard data...</div>
        </div>
      </div>
      
      <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-4">Upcoming Matches</h2>
        <div id="matches">Loading match data...</div>
      </div>
    </main>
    
    <footer class="bg-gray-800 text-white py-6 mt-12">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2025 ProAce Predictions</p>
      </div>
    </footer>
  </div>

  <script>
    // Check API connection
    fetch('/api/settings/siteLogo')
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('API connection failed');
      })
      .then(data => {
        document.getElementById('api-status').innerHTML = 
          '<p class="text-green-500">✓ API Connected</p>';
      })
      .catch(error => {
        document.getElementById('api-status').innerHTML = 
          '<p class="text-red-500">✗ API Error: ' + error.message + '</p>';
      });
    
    // Load leaderboard
    fetch('/api/leaderboard')
      .then(response => response.json())
      .then(data => {
        let html = '<div class="overflow-x-auto"><table class="min-w-full table-auto border-collapse">';
        html += '<thead class="bg-gray-100"><tr><th class="px-4 py-2 text-left">Rank</th><th class="px-4 py-2 text-left">User</th><th class="px-4 py-2 text-left">Points</th></tr></thead><tbody>';
        
        data.forEach((user, index) => {
          html += `<tr class="${index % 2 === 0 ? 'bg-gray-50' : ''}">
            <td class="px-4 py-2 border-t">${index + 1}</td>
            <td class="px-4 py-2 border-t">${user.displayName || user.username}</td>
            <td class="px-4 py-2 border-t">${user.points}</td>
          </tr>`;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('leaderboard').innerHTML = html;
      })
      .catch(error => {
        document.getElementById('leaderboard').innerHTML = 
          '<p class="text-red-500">Failed to load leaderboard: ' + error.message + '</p>';
      });
    
    // Load matches
    fetch('/api/matches')
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          document.getElementById('matches').innerHTML = '<p class="text-gray-500">No upcoming matches scheduled.</p>';
          return;
        }
        
        let html = '<div class="overflow-x-auto"><table class="min-w-full table-auto border-collapse">';
        html += '<thead class="bg-gray-100"><tr><th class="px-4 py-2 text-left">Date</th><th class="px-4 py-2 text-left">Teams</th><th class="px-4 py-2 text-left">Venue</th><th class="px-4 py-2 text-left">Action</th></tr></thead><tbody>';
        
        data.forEach((match, index) => {
          const date = new Date(match.date).toLocaleDateString();
          html += `<tr class="${index % 2 === 0 ? 'bg-gray-50' : ''}">
            <td class="px-4 py-2 border-t">${date}</td>
            <td class="px-4 py-2 border-t">${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}</td>
            <td class="px-4 py-2 border-t">${match.venue || 'TBD'}</td>
            <td class="px-4 py-2 border-t"><a href="/predict/${match.id}" class="btn-primary text-white px-3 py-1 rounded text-sm inline-block">Predict</a></td>
          </tr>`;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('matches').innerHTML = html;
      })
      .catch(error => {
        document.getElementById('matches').innerHTML = 
          '<p class="text-red-500">Failed to load matches: ' + error.message + '</p>';
      });
  </script>
</body>
</html>
EOF

# Create PM2 config
cat > cpanel-package/pm2.config.js << 'EOF'
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
cat > cpanel-package/.htaccess << 'EOF'
# Enable Rewrite Engine
RewriteEngine On
RewriteBase /

# Serve static assets directly
RewriteRule ^assets/(.*)$ dist/public/assets/$1 [L]
RewriteRule ^uploads/(.*)$ public/uploads/$1 [L]

# API requests - proxy to Node.js server
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# For all other paths, serve the index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ dist/public/index.html [L]
EOF

# Create .env example file
cat > cpanel-package/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgres://your_username:your_password@localhost:5432/your_database

# Security
SESSION_SECRET=change_this_to_a_secure_random_string

# Server Configuration
PORT=5000
NODE_ENV=production
EOF

# Create server build script
cat > cpanel-package/build-server.sh << 'EOF'
#!/bin/bash

echo "=== Building Server ====="
npm install -g esbuild
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "=== Server Build Complete ==="
EOF

# Create setup script
cat > cpanel-package/cpanel-setup.sh << 'EOF'
#!/bin/bash

echo "=== Setting Up ProAce Predictions on cPanel ==="

# Create necessary directories if they don't exist
mkdir -p public/uploads
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file. Please update it with your database credentials."
  cp .env.example .env
fi

# Ensure correct permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 755 *.sh
chmod -R 755 public/uploads

# Try to build the server
echo "Building server..."
./build-server.sh

# Start the application using PM2
export HOME="$(cd ~ && pwd)"
export PORT=5000

echo "Starting ProAce Predictions with PM2..."
npm install -g pm2
pm2 start pm2.config.js

echo "=== Setup Complete ==="
echo "Visit your website at: https://expertlive.pro-ace-predictions.co.uk/"
echo "Check PM2 logs with: pm2 logs proace-predictions"
EOF

# Create installation script
cat > cpanel-package/install.sh << 'EOF'
#!/bin/bash

echo "=== Installing ProAce Predictions on cPanel ==="

# Install production dependencies
npm install --production

echo "Installation complete!"
echo "Please edit your .env file with proper database credentials before running cpanel-setup.sh"
EOF

# Make scripts executable
chmod +x cpanel-package/*.sh

# Create zip archive
echo "Creating deployment zip archive..."
cd cpanel-package
zip -r ../proace_predictions_cpanel_package.zip .
cd ..

echo "=== Package Creation Complete ==="
echo "Deployment package created: proace_predictions_cpanel_package.zip"
echo "Upload this package to your cPanel hosting, extract it,"
echo "and follow these steps for installation:"
echo "1. Edit .env.example and save as .env with your database credentials"
echo "2. Run: chmod +x install.sh cpanel-setup.sh"
echo "3. Run: ./install.sh"
echo "4. Run: ./cpanel-setup.sh"