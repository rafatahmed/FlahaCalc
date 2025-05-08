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

# Create a new production directory
log "Creating new production directory..."
if [ -d "$PROD_DIR" ]; then
  log "Backing up entire production directory..."
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

# Make webpack executable
log "Making webpack executable..."
if [ -f "$PROD_DIR/node_modules/.bin/webpack" ]; then
  chmod +x "$PROD_DIR/node_modules/.bin/webpack"
fi

# Ensure directory structure exists
log "Ensuring directory structure..."
mkdir -p "$PROD_DIR/public"
mkdir -p "$PROD_DIR/public/pa"
mkdir -p "$PROD_DIR/EVAPOTRAN"

# Create main index.html if it doesn't exist
if [ ! -f "$PROD_DIR/public/index.html" ]; then
  log "Creating basic index.html for main site..."
  cat > "$PROD_DIR/public/index.html" << 'EOF_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flaha Agri Tech</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #2c8c99;
            color: white;
            padding: 20px;
            text-align: center;
        }
        h1 {
            margin-top: 0;
        }
        .content {
            margin-top: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #2c8c99;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: #42a5b3;
        }
        .card-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 30px;
        }
        .card {
            flex: 1;
            min-width: 300px;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <header>
        <h1>Flaha Agri Tech</h1>
        <p>Innovative Agricultural Technology Solutions</p>
    </header>
    
    <div class="container">
        <div class="content">
            <h2>Welcome to Flaha Agri Tech</h2>
            <p>We provide cutting-edge technology solutions for modern agriculture.</p>
            
            <div class="card-container">
                <div class="card">
                    <h3>Precision Agriculture</h3>
                    <p>Our precision agriculture tools help farmers optimize their operations through data-driven insights.</p>
                    <a href="/pa/" class="btn">Explore PA Division</a>
                </div>
                
                <div class="card">
                    <h3>EVAPOTRAN Calculator</h3>
                    <p>Calculate reference evapotranspiration (ETo) for optimal irrigation planning.</p>
                    <a href="/evapotran/" class="btn">Open Calculator</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
EOF_HTML
fi

# Create PA index.html if it doesn't exist
if [ ! -f "$PROD_DIR/public/pa/index.html" ]; then
  log "Creating basic index.html for PA directory..."
  cat > "$PROD_DIR/public/pa/index.html" << 'EOF_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PA Division - Flaha Agri Tech</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #2c8c99;
            color: white;
            padding: 20px;
            text-align: center;
        }
        h1 {
            margin-top: 0;
        }
        .content {
            margin-top: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #2c8c99;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: #42a5b3;
        }
    </style>
</head>
<body>
    <header>
        <h1>PA Division</h1>
        <p>Precision Agriculture Solutions by Flaha Agri Tech</p>
    </header>
    
    <div class="container">
        <div class="content">
            <h2>Welcome to the Precision Agriculture Division</h2>
            <p>Our PA division focuses on developing cutting-edge tools for precision agriculture applications.</p>
            
            <h3>Available Tools:</h3>
            <ul>
                <li><a href="/evapotran/">EVAPOTRAN - Evapotranspiration Calculator</a></li>
            </ul>
            
            <a href="/" class="btn">Back to Home</a>
        </div>
    </div>
</body>
</html>
EOF_HTML
fi

# Update Nginx configuration
log "Updating Nginx configuration..."
cat > /etc/nginx/sites-available/flahacalc << 'EOF_NGINX'
server {
    listen 80;
    server_name flaha.org www.flaha.org;

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name flaha.org www.flaha.org;

    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Main site
    root /var/www/flahacalc/public;
    index index.html;

    # Main site
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # PA division
    location /pa/ {
        alias /var/www/flahacalc/public/pa/;
        try_files $uri $uri/ /pa/index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # EVAPOTRAN application
    location /evapotran/ {
        alias /var/www/flahacalc/EVAPOTRAN/;
        try_files $uri $uri/ /EVAPOTRAN/index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF_NGINX

ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

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
