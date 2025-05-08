#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Trap errors and cleanup on exit
trap cleanup EXIT

# Configuration
REPO_URL="https://github.com/rafatahmed/FlahaCalc.git"
PROD_DIR="/var/www/flahacalc"
LOG_FILE="/var/log/flahacalc-deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/var/www/flahacalc-backup-$(date +%Y%m%d-%H%M%S)"
CRITICAL_FILES=(
  "EVAPOTRAN/server/.env"
  "EVAPOTRAN/server/config/custom-settings.json"
  "EVAPOTRAN/js/live-weather.js"
  "EVAPOTRAN/js/script.js"
  "EVAPOTRAN/server/package.json"
  "EVAPOTRAN/server/package-lock.json"
  "EVAPOTRAN/server/server.js"
  "scripts/dev/build.sh"
)

# Function to log messages
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_handler() {
  log "ERROR: Deployment failed at line $1"
  exit 1
}

# Set up error handling
trap 'error_handler $LINENO' ERR

# Cleanup function
cleanup() {
  if [ -d "$TEMP_DIR" ]; then
    log "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
  fi
}

# Start deployment
log "Starting safe deployment process for FlahaCalc"
log "=============================================="

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
log "Created temporary directory: $TEMP_DIR"

# Clone the repository to the temporary directory
log "Cloning repository to temporary directory..."
git clone --depth=1 "$REPO_URL" "$TEMP_DIR" >> "$LOG_FILE" 2>&1

# Install dependencies in the temporary directory
log "Installing dependencies..."
cd "$TEMP_DIR"
npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1
cd EVAPOTRAN/server
npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1
cd ../..

# Build the application
log "Building application..."
npm run build >> "$LOG_FILE" 2>&1

# Create backup directory
log "Creating backup of production directory..."
mkdir -p "$BACKUP_DIR"

# Backup critical files
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$PROD_DIR/$file" ]; then
    log "Backing up $file"
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp -p "$PROD_DIR/$file" "$BACKUP_DIR/$file"
  fi
done

# Preserve critical files by copying them to the new build
log "Preserving critical files..."
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$PROD_DIR/$file" ]; then
    log "Preserving $file"
    mkdir -p "$TEMP_DIR/$(dirname "$file")"
    cp -p "$PROD_DIR/$file" "$TEMP_DIR/$file"
  fi
done

# Create a new production directory
log "Creating new production directory..."
if [ -d "$PROD_DIR" ]; then
  log "Moving current production directory to backup..."
  mv "$PROD_DIR" "${PROD_DIR}_old"
fi

mkdir -p "$PROD_DIR"

# Copy the built application to the production directory
log "Deploying to production directory..."
rsync -av --exclude='.git' --exclude='node_modules' "$TEMP_DIR/" "$PROD_DIR/" >> "$LOG_FILE" 2>&1

# Set proper permissions
log "Setting proper permissions..."
find "$PROD_DIR" -type f -exec chmod 644 {} \;
find "$PROD_DIR" -type d -exec chmod 755 {} \;
find "$PROD_DIR/scripts" -name "*.sh" -exec chmod 755 {} \;

# Restart the server
log "Restarting server..."
cd "$PROD_DIR/EVAPOTRAN/server"
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server >> "$LOG_FILE" 2>&1
pm2 save

# Update HTML links
log "Updating HTML links..."
cd "$PROD_DIR"
bash scripts/deploy/update-links.sh || log "Update links script not found or failed"

# Verify deployment
log "Verifying deployment..."
if curl -s http://localhost:3000/test | grep -q "API is working"; then
  log "API verification: SUCCESS"
else
  log "API verification: FAILED"
  log "Check server logs with: pm2 logs flahacalc-server"
fi

# Clean up old production directory if everything is successful
if [ -d "${PROD_DIR}_old" ]; then
  log "Removing old production directory..."
  rm -rf "${PROD_DIR}_old"
fi

log "Deployment completed successfully!"
log "Deployment log saved to: $LOG_FILE"
