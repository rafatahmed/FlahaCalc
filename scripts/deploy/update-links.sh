#!/bin/bash

# Exit on error
set -e

echo "Updating links in HTML files for production..."

# Update links in HTML files
cd /var/www/flahacalc/EVAPOTRAN

# Process all HTML files
for file in *.html; do
    echo "Processing $file"
    # Update relative links to absolute links
    sed -i 's/href="css\//href="\/css\//g' "$file"
    sed -i 's/src="js\//src="\/js\//g' "$file"
    sed -i 's/src="img\//src="\/img\//g' "$file"
    # Update API endpoint URLs
    sed -i 's/http:\/\/localhost:3000/https:\/\/flaha.org\/api/g' "$file"
done

echo "All HTML links updated!"

# Update links in JS files
cd /var/www/flahacalc/EVAPOTRAN/js

# Process all JS files
for file in *.js; do
    echo "Processing $file"
    # Update API endpoint URLs
    sed -i 's/http:\/\/localhost:3000/https:\/\/flaha.org\/api/g' "$file"
    # Update relative links to absolute links
    sed -i 's/"\.\/css\//"\/css\//g' "$file"
    sed -i 's/"\.\/js\//"\/js\//g' "$file"
    sed -i 's/"\.\/img\//"\/img\//g' "$file"
done

echo "All JS links updated!"

