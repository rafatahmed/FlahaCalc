#!/bin/bash

echo "Checking forecast API issue..."

# Check server logs
echo "=== SERVER LOGS ==="
pm2 logs flahacalc-server --lines 20 --nostream

# Check server.js content
echo -e "\n=== SERVER.JS CONTENT ==="
cd /var/www/flahacalc/EVAPOTRAN/server
grep -A 5 "require('dotenv')" server.js
echo "..."
grep -A 5 "WEATHER_API_KEY" server.js || echo "WEATHER_API_KEY not found"
echo "..."
grep -A 20 "/api/forecast" server.js || echo "/api/forecast endpoint not found"

# Check environment variables
echo -e "\n=== ENVIRONMENT VARIABLES ==="
grep "WEATHER_API_KEY" .env || echo "WEATHER_API_KEY not found in .env file"
grep "OPENWEATHER_API_KEY" .env || echo "OPENWEATHER_API_KEY not found in .env file"

# Test API endpoints
echo -e "\n=== API TEST ENDPOINT ==="
curl -s "http://localhost:3000/api/test" | jq . || echo "Failed to access test endpoint"

echo -e "\n=== WEATHER API ENDPOINT ==="
curl -s "http://localhost:3000/api/weather?q=London" | grep -o '"name":"London"' || echo "Weather API endpoint not working properly"

echo -e "\n=== FORECAST API ENDPOINT ==="
curl -s "http://localhost:3000/api/forecast?lat=25.4934093&lon=51.405767" | head -c 100 || echo "Forecast API endpoint not working properly"

echo -e "\n=== CHECKING FOR AXIOS ==="
grep -A 2 "require('axios')" server.js || echo "axios not required in server.js"
npm list axios || echo "axios not installed"

echo "Diagnostic complete. Please review the output above to identify the issue."