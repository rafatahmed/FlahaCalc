#!/bin/bash

# Exit on error
set -e

echo "Syncing server-side fix scripts and consolidating them..."

# Variables
SERVER_HOST="207.154.202.6"
SERVER_USER="root"
SERVER_BASE_PATH="/var/www/flahacalc"
LOCAL_BASE_PATH="."
TEMP_DIR="$(mktemp -d)"

# List of scripts to sync
SCRIPTS=(
  "scripts/server/fix-d3-and-live-weather.sh"
  "scripts/server/fix-server.sh"
  "scripts/server/fix-live-weather-syntax.sh"
  "scripts/server/fix-api-endpoint.sh"
  "scripts/server/fix-production.sh"
)

# Check if we have SSH access to the server
echo "Testing SSH connection to server..."
ssh -q $SERVER_USER@$SERVER_HOST exit
if [ $? -ne 0 ]; then
    echo "Cannot connect to the server. Please check your SSH configuration."
    exit 1
fi

# Create local directories if they don't exist
for SCRIPT in "${SCRIPTS[@]}"; do
    LOCAL_DIR=$(dirname "${LOCAL_BASE_PATH}/${SCRIPT}")
    mkdir -p "$LOCAL_DIR"
done

# Copy each script from the server
echo "Syncing scripts from server..."
for SCRIPT in "${SCRIPTS[@]}"; do
    echo "Syncing ${SCRIPT}..."
    
    # Create a backup if the local file exists
    if [ -f "${LOCAL_BASE_PATH}/${SCRIPT}" ]; then
        cp "${LOCAL_BASE_PATH}/${SCRIPT}" "${LOCAL_BASE_PATH}/${SCRIPT}.bak"
    fi
    
    # Copy the file from the server
    scp "$SERVER_USER@$SERVER_HOST:${SERVER_BASE_PATH}/${SCRIPT}" "${LOCAL_BASE_PATH}/${SCRIPT}"
    
    # Make the script executable
    chmod +x "${LOCAL_BASE_PATH}/${SCRIPT}"
    
    echo "✓ ${SCRIPT} synced successfully"
done

# Also sync the live-weather.js file
echo "Syncing live-weather.js from server..."
mkdir -p "${LOCAL_BASE_PATH}/EVAPOTRAN/js"
scp "$SERVER_USER@$SERVER_HOST:${SERVER_BASE_PATH}/EVAPOTRAN/js/live-weather.js" "${LOCAL_BASE_PATH}/EVAPOTRAN/js/live-weather.js"
echo "✓ live-weather.js synced successfully"

# Now create a consolidated fix script
echo "Creating consolidated fix script..."
mkdir -p scripts/deploy/pre-deploy

cat > scripts/deploy/pre-deploy/consolidated-fixes.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Applying consolidated fixes before deployment..."

# Fix live-weather.js
echo "Fixing live-weather.js..."
cat > EVAPOTRAN/js/live-weather.js << 'WEATHERJS'
/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 */

// API configuration
const hostname = window.location.hostname;
const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${hostname}/api`;

console.log("Using API_BASE_URL:", API_BASE_URL);

// Rest of your live-weather.js file...
WEATHERJS

# Append the rest of the original file (excluding the first few lines we just replaced)
tail -n +10 EVAPOTRAN/js/live-weather.js.bak >> EVAPOTRAN/js/live-weather.js

# Fix Nginx configuration
echo "Creating proper Nginx configuration..."
mkdir -p scripts/server/nginx

cat > scripts/server/nginx/flahacalc.conf << 'NGINXCONF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name flaha.org www.flaha.org;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    
    root /var/www/flahacalc/EVAPOTRAN;
    index index.html;
    
    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXCONF

# Add test endpoint to server.js if it doesn't exist
echo "Checking for test endpoint in server.js..."
if [ -f "EVAPOTRAN/server/server.js" ]; then
    if ! grep -q "app.get('/test'" EVAPOTRAN/server/server.js; then
        echo "Adding test endpoint to server.js..."
        cat >> EVAPOTRAN/server/server.js << 'SERVERJS'

// Add a test endpoint to verify server connectivity
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});
SERVERJS
    fi
fi

echo "All fixes applied successfully!"
EOF

# Create a pre-deployment script
cat > scripts/deploy/pre-deploy.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Running pre-deployment fixes..."

# Make all pre-deploy scripts executable
find scripts/deploy/pre-deploy -name "*.sh" -exec chmod +x {} \;

# Run all pre-deploy scripts
for script in scripts/deploy/pre-deploy/*.sh; do
    echo "Running $script..."
    bash "$script"
done

echo "All pre-deployment fixes completed successfully!"
EOF

# Update the main deployment script
cat > scripts/deploy/deploy.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc to production..."

# Run pre-deployment fixes
echo "Running pre-deployment fixes..."
bash scripts/deploy/pre-deploy.sh

# Build the application
echo "Building application..."
npm run build || { echo "Build failed"; exit 1; }

# Deploy to server
echo "Deploying to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    --exclude '.env' --exclude '.github' \
    ./ $DROPLET_USERNAME@$DROPLET_HOST:/var/www/flahacalc/ || { echo "Rsync failed"; exit 1; }

# SSH into server and restart
echo "Restarting server..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF_SSH' || { echo "Server restart failed"; exit 1; }
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Update Nginx configuration
echo "Updating Nginx configuration..."
sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Restart the Node.js server
cd EVAPOTRAN/server
npm install
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Deployment completed successfully!"
EOF_SSH

echo "Deployment completed successfully!"
EOF

# Make all scripts executable
chmod +x scripts/deploy/pre-deploy.sh
chmod +x scripts/deploy/pre-deploy/*.sh
chmod +x scripts/deploy/deploy.sh

echo "Scripts synced and consolidated successfully!"
echo ""
echo "To use the new deployment process:"
echo "1. Review the changes to ensure they match your requirements"
echo "2. Commit and push the changes to GitHub:"
echo "   git add scripts/ EVAPOTRAN/js/live-weather.js"
echo "   git commit -m 'Sync server fixes and implement clean deployment process'"
echo "   git push origin main"
echo ""
echo "This will ensure that all fixes are applied automatically during deployment."