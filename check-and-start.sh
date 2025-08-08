#!/bin/bash

# Check if the server is running and start it
echo "🔍 Checking server status..."

# Check if the background process is running
if pgrep -f "start-server.js" > /dev/null; then
    echo "✅ Server is already running"
    ps aux | grep start-server.js | grep -v grep
    echo ""
    echo "📊 Server logs (last 10 lines):"
    tail -10 server.log 2>/dev/null || echo "No logs found yet"
else
    echo "❌ Server is not running. Starting it now..."
    nohup node start-server.js > server.log 2>&1 &
    sleep 3
    
    if pgrep -f "start-server.js" > /dev/null; then
        echo "✅ Server started successfully!"
        echo "🔧 Process ID: $(pgrep -f start-server.js)"
        echo "📋 Server should be accessible at: http://expertlive.pro-ace-predictions.co.uk:5000"
    else
        echo "❌ Failed to start server. Checking logs..."
        tail -20 server.log 2>/dev/null || echo "No log file found"
    fi
fi

echo ""
echo "📋 Next steps:"
echo "1. Test the server: curl http://localhost:5000/api/health"
echo "2. View logs: tail -f server.log"
echo "3. Stop server: pkill -f start-server.js"
echo "4. Check if port 5000 is accessible externally"
echo ""
echo "🌐 If you can't access the site externally, contact your hosting provider to:"
echo "   - Open port 5000 in firewall"
echo "   - Set up reverse proxy from port 80/443 to port 5000"
echo "   - Configure domain to proxy to localhost:5000"