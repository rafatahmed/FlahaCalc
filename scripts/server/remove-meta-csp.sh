#!/bin/bash

echo "Removing all security meta tags from HTML files..."

cd /var/www/flahacalc/EVAPOTRAN
for file in *.html; do
    echo "Processing $file"
    # Remove all meta http-equiv tags related to security
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' "$file"
    sed -i '/<meta http-equiv="X-Content-Type-Options"/d' "$file"
    sed -i '/<meta http-equiv="X-Frame-Options"/d' "$file"
    sed -i '/<meta http-equiv="X-XSS-Protection"/d' "$file"
    sed -i '/<meta http-equiv="Referrer-Policy"/d' "$file"
    sed -i '/<meta http-equiv="Permissions-Policy"/d' "$file"
done

echo "All security meta tags removed from HTML files."