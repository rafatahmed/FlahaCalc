#!/bin/bash

# Exit on error
set -e

echo "Fixing paths in HTML, CSS, and JS files..."

# Directory containing the build files
BUILD_DIR="build"

# Fix paths in HTML files
echo "Fixing paths in HTML files..."
find "$BUILD_DIR" -type f -name "*.html" | while read file; do
    echo "Processing $file"
    
    # Replace /public/ references with /
    sed -i 's|/public/|/|g' "$file"
    
    # Ensure absolute paths for main resources
    sed -i 's|href="css/|href="/css/|g' "$file"
    sed -i 's|src="js/|src="/js/|g' "$file"
    sed -i 's|src="img/|src="/img/|g' "$file"
    
    # Fix PA-specific paths
    if [[ "$file" == *"/pa/"* ]]; then
        sed -i 's|href="pa/css/|href="/pa/css/|g' "$file"
        sed -i 's|src="pa/js/|src="/pa/js/|g' "$file"
        sed -i 's|src="pa/img/|src="/pa/img/|g' "$file"
    fi
done

# Fix paths in CSS files
echo "Fixing paths in CSS files..."
find "$BUILD_DIR" -type f -name "*.css" | while read file; do
    echo "Processing $file"
    
    # Replace relative URLs with absolute URLs
    sed -i 's|url(\.\./|url(/|g' "$file"
    sed -i 's|url(img/|url(/img/|g' "$file"
    
    # Fix PA-specific paths
    if [[ "$file" == *"/pa/"* ]]; then
        sed -i 's|url(pa/img/|url(/pa/img/|g' "$file"
    fi
done

# Fix paths in JS files
echo "Fixing paths in JS files..."
find "$BUILD_DIR" -type f -name "*.js" | while read file; do
    echo "Processing $file"
    
    # Replace /public/ references with /
    sed -i 's|/public/|/|g' "$file"
    
    # Fix fetch URLs and other resource references
    sed -i 's|fetch("img/|fetch("/img/|g' "$file"
    sed -i 's|fetch("css/|fetch("/css/|g' "$file"
    sed -i 's|fetch("js/|fetch("/js/|g' "$file"
    
    # Fix PA-specific paths
    if [[ "$file" == *"/pa/"* ]]; then
        sed -i 's|fetch("pa/|fetch("/pa/|g' "$file"
    fi
done

echo "All paths fixed successfully!"