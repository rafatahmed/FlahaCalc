#!/bin/bash

# Directory containing JS files
DIR="/var/www/flahacalc/EVAPOTRAN/js"

# Find all JS files
find "$DIR" -type f -name "*.js" | while read file; do
    echo "Processing $file"
    
    # Replace window.location.href = 'something.html' with window.location.href = 'something'
    sed -i "s/window\.location\.href = ['\"]\([^'\"]*\)\.html['\"]*/window.location.href = '\1'/g" "$file"
    
    # Replace href = 'something.html' with href = 'something'
    sed -i "s/href = ['\"]\([^'\"]*\)\.html['\"]*/href = '\1'/g" "$file"
done

echo "All JS links updated!"
