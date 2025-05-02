#!/bin/bash

# Directory containing HTML files
DIR="/var/www/flahacalc/EVAPOTRAN"

# Find all HTML files
find "$DIR" -type f -name "*.html" | while read file; do
    echo "Processing $file"
    
    # Replace href="something.html" with href="something"
    # But don't change links to external sites or anchors
    sed -i 's/href="\([^"]*\)\.html"/href="\1"/g' "$file"
    
    # Also update JavaScript redirects if any
    sed -i 's/window\.location\.href = "\([^"]*\)\.html"/window.location.href = "\1"/g' "$file"
    sed -i 's/window\.location\.href = \x27\([^\x27]*\)\.html\x27/window.location.href = \x27\1\x27/g' "$file"
done

echo "All links updated!"