#!/bin/bash

# Exit on error
set -e

echo "Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "EVAPOTRAN/src/index.js" ]; then
  echo "Error: EVAPOTRAN/src/index.js not found"
  exit 1
fi

if [ ! -f "EVAPOTRAN/webpack.config.js" ]; then
  echo "Error: EVAPOTRAN/webpack.config.js not found"
  exit 1
fi

# Check if required dependencies are installed
if ! npm list webpack > /dev/null 2>&1; then
  echo "Error: webpack not installed"
  exit 1
fi

if ! npm list webpack-cli > /dev/null 2>&1; then
  echo "Error: webpack-cli not installed"
  exit 1
fi

if ! npm list css-minimizer-webpack-plugin > /dev/null 2>&1; then
  echo "Error: css-minimizer-webpack-plugin not installed"
  exit 1
fi

# Check if build script works
echo "Testing build process..."
npm run build

# Check if build output exists
if [ ! -d "EVAPOTRAN/dist" ]; then
  echo "Error: Build failed, EVAPOTRAN/dist directory not found"
  exit 1
fi

echo "Pre-deployment checks passed!"
exit 0
