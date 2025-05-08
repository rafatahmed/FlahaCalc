#!/bin/bash

# Exit on error
set -e

echo "Fixing forecast API endpoint..."

# Navigate to server directory
cd /var/www/flahacalc/EVAPOTRAN/server

# Install missing dependencies
echo "Installing missing dependencies..."
npm install dotenv axios --save

# Backup the current server.js file
cp server.js server.js.bak

# Fix the forecast endpoint to use the correct API key variable
echo "Fixing the forecast endpoint..."
sed -i 's/OPENWEATHER_API_KEY/process.env.WEATHER_API_KEY/g' server.js

# Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server
pm2 save

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Test the forecast endpoint
echo "Testing the forecast endpoint..."
RESPONSE=$(curl -s "http://localhost:3000/api/forecast?lat=25.4934093&lon=51.405767")

if [[ "$RESPONSE" == *"error"* ]]; then
  echo "Endpoint still has an error:"
  echo "$RESPONSE"
  echo "Checking server logs..."
  pm2 logs flahacalc-server --lines 10 --nostream
else
  echo "Forecast endpoint is now working!"
  echo "First 100 characters of response:"
  echo "$RESPONSE" | head -c 100
fi

echo "Fix completed. If you encounter any issues, you can restore the backup with:"
echo "cp server.js.bak server.js && pm2 restart flahacalc-server"