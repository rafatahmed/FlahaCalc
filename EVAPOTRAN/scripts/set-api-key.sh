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
ENV_FILE="server/.env"

# Create or update .env file
echo "Updating .env file with API key..."
if [ -f "$ENV_FILE" ]; then
    # Update existing file
    sed -i "s/WEATHER_API_KEY=.*/WEATHER_API_KEY=$API_KEY/" "$ENV_FILE"
else
    # Create new file
    mkdir -p $(dirname "$ENV_FILE")
    echo "# OpenWeatherMap API Key" > "$ENV_FILE"
    echo "WEATHER_API_KEY=$API_KEY" >> "$ENV_FILE"
    echo "PORT=3000" >> "$ENV_FILE"
fi

echo "API key has been set!"
echo "To test the API key, run: curl -s \"https://api.openweathermap.org/data/2.5/weather?q=London&appid=$API_KEY\""