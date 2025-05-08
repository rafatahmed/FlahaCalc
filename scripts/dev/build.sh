#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Check if webpack is installed
if [ -f "./node_modules/.bin/webpack" ]; then
    echo "Webpack found in node_modules"
    
    # Make webpack executable
    chmod +x ./node_modules/.bin/webpack
    
    # Run webpack
    echo "Running webpack..."
    ./node_modules/.bin/webpack --config EVAPOTRAN/webpack.config.js
else
    echo "Webpack not found in node_modules. Please run 'npm install' first."
    exit 1
fi

echo "Build completed successfully!"






