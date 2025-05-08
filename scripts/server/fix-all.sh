#!/bin/bash

# Exit on error
set -e

echo "Applying server fixes..."

# Fix Node.js dependencies
echo "Installing missing Node.js dependencies..."
cd EVAPOTRAN/server
npm install dotenv
cd ../..

# Fix Nginx configuration
echo "Updating Nginx configuration..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
nginx -t && systemctl reload nginx

# Restart Node.js server
echo "Restarting Node.js server..."
cd EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "All fixes applied successfully!"
echo "Please verify the site is working correctly at https://flaha.org"
