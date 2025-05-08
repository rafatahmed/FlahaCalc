#!/bin/bash

# Exit on error
set -e

# Set variables
BACKUP_DIR="/var/backups/flahacalc"
DATE=$(date +%Y-%m-%d)
APP_DIR="/var/www/flahacalc"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup application files
echo "Backing up application files..."
tar -czf $BACKUP_DIR/flahacalc-$DATE.tar.gz $APP_DIR

# Backup Nginx configuration
echo "Backing up Nginx configuration..."
cp /etc/nginx/sites-available/flahacalc $BACKUP_DIR/nginx-flahacalc-$DATE.conf

# Backup environment variables
echo "Backing up environment variables..."
cp $APP_DIR/EVAPOTRAN/server/.env $BACKUP_DIR/env-$DATE.backup

# Backup PM2 configuration
echo "Backing up PM2 configuration..."
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2-dump-$DATE.pm2

# Remove backups older than 30 days
echo "Removing old backups..."
find $BACKUP_DIR -name "flahacalc-*.tar.gz" -type f -mtime +30 -delete
find $BACKUP_DIR -name "nginx-flahacalc-*.conf" -type f -mtime +30 -delete
find $BACKUP_DIR -name "env-*.backup" -type f -mtime +30 -delete
find $BACKUP_DIR -name "pm2-dump-*.pm2" -type f -mtime +30 -delete

echo "Backup completed successfully!"

