#!/bin/bash

# Exit on error
set -e

echo "Setting up DigitalOcean Droplet for FlahaCalc..."

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx git

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Create application directory
echo "Creating application directory..."
mkdir -p /var/www/flahacalc
chown -R $USER:$USER /var/www/flahacalc

# Clone the repository
echo "Cloning repository..."
cd /var/www/flahacalc
git clone https://github.com/rafatahmed/FlahaCalc.git .

# Install dependencies
echo "Installing dependencies..."
npm install
cd EVAPOTRAN/server
npm install

# Create .env file
echo "Creating .env file..."
bash ../../scripts/security/setup-env.sh

# Build the application
echo "Building application..."
cd ../..
npm run build

# Set up Nginx
echo "Setting up Nginx..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc

# Enable the site
ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Start the server
echo "Starting the server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 start server.js --name flahacalc-server
pm2 save
pm2 startup

echo "Setup completed successfully!"
echo "Next steps:"
echo "1. Update the WEATHER_API_KEY in /var/www/flahacalc/EVAPOTRAN/server/.env"
echo "2. Set up SSL with Let's Encrypt: sudo certbot --nginx -d flaha.org -d www.flaha.org"

