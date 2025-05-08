#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running FlahaCalc safe deployment process"
echo "========================================"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" 
    exit 1
fi

# Check if the safe-deploy.sh script exists
if [ ! -f "/var/www/scripts/deploy/safe-deploy.sh" ]; then
    echo "Error: safe-deploy.sh script not found in /var/www/scripts/deploy/"
    echo "Please ensure the script is in place before running this deployment."
    exit 1
fi

# Make sure the script is executable
chmod +x /var/www/scripts/deploy/safe-deploy.sh

# Run the safe deployment script
/var/www/scripts/deploy/safe-deploy.sh

echo "Deployment process completed."
echo "Please verify the site is working correctly at https://flaha.org"