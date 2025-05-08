#!/bin/bash

# Exit on error
set -e

echo "Installing all required dependencies for local development..."

# Install main project dependencies
npm install

# Install server dependencies
cd EVAPOTRAN/server
npm install dotenv axios express cors --save

echo "All dependencies installed successfully!"
echo "You can now run the local server with: npm run start-local"