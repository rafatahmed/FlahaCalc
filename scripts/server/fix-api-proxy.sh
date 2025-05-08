#!/bin/bash
set -e

echo "Fixing API proxy configuration..."

# Backup current config
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak

# Check if API proxy is correctly configured
if ! grep -q "location /api/" /etc/nginx/sites-available/flahacalc; then
    echo "Adding API proxy configuration..."
    # Add API proxy configuration before the location / block
    sed -i '/location \/ {/i \
    # API proxy\n    location /api/ {\n        proxy_pass http://localhost:3000/api/;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection '\''upgrade'\'';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n' /etc/nginx/sites-available/flahacalc
else
    echo "API proxy configuration exists, ensuring it's correct..."
    # Update existing API proxy configuration
    sed -i '/location \/api\/ {/,/}/c\    # API proxy\n    location /api/ {\n        proxy_pass http://localhost:3000/api/;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection '\''upgrade'\'';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }' /etc/nginx/sites-available/flahacalc
fi

# Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "Nginx configuration updated successfully!"
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi