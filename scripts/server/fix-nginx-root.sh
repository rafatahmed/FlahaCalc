#!/bin/bash

# Exit on error
set -e

echo "Fixing Nginx root directory..."

# Update Nginx configuration to use the correct root directory
sed -i 's|root /var/www/flahacalc/EVAPOTRAN;|root /var/www/flahacalc/public;|g' /etc/nginx/sites-available/flahacalc

# Restart Nginx
systemctl restart nginx

echo "Nginx root directory fixed successfully!"