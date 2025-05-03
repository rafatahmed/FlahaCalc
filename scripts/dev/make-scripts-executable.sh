#!/bin/bash

# Exit on error
set -e

echo "Making all scripts executable..."

# Find all .sh files and make them executable
find scripts -name "*.sh" -exec chmod +x {} \;

echo "All scripts are now executable!"