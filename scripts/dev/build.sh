#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Check if webpack is installed
if [ -f "./node_modules/.bin/webpack" ]; then
  echo "Webpack found in node_modules"
else
  echo "Webpack not found in node_modules, installing..."
  npm install --save-dev webpack webpack-cli
fi

# Run webpack with verbose output
echo "Running webpack..."
./node_modules/.bin/webpack --config ./EVAPOTRAN/webpack.config.js --display-error-details

echo "Build completed"

