#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc locally for testing..."

# Run pre-deployment checks
bash $(dirname "$0")/pre-deploy-check.sh

# Build the application
echo "Building application..."
npm run build || { echo "Build failed"; exit 1; }

# Start the server
echo "Starting server..."
cd EVAPOTRAN/server
node server.js

echo "Local deployment completed. Press Ctrl+C to stop the server."
