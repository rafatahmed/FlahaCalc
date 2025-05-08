#!/bin/bash

# Exit on error
set -e

echo "Building FlahaCalc..."

# Create build directory if it doesn't exist
mkdir -p build

# Clean previous build
rm -rf build/*

# Copy public files to build directory
cp -r public/* build/

# Process CSS files
echo "Processing CSS files..."
for file in $(find build -name "*.css"); do
  # Minify CSS
  npx clean-css-cli $file -o $file
done

# Process JS files
echo "Processing JavaScript files..."
for file in $(find build -name "*.js" -not -path "*/node_modules/*"); do
  # Minify JS
  npx uglify-js $file -o $file
done

# Copy build to public directory
echo "Copying build to public directory..."
cp -r build/* public/

echo "Build completed successfully!"



