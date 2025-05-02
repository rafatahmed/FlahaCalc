#!/bin/bash

# Exit on error
set -e

# Run pre-deployment checks
bash scripts/pre-deploy-check.sh

echo "Deploying FlahaCalc to production..."

# Build the application
echo "Building application..."
npm run build || { echo "Build failed"; exit 1; }

# Deploy to server
echo "Deploying to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    --exclude '.env' --exclude '.github' \
    ./ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/ || { echo "Rsync failed"; exit 1; }

# SSH into server and restart
echo "Restarting server..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF' || { echo "Server restart failed"; exit 1; }
cd /var/www/flahacalc/EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server

# Update HTML links for production (remove .html extensions)
cd /var/www/flahacalc
bash update_links.sh
bash update_js_links.sh
EOF

echo "Deployment completed successfully!"




