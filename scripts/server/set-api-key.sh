#!/bin/bash

# Exit on error
set -e

echo "Setting up OpenWeatherMap API key..."

# Check if API key is provided as argument
if [ -z "$1" ]; then
    echo "Please provide your OpenWeatherMap API key as an argument."
    echo "Usage: $0 your_api_key"
    exit 1
fi

API_KEY=$1
ENV_FILE="/var/www/flahacalc/EVAPOTRAN/server/.env"

# Create or update .env file
echo "Updating .env file with API key..."
if [ -f "$ENV_FILE" ]; then
    # Update existing file
    sed -i "s/WEATHER_API_KEY=.*/WEATHER_API_KEY=$API_KEY/" "$ENV_FILE"
else
    # Create new file
    echo "# OpenWeatherMap API Key" > "$ENV_FILE"
    echo "WEATHER_API_KEY=$API_KEY" >> "$ENV_FILE"
    echo "PORT=3000" >> "$ENV_FILE"
fi

# Restart the server
echo "Restarting Node.js server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server
pm2 save

echo "Testing API key..."
sleep 2  # Give the server a moment to restart
RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "❌ API key test failed: The key appears to be invalid."
    echo "Response: $RESPONSE"
elif echo "$RESPONSE" | grep -q "name"; then
    echo "✅ API key test passed: The key is valid and working."
else
    echo "⚠️ Unexpected response from weather API."
    echo "Response: $RESPONSE"
fi

echo "API key setup complete!"