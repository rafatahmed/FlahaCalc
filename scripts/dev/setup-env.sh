#!/bin/bash

# Exit on error
set -e

echo "Setting up local environment variables..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# DigitalOcean Droplet connection details
DROPLET_USERNAME=root
DROPLET_HOST=207.154.202.6
EOF
    echo ".env file created. Please update with your actual credentials."
else
    echo ".env file already exists."
fi

# Source the environment variables
echo "Loading environment variables..."
export $(grep -v '^#' .env | xargs)

echo "Environment setup completed!"