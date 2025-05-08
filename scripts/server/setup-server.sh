#!/bin/bash

# Exit on error
set -e

echo "Setting up server for FLAHA.org..."

# Install dependencies
apt update
apt install -y nginx nodejs npm certbot python3-certbot-nginx

# Install PM2 globally
npm install -y pm2 -g

# Create directory structure
mkdir -p /var/www/flahacalc/pa

# Clone repository
git clone https://github.com/yourusername/flahacalc.git /var/www/flahacalc

# Set up Nginx
cp /var/www/flahacalc/scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Set up SSL
certbot --nginx -d flaha.org -d www.flaha.org

# Install server dependencies
cd /var/www/flahacalc/EVAPOTRAN/server
npm install

# Start the server with PM2
pm2 start server.js --name flahacalc-server
pm2 save
pm2 startup

echo "Server setup completed successfully!"