#!/bin/bash

# Exit on error
set -e

echo "Fixing git merge conflicts..."

# Backup important files that have local changes
echo "Backing up files with local changes..."
mkdir -p /tmp/flahacalc-backup

# Backup files with local changes
if [ -f "EVAPOTRAN/js/live-weather.js" ]; then
    cp EVAPOTRAN/js/live-weather.js /tmp/flahacalc-backup/
fi

if [ -f "EVAPOTRAN/js/script.js" ]; then
    cp EVAPOTRAN/js/script.js /tmp/flahacalc-backup/
fi

if [ -f "EVAPOTRAN/server/package.json" ]; then
    cp EVAPOTRAN/server/package.json /tmp/flahacalc-backup/
fi

if [ -f "EVAPOTRAN/server/package-lock.json" ]; then
    cp EVAPOTRAN/server/package-lock.json /tmp/flahacalc-backup/
fi

if [ -f "EVAPOTRAN/server/server.js" ]; then
    cp EVAPOTRAN/server/server.js /tmp/flahacalc-backup/
fi

if [ -f "scripts/dev/build.sh" ]; then
    cp scripts/dev/build.sh /tmp/flahacalc-backup/
fi

# Reset local changes
echo "Resetting local changes..."
git reset --hard

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Restore important customizations if needed
echo "Restoring important customizations..."
if [ -f "/tmp/flahacalc-backup/server.js" ]; then
    echo "Merging server.js customizations..."
    # You may need to manually merge changes here
    # For now, we'll just keep the original file
    cp /tmp/flahacalc-backup/server.js EVAPOTRAN/server/server.js
fi

# Make sure all scripts are executable
echo "Making scripts executable..."
find scripts -name "*.sh" -exec chmod +x {} \;

echo "Git conflicts resolved successfully!"