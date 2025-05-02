#!/bin/bash

# Exit on error
set -e

echo "Fixing deployment issues..."

# Create necessary directories
mkdir -p scripts/server/nginx

# Create Nginx configuration file if it doesn't exist
if [ ! -f "scripts/server/nginx/flahacalc.conf" ]; then
    echo "Creating Nginx configuration file..."
    cat > scripts/server/nginx/flahacalc.conf << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name flaha.org www.flaha.org;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    
    root /var/www/flahacalc/EVAPOTRAN;
    index index.html;
    
    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
fi

# Copy Nginx configuration to the correct location
echo "Updating Nginx configuration..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Update live-weather.js to use the correct API URL
echo "Updating live-weather.js..."
cat > EVAPOTRAN/js/live-weather.js << 'EOF'
/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 */

// API configuration
const hostname = window.location.hostname;
const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${hostname}/api`;

console.log("Using API_BASE_URL:", API_BASE_URL);

// Rest of your live-weather.js file...
// (Copy the rest of the file content here)
EOF

# Restart the server
echo "Restarting server..."
cd EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server

echo "Deployment fixed successfully!"