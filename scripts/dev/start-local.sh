#!/bin/bash

# Exit on error
set -e

echo "Starting local development server..."

# Build the application
echo "Building application..."
npm run build

# Start the server
echo "Starting server..."
cd EVAPOTRAN/server
node server.js

echo "Local development server started. Press Ctrl+C to stop."