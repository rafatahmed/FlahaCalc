#!/bin/bash

# Exit on error
set -e

echo "Applying Nginx configuration fix..."

# Copy the updated configuration file
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc

# Test the configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx if test is successful
echo "Reloading Nginx..."
systemctl reload nginx

echo "Nginx configuration updated successfully!"
echo "API routing should now work correctly."