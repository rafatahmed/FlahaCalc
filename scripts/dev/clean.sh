#!/bin/bash

# Exit on error
set -e

echo "Cleaning project..."

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf EVAPOTRAN/dist

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules
rm -rf EVAPOTRAN/server/node_modules

# Remove temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -type f -delete
find . -name "*.bak" -type f -delete
find . -name ".DS_Store" -type f -delete

echo "Project cleaned successfully!"
