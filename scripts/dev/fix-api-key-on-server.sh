#!/bin/bash

# Exit on error
set -e

echo "Fixing API key issue on server..."

# Variables
SERVER_HOST="207.154.202.6"
SERVER_USER="root"
SERVER_PATH="/var/www/flahacalc/EVAPOTRAN/server"

# Check if we have SSH access to the server
ssh -q $SERVER_USER@$SERVER_HOST exit
if [ $? -ne 0 ]; then
    echo "Cannot connect to the server. Please check your SSH configuration."
    exit 1
fi

# Prompt for OpenWeatherMap API key
read -p "Enter your OpenWeatherMap API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "API key cannot be empty. Please get a valid API key from https://openweathermap.org/"
    exit 1
fi

# Create or update .env file on the server
echo "Creating/updating .env file on the server..."
ssh $SERVER_USER@$SERVER_HOST << EOF
mkdir -p $SERVER_PATH
cat > $SERVER_PATH/.env << ENVFILE
# OpenWeatherMap API Key
WEATHER_API_KEY=$API_KEY

# Server port (default: 3000)
PORT=3000
ENVFILE

echo "API key has been set on the server."

# Restart the server
cd $SERVER_PATH
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Server has been restarted with the new API key."
EOF

echo "API key has been updated on the server!"
echo "Please test the live weather functionality again."