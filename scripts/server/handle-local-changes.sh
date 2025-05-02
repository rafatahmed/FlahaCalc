#!/bin/bash

# Exit on error
set -e

echo "Handling local changes on the server..."

# Create a directory for the backup
BACKUP_DIR="/var/www/flahacalc/local-changes-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup files with local changes
echo "Backing up files with local changes..."
git diff --name-only | while read file; do
    if [ -f "$file" ]; then
        dir=$(dirname "$BACKUP_DIR/$file")
        mkdir -p "$dir"
        cp "$file" "$BACKUP_DIR/$file"
        echo "Backed up: $file"
    fi
done

# Stash local changes
echo "Stashing local changes..."
git stash

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull

# Apply local changes from backup
echo "Applying important local changes..."

# Create the nginx directory if it doesn't exist
mkdir -p scripts/server/nginx

# Copy the current nginx config if it exists
if [ -f "/etc/nginx/sites-available/flahacalc" ]; then
    cp /etc/nginx/sites-available/flahacalc scripts/server/nginx/flahacalc.conf
    echo "Copied current Nginx config to scripts/server/nginx/flahacalc.conf"
fi

echo "Local changes handled. Backup stored in: $BACKUP_DIR"
echo "You may need to manually merge some changes."