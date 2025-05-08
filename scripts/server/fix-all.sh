#!/bin/bash

# Exit on error
set -e

echo "Running comprehensive fixes for FlahaCalc..."

# Fix git conflicts
echo "Fixing git conflicts..."
bash scripts/server/fix-git-conflicts.sh

# Fix webpack permissions
echo "Fixing webpack permissions..."
chmod +x ./node_modules/.bin/webpack
chmod +x scripts/dev/build.sh

# Fix PA directory
echo "Fixing PA directory..."
bash scripts/server/fix-pa-directory.sh

# Update Nginx configuration
echo "Updating Nginx configuration..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Restart Node.js server
echo "Restarting Node.js server..."
cd EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save
cd ../..

# Update HTML links
echo "Updating HTML links..."
bash scripts/deploy/update-links.sh || echo "Update links script not found or failed"

echo "All fixes applied successfully!"
echo "Please verify the site is working correctly at https://flaha.org"
