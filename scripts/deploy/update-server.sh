#!/bin/bash

# Exit on error
set -e

echo "Updating server code on production..."

# Get server credentials from environment or prompt
if [ -z "$DROPLET_HOST" ]; then
  read -p "Enter server IP address: " DROPLET_HOST
fi
if [ -z "$DROPLET_USERNAME" ]; then
  read -p "Enter server username: " DROPLET_USERNAME
fi

# Deploy only the server files
echo "Deploying server files..."
rsync -avz EVAPOTRAN/server/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/EVAPOTRAN/server/

# SSH into server and restart
echo "Restarting server..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc/EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# Test API endpoint
echo "Testing API endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/test)
echo "API response: $RESPONSE"
if echo "$RESPONSE" | grep -q "status"; then
  echo "✅ API endpoint is working"
else
  echo "❌ API endpoint is not working"
  exit 1
fi

echo "Server update completed successfully!"
EOF

echo "Server code updated successfully!"