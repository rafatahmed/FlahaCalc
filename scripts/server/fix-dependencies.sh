#!/bin/bash
set -e

echo "Installing missing Node.js dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server

# Install all required dependencies
npm install dotenv axios express cors --save

# Restart the server to apply changes
pm2 restart flahacalc-server
pm2 save

echo "Dependencies installed successfully!"
echo "Testing API endpoint..."
sleep 2
curl -s http://localhost:3000/api/test