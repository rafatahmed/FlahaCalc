#!/bin/bash

# Exit on error
set -e

echo "Direct Server Edit Workflow"
echo "=========================="
echo ""
echo "WARNING: This script is for emergency fixes only."
echo "It's better to follow the normal development workflow through GitHub."
echo ""

# Check if we're on the server
if [ ! -d "/var/www/flahacalc" ]; then
    echo "This script should be run on the server."
    exit 1
fi

# Make sure we're in the right directory
cd /var/www/flahacalc

# Configure git user if not already configured
if [ -z "$(git config --get user.email)" ]; then
    git config --global user.email "server@flaha.org"
    git config --global user.name "Server Deployment"
fi

# Create a new branch for the changes
branch_name="server-edit-$(date +%Y%m%d-%H%M%S)"
echo "Creating a new branch: $branch_name"
git checkout -b $branch_name

echo "Make your changes now. When you're done, press Enter to continue."
read -p "Press Enter to continue..."

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes detected. Exiting."
    git checkout main
    exit 0
fi

# Show the changes
echo "Changes detected:"
git status
git diff --stat

# Commit the changes
echo "Enter a commit message for your changes:"
read commit_message
if [ -z "$commit_message" ]; then
    commit_message="Server-side changes: $(date)"
fi

git add .
git commit -m "$commit_message"

# Ask if the user wants to push the changes
echo "Do you want to push these changes to GitHub? (y/n)"
read push_changes

if [ "$push_changes" = "y" ]; then
    echo "Pushing changes to GitHub..."
    git push origin $branch_name
    
    echo "Create a pull request at: https://github.com/rafatahmed/FlahaCalc/compare/main...$branch_name"
    echo "After the pull request is merged, the changes will be deployed automatically."
else
    echo "Changes are committed locally but not pushed to GitHub."
    echo "To push them later, run: git push origin $branch_name"
fi

# Apply the changes immediately
echo "Do you want to apply these changes immediately? (y/n)"
read apply_changes

if [ "$apply_changes" = "y" ]; then
    echo "Applying changes..."
    
    # Build the application
    npm run build
    
    # Restart the server
    cd EVAPOTRAN/server
    pm2 restart flahacalc-server
    
    echo "Changes applied successfully!"
else
    echo "Changes are not applied. To apply them, run: npm run build && cd EVAPOTRAN/server && pm2 restart flahacalc-server"
fi

# Switch back to main branch
git checkout main

echo "Direct server edit workflow completed!"