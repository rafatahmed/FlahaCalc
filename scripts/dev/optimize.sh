#!/bin/bash

# Exit on error
set -e

echo "Optimizing codebase for production..."

# 1. Remove development files
echo "Removing development files..."
find . -name "*.log" -type f -delete
find . -name "*.debug.js" -type f -delete
find . -name "*.test.js" -type f -delete
find . -name "*.map" -type f -delete

# 2. Remove console.log statements from JavaScript files
echo "Removing console.log statements..."
find EVAPOTRAN/js -name "*.js" -type f -exec sed -i 's/console\.log(/\/\/ console.log(/g' {} \;

# 3. Minify HTML files
echo "Minifying HTML files..."
find EVAPOTRAN -name "*.html" -type f -exec bash -c '
  echo "Processing $1"
  html-minifier --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype "$1" -o "$1.min"
  mv "$1.min" "$1"
' _ {} \;

# 4. Optimize images
echo "Optimizing images..."
find EVAPOTRAN/img -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) -exec bash -c '
  echo "Optimizing $1"
  if [[ $1 == *.png ]]; then
    pngquant --force --quality=65-80 "$1" --output "$1"
  else
    jpegoptim --max=80 --strip-all --all-progressive "$1"
  fi
' _ {} \;

# 5. Clean up unnecessary files
echo "Cleaning up unnecessary files..."
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
find . -name "*.bak" -type f -delete
find . -name "*.swp" -type f -delete

echo "Optimization completed successfully!"