#!/bin/bash

# Exit on error
set -e

echo "Starting production deployment for FlahaCalc..."

# 1. Clean up and prepare
echo "Cleaning up and preparing for deployment..."
npm run clean || echo "No clean script found, continuing..."

# 2. Install dependencies
echo "Installing dependencies..."
npm install

# 3. Build the application
echo "Building and optimizing the application..."
npm run build

# 4. Ensure all required assets exist
echo "Ensuring all required assets exist..."
mkdir -p public/img
# Create logo if it doesn't exist
if [ ! -f "public/img/Flaha_logo.svg" ]; then
  echo "Creating logo SVG..."
  cat > public/img/Flaha_logo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <text x="10" y="40" font-family="Arial" font-size="30" font-weight="bold" fill="#3a7e3a">FLAHA</text>
</svg>
EOF
fi
# Create agriculture illustration if it doesn't exist
if [ ! -f "public/img/agriculture-illustration.svg" ]; then
  echo "Creating agriculture illustration..."
  cat > public/img/agriculture-illustration.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect x="50" y="150" width="200" height="20" fill="#8B4513"/>
  <path d="M150,50 L120,150 L180,150 Z" fill="#3a7e3a"/>
  <path d="M100,80 L80,150 L120,150 Z" fill="#3a7e3a"/>
  <path d="M200,80 L180,150 L220,150 Z" fill="#3a7e3a"/>
</svg>
EOF
fi

# 5. Deploy to server
echo "Deploying to production server..."
rsync -avz --delete --exclude 'node_modules' --exclude '.git' \
    --exclude '.env' --exclude '.github' \
    ./public/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/public/

# 6. Deploy server files separately
echo "Deploying server files..."
rsync -avz ./EVAPOTRAN/server/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/EVAPOTRAN/server/

# 7. SSH into server and run post-deployment tasks
echo "Running post-deployment tasks..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Install server dependencies
cd EVAPOTRAN/server
npm install dotenv express cors axios
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# Update Nginx configuration
cd /var/www/flahacalc
echo "Updating Nginx configuration..."
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment completed successfully!"
EOF

echo "Production deployment completed!"
