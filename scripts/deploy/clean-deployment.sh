#!/bin/bash

# Exit on error
set -e

echo "Setting up clean deployment process for FlahaCalc..."

# 1. First, let's consolidate all the fixes into a single pre-deployment script
echo "Creating consolidated pre-deployment script..."

mkdir -p scripts/deploy/pre-deploy

cat > scripts/deploy/pre-deploy/fix-js-files.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Fixing JavaScript files before deployment..."

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

# Fix any D3.js related issues
echo "Checking for D3.js issues..."
# Add your D3.js fixes here if needed

echo "JavaScript files fixed successfully!"
EOF

# 2. Create a script to fix API endpoints
cat > scripts/deploy/pre-deploy/fix-api-endpoints.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Fixing API endpoints before deployment..."

# Update server configuration to use correct API endpoints
echo "Updating server configuration..."
if [ -f "EVAPOTRAN/server/config/server-config.js" ]; then
    sed -i 's|http://localhost:3000|https://${hostname}/api|g' EVAPOTRAN/server/config/server-config.js
fi

echo "API endpoints fixed successfully!"
EOF

# 3. Create a script to fix Nginx configuration
cat > scripts/deploy/pre-deploy/fix-nginx-config.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

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

echo "Nginx configuration created successfully!"
EOF

# 4. Create a master pre-deployment script
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

# 5. Update the main deployment script to use our pre-deployment fixes
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

# 6. Update GitHub Actions workflow
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install
          cd EVAPOTRAN/server
          npm install
          
      - name: Run pre-deployment fixes
        run: bash scripts/deploy/pre-deploy.sh
          
      - name: Build application
        run: npm run build
        
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@master
        with:
          host: 207.154.202.6
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          port: 22
          script: |
            # Check if the repository exists
            if [ ! -d "/var/www/flahacalc" ]; then
              echo "Creating application directory..."
              mkdir -p /var/www/flahacalc
              cd /var/www/flahacalc
              git clone https://github.com/rafatahmed/FlahaCalc.git .
            else
              # Update the repository
              cd /var/www/flahacalc
              git pull
            fi
            
            # Make all scripts executable
            find scripts -name "*.sh" -exec chmod +x {} \;
            
            # Install dependencies
            npm install
            cd EVAPOTRAN/server
            npm install
            cd ../..
            
            # Update Nginx configuration
            echo "Updating Nginx configuration..."
            sudo cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
            sudo ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
            sudo nginx -t && sudo systemctl reload nginx
            
            # Restart server
            cd EVAPOTRAN/server
            pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
            pm2 save
            
            echo "Deployment completed successfully!"
EOF

# Make all scripts executable
chmod +x scripts/deploy/pre-deploy.sh
chmod +x scripts/deploy/pre-deploy/*.sh
chmod +x scripts/deploy/deploy.sh

echo "Clean deployment setup completed successfully!"
echo ""
echo "To use the new deployment process:"
echo "1. Review the changes to ensure they match your requirements"
echo "2. Commit and push the changes to GitHub:"
echo "   git add scripts/ .github/"
echo "   git commit -m 'Implement clean deployment process'"
echo "   git push origin main"
echo ""
echo "This will trigger a GitHub Actions workflow that will deploy your application with all the fixes applied automatically."