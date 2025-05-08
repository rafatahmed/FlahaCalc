#!/bin/bash

# Exit on error
set -e

echo "Applying simplified Nginx configuration..."

# Create a simple Nginx configuration
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # Main site
    location = / {
        try_files /index.html =404;
    }
    
    # PA division
    location /pa/ {
        alias /var/www/flahacalc/pa/;
        try_files $uri $uri/ /pa/index.html;
    }
    
    # EVAPOTRAN application
    location /pa/evapotran/ {
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Default location
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Logging
    access_log /var/log/nginx/flaha.access.log;
    error_log /var/log/nginx/flaha.error.log;
}
EOF

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting Nginx..."
    systemctl restart nginx
    echo "Nginx configuration fixed successfully!"
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# Verify website accessibility
echo "Verifying website accessibility..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Website is accessible locally (HTTP $HTTP_CODE)"
else
    echo "❌ Website is not accessible locally (HTTP $HTTP_CODE)"
    echo "Checking Nginx error log..."
    tail -n 20 /var/log/nginx/error.log
fi