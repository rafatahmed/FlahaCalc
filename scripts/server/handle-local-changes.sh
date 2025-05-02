#!/bin/bash

# Exit on error
set -e

echo "Handling local changes during deployment..."

# Check if there are local changes
if git status --porcelain | grep -q .; then
    echo "Local changes detected. Handling them safely..."
    
    # Create a backup of modified files
    echo "Creating backup of modified files..."
    mkdir -p /var/www/flahacalc/backup-$(date +%Y%m%d-%H%M%S)
    git status --porcelain | grep -E '^\s*M' | awk '{print $2}' | xargs -I{} cp --parents {} /var/www/flahacalc/backup-$(date +%Y%m%d-%H%M%S)/
    
    # Stash local changes
    echo "Stashing local changes..."
    git stash

    # Pull latest changes
    echo "Pulling latest changes from repository..."
    git pull || {
        echo "Pull failed, attempting to resolve conflicts..."
        # If there are conflicts, accept remote versions for deployment scripts
        git checkout --theirs scripts/server/fix-deployment.sh 2>/dev/null || true
        git checkout --theirs scripts/server/nginx/flahacalc.conf 2>/dev/null || true
        git checkout --theirs scripts/server/fix-all.sh 2>/dev/null || true
        git add scripts/server/fix-deployment.sh scripts/server/nginx/flahacalc.conf scripts/server/fix-all.sh 2>/dev/null || true
        git commit -m "Merge origin/main, accepting remote changes for deployment scripts" || true
        # Try pulling again
        git pull
    }
    
    # Apply stashed changes selectively
    echo "Applying stashed changes selectively..."
    
    # Pop the stash but don't apply changes to HTML files (to avoid CSP issues)
    git checkout stash@{0} -- $(git diff --name-only stash@{0} | grep -v "\.html$")
    
    # Drop the stash
    git stash drop
    
    echo "Local changes handled successfully."
else
    echo "No local changes detected. Proceeding with normal pull..."
    git pull
fi

echo "Repository updated successfully."


