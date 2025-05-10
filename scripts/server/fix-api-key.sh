#!/bin/bash

# Exit on error
set -e

echo "Fixing API key issue on server..."

# Prompt for OpenWeatherMap API key
read -p "Enter your OpenWeatherMap API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "API key cannot be empty. Please get a valid API key from https://openweathermap.org/"
    exit 1
fi

# Create or update .env file
echo "Creating/updating .env file..."
cat > /var/www/flahacalc/EVAPOTRAN/server/.env << EOF
# OpenWeatherMap API Key
WEATHER_API_KEY=$API_KEY

# Server port (default: 3000)
PORT=3000
EOF

# Ensure server.js is loading dotenv
if ! grep -q "require('dotenv').config()" /var/www/flahacalc/EVAPOTRAN/server/server.js; then
    echo "Adding dotenv configuration to server.js..."
    sed -i '1s/^/require("dotenv").config();\n\n/' /var/www/flahacalc/EVAPOTRAN/server/server.js
fi

# Install dotenv if not already installed
echo "Ensuring dotenv is installed..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install dotenv --save

# Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "API key has been updated and server restarted."
echo "Testing API key..."
KEY=$API_KEY
RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$KEY")

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "WARNING: The API key appears to be invalid."
    echo "Response: $RESPONSE"
    echo "Please check your API key and try again."
elif echo "$RESPONSE" | grep -q "name"; then
    echo "SUCCESS: The API key is valid."
    echo "The weather API should now work correctly."
else
    echo "INCONCLUSIVE: Unexpected response from OpenWeatherMap."
    echo "Response: $RESPONSE"
    echo "Please test the weather functionality manually."
fi


