#!/bin/bash

# Exit on error
set -e

echo "Debugging API key issue on server..."

# Check if .env file exists
if [ -f "/var/www/flahacalc/EVAPOTRAN/server/.env" ]; then
    echo "✓ .env file exists"
    
    # Check if WEATHER_API_KEY is set in .env (without revealing the key)
    if grep -q "WEATHER_API_KEY=" /var/www/flahacalc/EVAPOTRAN/server/.env; then
        echo "✓ WEATHER_API_KEY is set in .env"
        
        # Extract the key (masked for security)
        KEY=$(grep "WEATHER_API_KEY=" /var/www/flahacalc/EVAPOTRAN/server/.env | cut -d= -f2)
        KEY_LENGTH=${#KEY}
        MASKED_KEY="${KEY:0:4}$(printf '%*s' $((KEY_LENGTH-8)) | tr ' ' '*')${KEY: -4}"
        echo "✓ API key found (masked): $MASKED_KEY"
    else
        echo "✗ WEATHER_API_KEY is NOT set in .env"
    fi
else
    echo "✗ .env file does NOT exist"
fi

# Check if server.js is loading the .env file
if grep -q "require('dotenv').config()" /var/www/flahacalc/EVAPOTRAN/server/server.js; then
    echo "✓ server.js is loading dotenv"
else
    echo "✗ server.js is NOT loading dotenv"
fi

# Check if the API key is being used in the weather endpoint
if grep -q "WEATHER_API_KEY" /var/www/flahacalc/EVAPOTRAN/server/server.js; then
    echo "✓ server.js is using WEATHER_API_KEY"
else
    echo "✗ server.js is NOT using WEATHER_API_KEY"
fi

# Check if the server is running
if pm2 list | grep -q "flahacalc-server"; then
    echo "✓ Server is running with PM2"
    
    # Check server logs for API key related messages
    echo "Recent server logs:"
    pm2 logs flahacalc-server --lines 20 --nostream
else
    echo "✗ Server is NOT running with PM2"
fi

# Test the API key directly
if [ -f "/var/www/flahacalc/EVAPOTRAN/server/.env" ]; then
    KEY=$(grep "WEATHER_API_KEY=" /var/www/flahacalc/EVAPOTRAN/server/.env | cut -d= -f2)
    echo "Testing API key directly with OpenWeatherMap..."
    RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$KEY")
    
    if echo "$RESPONSE" | grep -q "Invalid API key"; then
        echo "✗ API key test FAILED: The key is invalid"
    elif echo "$RESPONSE" | grep -q "name"; then
        echo "✓ API key test PASSED: The key is valid"
    fi
fi

echo "Debug complete. Please check the results above."

