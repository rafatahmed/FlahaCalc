#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc to production..."

# Build the application
echo "Building application..."
npm run build

# Deploy to server
echo "Deploying to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    --exclude '.env' --exclude '.github' \
    ./ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/

# SSH into server and restart
echo "Restarting server..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc/EVAPOTRAN/server
npm ci
pm2 restart flahacalc-server
EOF

echo "Deployment completed successfully!"

