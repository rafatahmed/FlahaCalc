#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc to production..."

# Run pre-deployment checks
bash $(dirname "$0")/pre-deploy-check.sh

# Update repository
echo "Pulling latest changes..."
cd /var/www/flahacalc
git pull

# Install dependencies
echo "Installing dependencies..."
npm install
cd EVAPOTRAN/server
npm install
cd ../..

# Build application
echo "Building application..."
npm run build

# Update Nginx configuration
echo "Updating Nginx configuration..."
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
sudo nginx -t && sudo systemctl reload nginx

# Restart server
echo "Restarting server..."
cd EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server

# Update HTML links for production
cd /var/www/flahacalc
bash scripts/deploy/update-links.sh

echo "Deployment completed successfully!"



