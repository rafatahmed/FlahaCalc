#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc to production..."

# Run pre-deployment fixes
echo "Running pre-deployment fixes..."
bash scripts/deploy/pre-deploy.sh

# Build the application
echo "Building application..."
npm run build || { echo "Build failed"; exit 1; }

# Deploy to server
echo "Deploying to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    --exclude 'EVAPOTRAN/server/.env' --exclude '.github' \
    ./ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/ || { echo "Rsync failed"; exit 1; }

# SSH into server and restart
echo "Restarting server..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF_SSH' || { echo "Server restart failed"; exit 1; }
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Check if .env file exists
if [ ! -f "EVAPOTRAN/server/.env" ]; then
  echo "WARNING: No .env file found in EVAPOTRAN/server/"
  echo "Creating a placeholder .env file - YOU MUST UPDATE THIS WITH YOUR ACTUAL API KEY"
  cp EVAPOTRAN/server/.env.example EVAPOTRAN/server/.env
fi

# Update Nginx configuration
echo "Updating Nginx configuration..."
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Restart the Node.js server
cd EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Deployment completed successfully!"
EOF_SSH

echo "Deployment completed successfully!"