#!/bin/bash

# Exit on error
set -e

echo "Building project for local development..."

# Create local-build directory if it doesn't exist
mkdir -p local-build

# Copy public files to local-build directory
cp -r public/* local-build/

# Create PA and EVAPOTRAN directories
mkdir -p local-build/pa/evapotran

# Copy PA files
cp -r public/pa/* local-build/pa/

# Copy EVAPOTRAN files
cp -r EVAPOTRAN/* local-build/pa/evapotran/

# No need to fix paths for local development as we're using relative paths

echo "Local build completed successfully!"
echo "To test, run: cd local-build && python -m http.server 8000"
echo "Then visit: http://localhost:8000/"