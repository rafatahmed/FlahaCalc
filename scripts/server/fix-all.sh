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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://via.placeholder.com; connect-src 'self' https://api.openweathermap.org;" always;
    
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
    
    # URL rewriting for HTML files
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
}
NGINXCONF

# Create a symbolic link if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/flahacalc ]; then
    ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
fi

# 2. Fix live-weather.js
echo "Fixing live-weather.js..."
# First, create a backup if it doesn't exist
if [ ! -f "/var/www/flahacalc/EVAPOTRAN/js/live-weather.js.bak" ]; then
    cp /var/www/flahacalc/EVAPOTRAN/js/live-weather.js /var/www/flahacalc/EVAPOTRAN/js/live-weather.js.bak
fi

# Update the file with correct API URL handling
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

# 3. Fix script.js
echo "Fixing script.js..."
# First, create a backup if it doesn't exist
if [ ! -f "/var/www/flahacalc/EVAPOTRAN/js/script.js.bak" ]; then
    cp /var/www/flahacalc/EVAPOTRAN/js/script.js /var/www/flahacalc/EVAPOTRAN/js/script.js.bak
fi

# Find and replace the hardcoded localhost URL in the server warning
sed -i 's|http://localhost:3000|${API_BASE_URL}|g' /var/www/flahacalc/EVAPOTRAN/js/script.js

# Update the testServerConnection function to use dynamic API URL
cat > /tmp/testServerConnection.js << 'EOF'
// Test server connection
async function testServerConnection() {
    // Use the same API_BASE_URL logic as in live-weather.js
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? "http://localhost:3000/api" 
        : `https://${hostname}/api`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/test`, { 
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log("Server connection successful");
            return true;
        } else {
            console.error("Server connection failed:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Server connection error:", error);
        return false;
    }
}
EOF

# Replace the testServerConnection function in script.js
sed -i '/async function testServerConnection/,/^}/c\'"$(cat /tmp/testServerConnection.js)" /var/www/flahacalc/EVAPOTRAN/js/script.js

# Update the DOMContentLoaded event handler
cat > /tmp/domContentLoaded.js << 'EOF'
document.addEventListener('DOMContentLoaded', async function() {
    // Test server connection
    const serverAvailable = await testServerConnection();
    if (!serverAvailable) {
        // Get the dynamic API URL
        const hostname = window.location.hostname;
        const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
            ? "http://localhost:3000/api" 
            : `https://${hostname}/api`;
            
        // Show warning about server connection with correct URL
        const warningEl = document.createElement("div");
        warningEl.className = "server-warning";
        warningEl.innerHTML = `
            <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at ${API_BASE_URL}.</p>
            <p>If you're running locally, check the server setup instructions in the README file.</p>
            <p>If you're using the production site, please contact the administrator.</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }
    
    // Rest of your initialization code...
});
EOF

# Replace the DOMContentLoaded event handler in script.js
sed -i '/document.addEventListener('\''DOMContentLoaded'\'', async function()/,/});/c\'"$(cat /tmp/domContentLoaded.js)" /var/www/flahacalc/EVAPOTRAN/js/script.js

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
