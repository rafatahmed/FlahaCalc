#!/bin/bash

echo "EMERGENCY FIX: Troubleshooting and fixing site issues..."

# 1. Check Nginx status and fix if needed
echo "1. Checking Nginx status..."
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running. Attempting to start..."
    systemctl start nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx started successfully"
    else
        echo "⚠️ Failed to start Nginx. Checking error logs..."
        journalctl -u nginx --no-pager | tail -n 20
    fi
else
    echo "✅ Nginx is running"
fi

# 2. Check Node.js server and fix if needed
echo "2. Checking Node.js server..."
if ! pm2 list | grep -q "flahacalc-server"; then
    echo "❌ Node.js server is not running. Attempting to start..."
    cd /var/www/flahacalc/EVAPOTRAN/server
    pm2 start server.js --name flahacalc-server
    if pm2 list | grep -q "flahacalc-server"; then
        echo "✅ Node.js server started successfully"
    else
        echo "⚠️ Failed to start Node.js server. Checking for errors..."
        cd /var/www/flahacalc/EVAPOTRAN/server
        node server.js
    fi
else
    echo "✅ Node.js server is running"
    echo "Restarting Node.js server to ensure it's working properly..."
    pm2 restart flahacalc-server
fi

# 3. Check Nginx configuration
echo "3. Checking Nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration is invalid. Creating a basic working configuration..."
    cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
    # Main site
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # PA division
    location /pa/ {
        alias /var/www/flahacalc/pa/;
        try_files $uri $uri/ /pa/index.html;
    }
    
    # EVAPOTRAN application
    location /EVAPOTRAN/ {
        alias /var/www/flahacalc/EVAPOTRAN/;
        try_files $uri $uri/ /EVAPOTRAN/index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
    nginx -t
    if [ $? -eq 0 ]; then
        echo "✅ Created a valid Nginx configuration"
        systemctl restart nginx
    else
        echo "⚠️ Still having issues with Nginx configuration"
    fi
else
    echo "✅ Nginx configuration is valid"
fi

# 4. Check file permissions and ownership
echo "4. Fixing file permissions and ownership..."
chown -R www-data:www-data /var/www/flahacalc
find /var/www/flahacalc -type d -exec chmod 755 {} \;
find /var/www/flahacalc -type f -exec chmod 644 {} \;
find /var/www/flahacalc/scripts -name "*.sh" -exec chmod 755 {} \;
echo "✅ File permissions and ownership fixed"

# 5. Check if index.html exists
echo "5. Checking if index.html exists..."
if [ ! -f /var/www/flahacalc/index.html ]; then
    echo "❌ index.html not found. Creating a basic one..."
    cat > /var/www/flahacalc/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlahaCalc</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        .links { margin-top: 30px; }
        .links a { display: inline-block; margin: 10px; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to FlahaCalc</h1>
        <p>A collection of agricultural calculators and tools</p>
        <div class="links">
            <a href="/pa/">PA Division</a>
            <a href="/EVAPOTRAN/">EVAPOTRAN Calculator</a>
        </div>
    </div>
</body>
</html>
EOF
    echo "✅ Created basic index.html"
else
    echo "✅ index.html exists"
fi

# 6. Check if EVAPOTRAN directory exists
echo "6. Checking if EVAPOTRAN directory exists..."
if [ ! -d /var/www/flahacalc/EVAPOTRAN ]; then
    echo "❌ EVAPOTRAN directory not found. This is a critical issue."
    echo "Please check if the repository was cloned correctly."
else
    echo "✅ EVAPOTRAN directory exists"
fi

# 7. Check if server.js exists and has correct API key
echo "7. Checking server.js and environment variables..."
if [ ! -f /var/www/flahacalc/EVAPOTRAN/server/server.js ]; then
    echo "❌ server.js not found. This is a critical issue."
    echo "Please check if the repository was cloned correctly."
else
    echo "✅ server.js exists"
    
    # Check if .env file exists
    if [ ! -f /var/www/flahacalc/EVAPOTRAN/server/.env ]; then
        echo "❌ .env file not found. Creating a basic one..."
        cat > /var/www/flahacalc/EVAPOTRAN/server/.env << 'EOF'
PORT=3000
WEATHER_API_KEY=your_openweathermap_api_key
CORS_ORIGIN=http://localhost,http://127.0.0.1,http://flaha.org,http://www.flaha.org
EOF
        echo "⚠️ Created basic .env file, but you need to update the WEATHER_API_KEY"
    else
        echo "✅ .env file exists"
    fi
fi

# 8. Restart services
echo "8. Restarting services..."
systemctl restart nginx
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# 9. Test site accessibility
echo "9. Testing site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Main site is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Main site is not accessible (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/EVAPOTRAN/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ EVAPOTRAN is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ EVAPOTRAN is not accessible (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/test)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ API is not accessible (HTTP $HTTP_CODE)"
    echo "Checking Node.js server logs..."
    pm2 logs flahacalc-server --lines 10
fi

echo "Emergency fix completed. Please check if the site is now working."