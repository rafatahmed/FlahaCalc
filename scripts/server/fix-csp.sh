#!/bin/bash

echo "Fixing Content Security Policy issues..."

# Update Nginx configuration with the correct CSP
sudo sed -i 's|add_header Content-Security-Policy.*always;|add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' https://cdn.jsdelivr.net; style-src '\''self'\'' '\''unsafe-inline'\'' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src '\''self'\'' https://fonts.gstatic.com chrome-extension:; img-src '\''self'\'' data: https://via.placeholder.com; connect-src '\''self'\'' https://api.openweathermap.org;" always;|g' /etc/nginx/sites-available/flahacalc

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# Verify the CSP header is set correctly
echo "Verifying Content Security Policy header..."
curl -s -I https://flaha.org | grep -i "Content-Security-Policy"

echo "CSP fix completed. Please check the website now."