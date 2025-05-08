#!/bin/bash

# Exit on error
set -e

echo "Starting production deployment for EVAPOTRAN..."

# 1. Clean up and prepare
echo "Cleaning up and preparing for deployment..."
npm run clean

# 2. Install production dependencies
echo "Installing production dependencies..."
npm ci --production

# 3. Build and optimize the application
echo "Building and optimizing the application..."
npm run build

# 4. Run security checks
echo "Running security checks..."
npm run security:audit

# 5. Deploy to server
echo "Deploying to production server..."
rsync -avz --delete --exclude 'node_modules' --exclude '.git' \
    --exclude '.env' --exclude '.github' \
    ./EVAPOTRAN/dist/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/EVAPOTRAN/

# 6. Deploy server files separately
echo "Deploying server files..."
rsync -avz ./EVAPOTRAN/server/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/EVAPOTRAN/server/

# 7. SSH into server and run post-deployment tasks
echo "Running post-deployment tasks..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Update Nginx configuration
echo "Updating Nginx configuration..."
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Install server dependencies
cd EVAPOTRAN/server
npm ci --production

# Restart the Node.js server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# Run server optimizations
bash ../../scripts/server/optimize-server.sh

echo "Deployment completed successfully!"
EOF

echo "Production deployment completed!"