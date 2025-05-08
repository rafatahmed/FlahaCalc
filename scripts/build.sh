#!/bin/bash

# Exit on error
set -e

echo "Building project..."

# Clean build directory
rm -rf build
mkdir -p build

# Copy public files to build directory
cp -r public/* build/

# Copy EVAPOTRAN to build/pa/evapotran
mkdir -p build/pa/evapotran
cp -r EVAPOTRAN/* build/pa/evapotran/

# Fix paths in all files
./scripts/dev/fix-paths.sh

# Minify CSS and JS files
echo "Minifying CSS and JS files..."
find build -type f -name "*.css" | xargs -I{} npx cleancss -o {} {}
find build -type f -name "*.js" | xargs -I{} npx uglify-js -o {} {}

echo "Build completed successfully!"
