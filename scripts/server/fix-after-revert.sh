#!/bin/bash

# Exit on error
set -e

echo "Fixing issues after revert..."

# 1. Fix git repository
if [ ! -d ".git" ]; then
  echo "Re-initializing git repository..."
  git init
  git remote add origin https://github.com/rafatahmed/FlahaCalc.git
  git fetch
  git checkout -f main
  echo "Git repository initialized."
fi

# 2. Fix permissions
echo "Fixing permissions..."
chmod -R +x node_modules/.bin/
chmod -R +x scripts/

# 3. Fix build script
echo "Fixing build script..."
cat > scripts/dev/build.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Check if webpack is installed
if [ -d "node_modules/webpack" ]; then
  echo "Webpack found in node_modules"
else
  echo "Webpack not found, installing..."
  npm install --save-dev webpack webpack-cli
fi

# Run webpack
echo "Running webpack..."
npx webpack --config webpack.config.js

echo "Build completed successfully!"
EOF
chmod +x scripts/dev/build.sh

# 4. Fix server.js if needed
echo "Checking server.js..."
SERVER_DIR="EVAPOTRAN/server"
if [ ! -f "$SERVER_DIR/server.js" ] || [ ! -s "$SERVER_DIR/server.js" ]; then
  echo "Creating basic server.js..."
  mkdir -p "$SERVER_DIR"
  cat > "$SERVER_DIR/server.js" << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EVAPOTRAN API is running',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF
fi

# 5. Fix package.json in server directory
echo "Checking server package.json..."
if [ ! -f "$SERVER_DIR/package.json" ]; then
  echo "Creating server package.json..."
  cat > "$SERVER_DIR/package.json" << 'EOF'
{
  "name": "evapotran-server",
  "version": "1.0.0",
  "description": "Server for EVAPOTRAN application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2"
  }
}
EOF
fi

# 6. Install server dependencies
echo "Installing server dependencies..."
cd "$SERVER_DIR"
npm install
cd ../..

# 7. Fix Nginx configuration
echo "Fixing Nginx configuration..."
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
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
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Root directory
    root /var/www/flahacalc/EVAPOTRAN;
    index index.html;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Logging
    access_log /var/log/nginx/flaha.access.log;
    error_log /var/log/nginx/flaha.error.log;
}
EOF

# 8. Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
  echo "Reloading Nginx..."
  systemctl reload nginx
else
  echo "Nginx configuration test failed. Please check the errors above."
  exit 1
fi

# 9. Restart Node.js server
echo "Restarting Node.js server..."
cd "$SERVER_DIR"
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "All fixes applied. Please check if the site is working now."