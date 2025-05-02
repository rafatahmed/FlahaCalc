#!/bin/bash

# Exit on error
set -e

echo "Committing local changes..."

# Configure Git user
git config --global user.email "server@flaha.org"
git config --global user.name "Server Deployment"

# Add all changes
git add .

# Commit changes
git commit -m "Server-side changes: $(date)"

# Push changes to the repository
# Note: This requires proper authentication
# git push

echo "Local changes committed successfully!"
echo "You may need to manually push these changes to the repository."