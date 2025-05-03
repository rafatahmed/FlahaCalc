#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Initializing new deployment system for FlahaCalc"
echo "==============================================="

# Configuration
PROD_DIR="/var/www/flahacalc"
BACKUP_DIR="/var/www/flahacalc-backup-$(date +%Y%m%d-%H%M%S)"
CRITICAL_FILES=(
  "EVAPOTRAN/server/.env"
  "EVAPOTRAN/server/config/custom-settings.json"
)

# Check if production directory exists
if [ -d "$PROD_DIR" ]; then
  echo "Backing up existing production directory..."
  mkdir -p "$BACKUP_DIR"
  
  # Backup critical files
  for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$PROD_DIR/$file" ]; then
      echo "Backing up $file"
      mkdir -p "$BACKUP_DIR/$(dirname "$file")"
      cp -p "$PROD_DIR/$file" "$BACKUP_DIR/$file"
    fi
  done
  
  # Check if it's a git repository
  if [ -d "$PROD_DIR/.git" ]; then
    echo "Existing Git repository found."
    echo "Saving local changes if any..."
    cd "$PROD_DIR"
    if [ -n "$(git status --porcelain)" ]; then
      echo "Local changes detected. Creating patch file..."
      git diff > "$BACKUP_DIR/local_changes.patch"
      echo "Local changes saved to $BACKUP_DIR/local_changes.patch"
    else
      echo "No local changes detected."
    fi
  fi
  
  # Create deployment scripts directory if it doesn't exist
  mkdir -p "$PROD_DIR/scripts/deploy"
  
  # Copy the safe-deploy script to the production directory
  echo "Installing safe-deploy.sh script..."
  cp "$(dirname "$0")/safe-deploy.sh" "$PROD_DIR/scripts/deploy/"
  chmod +x "$PROD_DIR/scripts/deploy/safe-deploy.sh"
  
  echo "Initialization complete!"
  echo "Your existing setup has been preserved and backed up to $BACKUP_DIR"
  echo "The new deployment system is now ready."
  echo ""
  echo "Next steps:"
  echo "1. Push a change to your GitHub repository to trigger the deployment"
  echo "2. Or manually run: bash $PROD_DIR/scripts/deploy/safe-deploy.sh"
else
  echo "Production directory does not exist. Creating it..."
  mkdir -p "$PROD_DIR"
  mkdir -p "$PROD_DIR/scripts/deploy"
  
  # Copy the safe-deploy script to the production directory
  echo "Installing safe-deploy.sh script..."
  cp "$(dirname "$0")/safe-deploy.sh" "$PROD_DIR/scripts/deploy/"
  chmod +x "$PROD_DIR/scripts/deploy/safe-deploy.sh"
  
  echo "Initialization complete!"
  echo "The new deployment system is now ready."
  echo ""
  echo "Next steps:"
  echo "1. Push a change to your GitHub repository to trigger the deployment"
  echo "2. Or manually run: bash $PROD_DIR/scripts/deploy/safe-deploy.sh"
fi
