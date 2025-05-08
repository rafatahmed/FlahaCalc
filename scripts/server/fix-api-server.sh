#!/bin/bash

# Exit on error
set -e

echo "Fixing API server issues..."

# Navigate to server directory
cd /var/www/flahacalc/EVAPOTRAN/server

# 1. Install missing dependencies
echo "Installing dependencies..."
npm install dotenv express cors axios node-cache --save

# 2. Check if .env file exists and has API key
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "WEATHER_API_KEY=your_api_key_here" > .env
  echo "⚠️ Please update the API key in .env file"
else
  if ! grep -q "WEATHER_API_KEY" .env; then
    echo "Adding WEATHER_API_KEY to .env file..."
    echo "WEATHER_API_KEY=your_api_key_here" >> .env
    echo "⚠️ Please update the API key in .env file"
  fi
fi

# 3. Check Nginx configuration
echo "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-enabled/flahacalc" ]; then
  if ! grep -q "location /api" "/etc/nginx/sites-enabled/flahacalc"; then
    echo "⚠️ API proxy configuration is missing in Nginx"
    echo "Please add the following to your Nginx configuration:"
    echo "
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    "
  fi
fi

# 4. Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server

echo "API server fixed successfully!"
echo "Testing API endpoint..."
sleep 2
curl -s http://localhost:3000/api/test