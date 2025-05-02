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
git clone https://github.com/your-username/flahacalc.git .

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
cat > /etc/nginx/sites-available/flahacalc << EOF
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    location / {
        root /var/www/flahacalc/EVAPOTRAN;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

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
