#!/bin/bash

# Exit on error
set -e

echo "Starting full deployment process for FlahaCalc..."

# 1. Ensure we have the latest code
echo "Pulling latest changes..."
git pull origin main

# 2. Install dependencies
echo "Installing dependencies..."
npm install
cd EVAPOTRAN/server
npm install
cd ../..

# 3. Build the application
echo "Building application..."
npm run build

# 4. Ensure assets exist
echo "Ensuring assets exist..."
mkdir -p public/img
# Create logo if it doesn't exist
if [ ! -f "public/img/Flaha_logo.svg" ]; then
  cat > public/img/Flaha_logo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <text x="10" y="40" font-family="Arial" font-size="30" font-weight="bold" fill="#3a7e3a">FLAHA</text>
</svg>
EOF
fi
# Create agriculture illustration if it doesn't exist
if [ ! -f "public/img/agriculture-illustration.svg" ]; then
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
echo "Deploying to server..."
# Get server credentials from environment or prompt
if [ -z "$DROPLET_HOST" ]; then
  read -p "Enter server IP address: " DROPLET_HOST
fi
if [ -z "$DROPLET_USERNAME" ]; then
  read -p "Enter server username: " DROPLET_USERNAME
fi

# Deploy EVAPOTRAN files
echo "Deploying EVAPOTRAN files..."
rsync -avz --delete EVAPOTRAN/ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/EVAPOTRAN/

# 6. SSH into server and run post-deployment tasks
echo "Running post-deployment tasks..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
# Create application directory if it doesn't exist
mkdir -p /var/www/flahacalc/public
mkdir -p /var/www/flahacalc/EVAPOTRAN/server

# Install dependencies
cd /var/www/flahacalc/EVAPOTRAN/server
npm install dotenv express cors axios node-cache

# Make all scripts executable
cd /var/www/flahacalc
find scripts -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# Update Nginx configuration
echo "Updating Nginx configuration..."
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak.$(date +%Y%m%d%H%M%S) 2>/dev/null || true

# Create Nginx configuration for evapotran.flaha.org
cat > /etc/nginx/sites-available/evapotran.flaha.org << 'NGINXEOF'
server {
    listen 80;
    server_name evapotran.flaha.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name evapotran.flaha.org;

    ssl_certificate /etc/letsencrypt/live/evapotran.flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/evapotran.flaha.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Root directory for the EVAPOTRAN application
    root /var/www/flahacalc/EVAPOTRAN;
    index index.html;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
    
    # Status page for monitoring
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
    
    # Configure access and error logs for subdomain
    access_log /var/log/nginx/evapotran.flaha.org-access.log;
    error_log /var/log/nginx/evapotran.flaha.org-error.log;
}
NGINXEOF

# Create log files if they don't exist
touch /var/log/nginx/evapotran.flaha.org-access.log
touch /var/log/nginx/evapotran.flaha.org-error.log
chown www-data:www-data /var/log/nginx/evapotran.flaha.org-*.log

# Enable the site
ln -sf /etc/nginx/sites-available/evapotran.flaha.org /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Create .env file if it doesn't exist
if [ ! -f "/var/www/flahacalc/EVAPOTRAN/server/.env" ]; then
  echo "Creating .env file..."
  read -p "Enter your OpenWeatherMap API key: " API_KEY
  
  cat > /var/www/flahacalc/EVAPOTRAN/server/.env << ENVEOF
# OpenWeatherMap API Key
WEATHER_API_KEY=$API_KEY

# Server port (default: 3000)
PORT=3000
ENVEOF
fi

# Restart server
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# Run verification tests
echo "Running verification tests..."

# Verify Nginx configuration
echo "Verifying Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
  echo "✅ Nginx configuration is valid"
else
  echo "❌ Nginx configuration is invalid"
  exit 1
fi

# Verify server is running
echo "Verifying server is running..."
if pm2 list | grep -q "flahacalc-server"; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running"
  exit 1
fi

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

# Test weather API endpoint
echo "Testing weather API endpoint..."
WEATHER_RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")
if echo "$WEATHER_RESPONSE" | grep -q "Invalid API key"; then
  echo "⚠️ Weather API needs a valid API key"
elif echo "$WEATHER_RESPONSE" | grep -q "name"; then
  echo "✅ Weather API is working"
else
  echo "❌ Weather API is not working"
  echo "Response: $WEATHER_RESPONSE"
fi

echo "Deployment completed successfully!"
EOF

# 7. Final verification
echo "Verifying deployment from local machine..."
if curl -s --head "https://evapotran.flaha.org" | grep -q "200 OK"; then
  echo "✅ Website is accessible"
else
  echo "⚠️ Website might not be accessible, please check manually"
fi

echo "Full deployment process completed!"
echo "You can now access the application at: https://evapotran.flaha.org"
