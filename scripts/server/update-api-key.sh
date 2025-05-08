#!/bin/bash

# Check if API key is provided
if [ -z "$1" ]; then
    echo "Please provide your OpenWeatherMap API key as an argument."
    echo "Usage: ./update-api-key.sh YOUR_API_KEY"
    exit 1
fi

API_KEY=$1
ENV_FILE="/var/www/flahacalc/EVAPOTRAN/server/.env"

echo "Updating OpenWeatherMap API key..."

# Create or update .env file
echo "Updating .env file..."
if [ -f "$ENV_FILE" ]; then
    # Update existing file
    sed -i "s/WEATHER_API_KEY=.*/WEATHER_API_KEY=$API_KEY/" "$ENV_FILE"
else
    # Create new file
    cat > "$ENV_FILE" << EOF
PORT=3000
WEATHER_API_KEY=$API_KEY
EOF
fi

# Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server

# Test the API key
echo "Testing API key..."
sleep 2  # Give the server a moment to restart
RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$API_KEY")

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "❌ WARNING: The API key appears to be invalid."
    echo "Response: $RESPONSE"
    echo "Please check your API key and try again."
elif echo "$RESPONSE" | grep -q "name"; then
    echo "✅ SUCCESS: The API key is valid."
    
    # Test the server endpoint
    echo "Testing server endpoint..."
    RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")
    
    if echo "$RESPONSE" | grep -q "name"; then
        echo "✅ SUCCESS: Server endpoint is working correctly."
        echo "The weather API should now work correctly."
    else
        echo "⚠️ WARNING: Server endpoint test failed."
        echo "Response: $RESPONSE"
        echo "Please check the server logs: pm2 logs flahacalc-server"
    fi
else
    echo "⚠️ INCONCLUSIVE: Unexpected response from OpenWeatherMap."
    echo "Response: $RESPONSE"
    echo "Please test the weather functionality manually."
fi

echo "API key update completed!"