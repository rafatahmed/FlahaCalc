#!/bin/bash
set -e

echo "Installing missing dotenv module..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install dotenv --save

echo "Restarting server..."
pm2 restart flahacalc-server
pm2 save

echo "dotenv module installed successfully!"