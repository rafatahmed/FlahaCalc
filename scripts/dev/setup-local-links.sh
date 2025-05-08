#!/bin/bash

# Exit on error
set -e

echo "Setting up local development links..."

# Create symlink for EVAPOTRAN in public/pa directory
if [ ! -d "public/pa/evapotran" ]; then
    echo "Creating symlink for EVAPOTRAN..."
    mkdir -p public/pa
    ln -sf ../../EVAPOTRAN public/pa/evapotran
    echo "Symlink created: public/pa/evapotran -> EVAPOTRAN"
else
    echo "EVAPOTRAN directory already exists in public/pa"
fi

echo "Local development links set up successfully!"