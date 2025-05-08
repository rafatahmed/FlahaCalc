#!/bin/bash

# Check Nginx configuration for API routing
echo "Checking Nginx configuration for API routing..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed"
    exit 1
fi

# Check if the configuration file exists
if [ ! -f "/etc/nginx/sites-available/flahacalc" ]; then
    echo "❌ Nginx configuration file not found"
    exit 1
fi

# Display the API location block
echo "Current API location configuration:"
grep -A 10 "location /api/" /etc/nginx/sites-available/flahacalc || echo "❌ No API location block found"

# Check if the proxy_pass is correctly configured
if grep -q "proxy_pass http://localhost:3000/api/" /etc/nginx/sites-available/flahacalc; then
    echo "✅ proxy_pass is correctly configured to http://localhost:3000/api/"
elif grep -q "proxy_pass http://localhost:3000/" /etc/nginx/sites-available/flahacalc; then
    echo "❌ proxy_pass is configured to http://localhost:3000/ but should be http://localhost:3000/api/"
    echo "Current proxy_pass configuration:"
    grep "proxy_pass" /etc/nginx/sites-available/flahacalc | grep -A 1 "/api/"
else
    echo "❌ proxy_pass is not correctly configured"
    echo "Current proxy_pass configuration:"
    grep "proxy_pass" /etc/nginx/sites-available/flahacalc | grep -A 1 "/api/"
fi

# Check if the server is listening on port 3000
echo "Checking if server is listening on port 3000..."
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Server is listening on port 3000"
else
    echo "❌ No server listening on port 3000"
fi

# Check server.js API routes
echo "Checking server.js API routes..."
if [ -f "/var/www/flahacalc/EVAPOTRAN/server/server.js" ]; then
    echo "API routes defined in server.js:"
    grep -A 2 "app.get('/api/" /var/www/flahacalc/EVAPOTRAN/server/server.js || echo "❌ No API routes found with '/api/' prefix"
else
    echo "❌ server.js file not found"
fi

echo "Check complete"
