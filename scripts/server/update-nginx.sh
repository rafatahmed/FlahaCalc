#!/bin/bash

# Exit on error
set -e

echo "Updating Nginx configuration..."

# Create a backup of the current configuration
sudo cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak.$(date +%Y%m%d%H%M%S)

# Copy the new configuration
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc

# Create a symbolic link if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/flahacalc ]; then
    sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Nginx configuration updated successfully!"
else
    echo "Nginx configuration test failed. Reverting to backup..."
    sudo cp /etc/nginx/sites-available/flahacalc.bak.* /etc/nginx/sites-available/flahacalc
    sudo systemctl reload nginx
    echo "Reverted to previous configuration."
    exit 1
fi