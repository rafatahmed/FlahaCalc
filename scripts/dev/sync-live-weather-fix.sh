#!/bin/bash

# Exit on error
set -e

echo "Syncing live-weather.js fix from server to local repository..."

# Variables
SERVER_HOST="207.154.202.6"
SERVER_USER="root"
SERVER_PATH="/var/www/flahacalc/EVAPOTRAN/js/live-weather.js"
LOCAL_PATH="EVAPOTRAN/js/live-weather.js"

# Check if we have SSH access to the server
ssh -q $SERVER_USER@$SERVER_HOST exit
if [ $? -ne 0 ]; then
    echo "Cannot connect to the server. Please check your SSH configuration."
    exit 1
fi

# Create a backup of the local file
if [ -f "$LOCAL_PATH" ]; then
    echo "Creating backup of local file..."
    cp "$LOCAL_PATH" "${LOCAL_PATH}.bak"
fi

# Copy the fixed file from the server
echo "Copying fixed file from server..."
scp $SERVER_USER@$SERVER_HOST:$SERVER_PATH $LOCAL_PATH

echo "File synced successfully!"
echo "Please review the changes, then commit and push to GitHub:"
echo "git add $LOCAL_PATH"
echo "git commit -m 'Fix syntax error in live-weather.js'"
echo "git push origin main"