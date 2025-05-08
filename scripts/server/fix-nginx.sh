#!/bin/bash
set -e

echo "Fixing Nginx configuration..."

# Backup current config
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak

# Add EVAPOTRAN location block
sed -i '/location \/pa\/ {/a \
    # EVAPOTRAN location\n    location /pa/evapotran/ {\n        alias /var/www/flahacalc/public/pa/evapotran/;\n        try_files $uri $uri/ =404;\n        index index.html;\n    }' /etc/nginx/sites-available/flahacalc

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "Nginx configuration fixed!"
