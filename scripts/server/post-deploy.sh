#!/bin/bash

# Exit on error
set -e

echo "Running post-deployment tasks..."

# Update Nginx configuration
echo "Updating Nginx configuration..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
nginx -t && systemctl reload nginx

# Install dependencies for EVAPOTRAN server
echo "Installing server dependencies..."
cd EVAPOTRAN/server
npm install

# Restart the Node.js server
echo "Restarting Node.js server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Post-deployment tasks completed successfully!"