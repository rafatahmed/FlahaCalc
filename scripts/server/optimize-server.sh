#!/bin/bash

# Exit on error
set -e

echo "Installing performance optimization dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install --save node-cache express-rate-limit compression morgan

echo "Restarting the server with optimizations..."
pm2 restart flahacalc-server

echo "Server optimized and restarted successfully."