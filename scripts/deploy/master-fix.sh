#!/bin/bash

# Exit on error
set -e

echo "Creating master fix for FlahaCalc..."

# 1. Update Nginx configuration file
echo "Updating Nginx configuration..."
mkdir -p scripts/server/nginx
cat > scripts/server/nginx/flahacalc.conf << 'EOF'
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
    
    # Improved SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com chrome-extension:; img-src 'self' data: https://via.placeholder.com; connect-src 'self' https://api.openweathermap.org;" always;
    
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
    
    # Serve static files with proper routing for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 2. Create a server-side fix script that will be executed on the server
echo "Creating server-side fix script..."
cat > scripts/server/fix-all.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Applying all fixes to FlahaCalc deployment..."

# 1. Fix SSL configuration
echo "Fixing SSL configuration..."
cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc

# Create a symbolic link if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/flahacalc ]; then
    ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
fi

# Remove any default configuration
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# 2. Remove all security meta tags from HTML files
echo "Removing security meta tags from HTML files..."
cd /var/www/flahacalc/EVAPOTRAN
for file in *.html; do
    # Remove all meta http-equiv tags related to security
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' "$file"
    sed -i '/<meta http-equiv="X-Content-Type-Options"/d' "$file"
    sed -i '/<meta http-equiv="X-Frame-Options"/d' "$file"
    sed -i '/<meta http-equiv="X-XSS-Protection"/d' "$file"
    sed -i '/<meta http-equiv="Referrer-Policy"/d' "$file"
    sed -i '/<meta http-equiv="Permissions-Policy"/d' "$file"
done

# 3. Update live-weather.js to use the correct API URL
echo "Updating live-weather.js..."
if [ -f "/var/www/flahacalc/EVAPOTRAN/js/live-weather.js" ]; then
    # Backup the original file
    cp /var/www/flahacalc/EVAPOTRAN/js/live-weather.js /var/www/flahacalc/EVAPOTRAN/js/live-weather.js.bak
    
    # Create the new file with the correct API URL
    cat > /var/www/flahacalc/EVAPOTRAN/js/live-weather.js << 'WEATHERJS'
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
WEATHERJS
    
    # Append the rest of the original file (excluding the first few lines we just replaced)
    tail -n +10 /var/www/flahacalc/EVAPOTRAN/js/live-weather.js.bak >> /var/www/flahacalc/EVAPOTRAN/js/live-weather.js
fi

# 4. Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting Nginx..."
    systemctl restart nginx
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# 5. Restart Node.js server
echo "Restarting Node.js server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "All fixes applied successfully!"
EOF

# 3. Update the deploy-with-fixes.sh script to run the fix-all.sh script
echo "Updating deploy-with-fixes.sh script..."
cat > scripts/deploy/deploy-with-fixes.sh << 'EOF'
#!/bin/bash

# Exit on error
set -e

echo "Deploying FlahaCalc with automatic fixes..."

# 1. First, commit and push changes to GitHub
echo "Committing and pushing changes to GitHub..."
git add .
git commit -m "Deploy with automatic fixes: $(date)"
git push origin main

# 2. Wait for GitHub Actions to complete deployment
echo "Waiting for GitHub Actions to complete deployment (30 seconds)..."
sleep 30

# 3. SSH into the server and apply fixes
echo "SSHing into server to apply fixes..."
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'SSHEOF'
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Run the fix-all.sh script
sudo bash scripts/server/fix-all.sh
SSHEOF

echo "Deployment with fixes completed!"
echo "Please check the website now."
EOF

# 4. Update GitHub Actions workflow to make scripts executable
echo "Updating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

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
            
            # Install dependencies
            npm install
            cd EVAPOTRAN/server
            npm install
            cd ../..
            
            # Build application
            npm run build
            
            # Make all scripts executable
            find scripts -name "*.sh" -exec chmod +x {} \;
            
            # Update Nginx configuration
            echo "Updating Nginx configuration..."
            cp scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc
            ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
            nginx -t && systemctl reload nginx
            
            # Restart server
            cd EVAPOTRAN/server
            pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
            
            # Update HTML links for production
            cd /var/www/flahacalc
            bash scripts/deploy/update-links.sh
            
            # Run the fix-all script
            sudo bash scripts/server/fix-all.sh
            
            echo "Deployment completed successfully!"
EOF

# Make all scripts executable locally
chmod +x scripts/deploy/master-fix.sh
chmod +x scripts/deploy/deploy-with-fixes.sh
chmod +x scripts/server/fix-all.sh

echo "Master fix created successfully!"
echo "Now you can run: git add . && git commit -m 'Add master fix scripts' && git push origin main"
echo "Or simply run: bash scripts/deploy/deploy-with-fixes.sh"