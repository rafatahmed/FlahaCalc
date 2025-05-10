#!/bin/bash

# Exit on error
set -e

echo "Fixing routes and URL structure..."

# Update Nginx configuration
bash /var/www/flahacalc/scripts/server/fix-nginx-routes.sh

# Copy the updated path-helper.js to all necessary locations
cp /var/www/flahacalc/public/js/path-helper.js /var/www/flahacalc/public/pa/js/
cp /var/www/flahacalc/public/js/path-helper.js /var/www/flahacalc/public/pa/evapotran/js/

# Make sure path-helper.js is included in all HTML files
for htmlfile in $(find /var/www/flahacalc/public -name "*.html"); do
    # Check if path-helper.js is already included
    if ! grep -q "path-helper.js" "$htmlfile"; then
        # Add path-helper.js before the closing body tag
        sed -i 's|</body>|    <script src="/js/path-helper.js"></script>\n</body>|' "$htmlfile"
    fi
done

echo "Routes and URL structure fixed successfully!"