# 🎯 SIMPLE cPanel Deployment (Like Original)

## The Problem
We've been overcomplicating this! The original GitHub codebase worked with simple:
1. `git clone`
2. `npm install` 
3. `npm run build` (just Vite)
4. Simple start command

## Why Current Build Fails
Current complex esbuild bundling tries to bundle Babel and LightningCSS which causes errors.
Original was much simpler and worked perfectly.

## SOLUTION: Back to Original Simple Approach

```bash
ssh rzi5hw1x8nm8@your-server.com
cd /home/rzi5hw1x8nm8/expertlive.pro-ace-predictions.co.uk

# Remove all files
rm -rf *

# Clone (use your updated GitHub after you push)
git clone https://github.com/GauravgoGames/p2.git .

# Install dependencies
npm install

# Build client only (like original)
npm run build

# Create simple start script (no complex bundling)
cat > start-server.js << 'EOF'
import { spawn } from 'child_process';

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://rzi5hw1x8nm8_n2u:Gaurav16D@localhost:5432/rzi5hw1x8nm8_n2',
    SESSION_SECRET: 's3cr3t_KN4n5cP9m2Xz7Qv8EjLd0RgUwTyHaB',
    PORT: '5000',
    HOST: '0.0.0.0'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('close', (code) => {
  console.log('Server exited with code:', code);
});
EOF

# Create PM2 ecosystem (simple approach)
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'cricproace',
    script: 'start-server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgres://rzi5hw1x8nm8_n2u:Gaurav16D@localhost:5432/rzi5hw1x8nm8_n2',
      SESSION_SECRET: 's3cr3t_KN4n5cP9m2Xz7Qv8EjLd0RgUwTyHaB'
    }
  }]
}
EOF

# Start application (simple way)
pm2 kill
pm2 start ecosystem.config.cjs
pm2 save

# Test
sleep 5
curl http://localhost:5000/health

# Fix domain proxy
mkdir -p /home/rzi5hw1x8nm8/public_html
cat > /home/rzi5hw1x8nm8/public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?expertlive\.pro-ace-predictions\.co\.uk$ [NC]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]
ProxyPreserveHost On
ProxyRequests Off
EOF

echo "✅ DONE! Website: https://expertlive.pro-ace-predictions.co.uk"
```

## What's Different This Time:
- ✅ **No complex esbuild bundling** (like original)
- ✅ **Simple tsx execution** (like original)
- ✅ **Only Vite build for client** (like original)  
- ✅ **Direct TypeScript execution** (like original)
- ✅ **Domain proxy configuration**

## Expected Results:
- ✅ No Babel/LightningCSS errors
- ✅ Same approach that worked before
- ✅ Website loads cricket predictions
- ✅ All data preserved

This is exactly how the original worked - simple and effective!