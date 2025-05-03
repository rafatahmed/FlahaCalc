#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Setting up new deployment system for FlahaCalc"
echo "=============================================="

# Create a directory for our setup files
mkdir -p ~/deployment-setup
cd ~/deployment-setup

# Create the safe-deploy.sh script
echo "Creating safe-deploy.sh script..."
cat > safe-deploy.sh << 'EOF'
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
log "Creating backup of critical files..."
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

# Copy the built application to the production directory
log "Deploying to production directory..."
rsync -av --delete --exclude='.git' --exclude='node_modules' "$TEMP_DIR/" "$PROD_DIR/" >> "$LOG_FILE" 2>&1

# Set proper permissions
log "Setting proper permissions..."
find "$PROD_DIR" -type f -exec chmod 644 {} \;
find "$PROD_DIR" -type d -exec chmod 755 {} \;
find "$PROD_DIR/scripts" -name "*.sh" -exec chmod 755 {} \;

# Restart the server
log "Restarting server..."
cd "$PROD_DIR/EVAPOTRAN/server"
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server >> "$LOG_FILE" 2>&1

# Verify deployment
log "Verifying deployment..."
if curl -s http://localhost:3000/test | grep -q "success"; then
  log "API verification: SUCCESS"
else
  log "API verification: FAILED"
  log "Check server logs with: pm2 logs flahacalc-server"
fi

log "Deployment completed successfully!"
log "Deployment log saved to: $LOG_FILE"
EOF

# Create the initialization script
echo "Creating initialization script..."
cat > initialize-deployment.sh << 'EOF'
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
EOF

# Make scripts executable
chmod +x safe-deploy.sh initialize-deployment.sh

# Run the initialization script
echo "Running initialization script..."
bash initialize-deployment.sh

echo "Setup completed!"
echo "You can now push changes to GitHub to trigger automatic deployment"
echo "or run 'bash /var/www/flahacalc/scripts/deploy/safe-deploy.sh' manually."