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
ssh $DROPLET_USERNAME@$DROPLET_HOST << 'EOF'
cd /var/www/flahacalc

# Make all scripts executable
find scripts -name "*.sh" -exec chmod +x {} \;

# Create or update the fix-all.sh script
cat > scripts/server/fix-all.sh << 'INNEREOF'
#!/bin/bash

# Exit on error
set -e

echo "Applying all fixes to FlahaCalc deployment..."

# 1. Fix SSL configuration
echo "Fixing SSL configuration..."
cat > /etc/nginx/sites-available/flahacalc << 'NGINXCONF'
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
NGINXCONF

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

// Rest of your live-weather.js file...
// (The script will preserve the rest of the file content)
WEATHERJS
# Append the rest of the original file (excluding the first few lines we just replaced)
tail -n +10 /var/www/flahacalc/EVAPOTRAN/js/live-weather.js.bak >> /var/www/flahacalc/EVAPOTRAN/js/live-weather.js

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
INNEREOF

# Make the fix-all.sh script executable
chmod +x scripts/server/fix-all.sh

# Run the fix-all.sh script
sudo bash scripts/server/fix-all.sh

EOF

echo "Deployment with fixes completed!"
echo "Please check the website now."