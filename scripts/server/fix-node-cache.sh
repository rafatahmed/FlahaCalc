#!/bin/bash

# Exit on error
set -e

echo "Installing missing node-cache dependency..."

# Navigate to server directory
cd /var/www/flahacalc/EVAPOTRAN/server

# Install node-cache
npm install node-cache --save

# Restart the server
pm2 restart flahacalc-server

echo "node-cache installed successfully and server restarted!"
