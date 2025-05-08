#!/bin/bash

# Exit on error
set -e

echo "Fixing API routing issue..."

# Create a backup of the current Nginx configuration
echo "Creating backup of current Nginx configuration..."
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak.$(date +%Y%m%d%H%M%S)

# Update the API location block in Nginx configuration
echo "Updating API location block in Nginx configuration..."
sed -i '/location \/api\//,/}/c\
    location /api/ {\
        proxy_pass http://localhost:3000/api/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
    }' /etc/nginx/sites-available/flahacalc

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx if test is successful
echo "Reloading Nginx..."
systemctl reload nginx

echo "API routing fixed successfully!"
echo "Run 'bash scripts/server/check-nginx-config.sh' to verify the fix."



