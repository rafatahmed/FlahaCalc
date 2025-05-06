#!/bin/bash

# Script to verify Google Analytics implementation

echo "Verifying Google Analytics implementation..."

# Check if analytics.js exists
if [ ! -f "/var/www/flahacalc/EVAPOTRAN/js/analytics.js" ]; then
    echo "ERROR: analytics.js file not found!"
    exit 1
fi

# Check if all HTML files include the analytics script
MISSING_FILES=()
for file in $(find /var/www/flahacalc/EVAPOTRAN -name "*.html"); do
    if ! grep -q "analytics.js" "$file"; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "WARNING: The following files are missing the analytics script:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo "Consider adding the analytics script to these files."
else
    echo "SUCCESS: All HTML files include the analytics script."
fi

# Check if CSP headers allow Google Analytics
if ! grep -q "googletagmanager.com" "/etc/nginx/sites-available/flahacalc.conf"; then
    echo "WARNING: Nginx configuration may not allow Google Analytics. Check Content-Security-Policy header."
fi

echo "Verification complete."