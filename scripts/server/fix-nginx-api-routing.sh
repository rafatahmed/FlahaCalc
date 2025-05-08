#!/bin/bash

# Exit on error
set -e

echo "Fixing Nginx API routing..."

# Check if Nginx configuration file exists
if [ ! -f "/etc/nginx/sites-available/flahacalc" ]; then
  echo "❌ Nginx configuration file not found!"
  exit 1
fi

# Create a backup of the current configuration
echo "Creating backup of current Nginx configuration..."
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak

# Check if API proxy is already configured
if grep -q "location /api/" "/etc/nginx/sites-available/flahacalc"; then
  echo "✅ API proxy already configured in Nginx"
  
  # Update the proxy_pass directive to ensure it's correct
  sed -i 's|proxy_pass http://localhost:[0-9]*/;|proxy_pass http://localhost:3000/api/;|g' /etc/nginx/sites-available/flahacalc
  echo "Updated proxy_pass directive to ensure correct API routing"
else
  echo "Adding API proxy configuration to Nginx..."
  
  # Find the server block
  SERVER_BLOCK=$(grep -n "server {" /etc/nginx/sites-available/flahacalc | head -1 | cut -d: -f1)
  
  # Add the API location block after the server block
  sed -i "${SERVER_BLOCK}a\\
    location /api/ {\\
        proxy_pass http://localhost:3000/api/;\\
        proxy_http_version 1.1;\\
        proxy_set_header Upgrade \$http_upgrade;\\
        proxy_set_header Connection 'upgrade';\\
        proxy_set_header Host \$host;\\
        proxy_cache_bypass \$http_upgrade;\\
    }\\
" /etc/nginx/sites-available/flahacalc
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx if test is successful
echo "Reloading Nginx..."
systemctl reload nginx

echo "Nginx API routing fixed successfully!"

