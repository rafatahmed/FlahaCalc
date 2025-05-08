#!/bin/bash

# Exit on error
set -e

echo "Fixing Nginx configuration for EVAPOTRAN..."

# Create a backup of the current Nginx configuration
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak

# Create a new Nginx configuration file
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS if SSL is configured
    # Uncomment the following line if SSL is set up
    # return 301 https://$host$request_uri;
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
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

# Uncomment the following server block if SSL is configured
# server {
#     listen 443 ssl;
#     server_name flaha.org www.flaha.org;
#     
#     # SSL configuration
#     ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     
#     # Root directory
#     root /var/www/flahacalc;
#     index index.html;
#     
#     # Main site
#     location = / {
#         try_files /index.html =404;
#     }
#     
#     # PA division
#     location /pa/ {
#         alias /var/www/flahacalc/pa/;
#         try_files $uri $uri/ /pa/index.html;
#     }
#     
#     # EVAPOTRAN application
#     location /pa/evapotran/ {
#         alias /var/www/flahacalc/EVAPOTRAN/;
#         try_files $uri $uri/ /EVAPOTRAN/index.html;
#     }
#     
#     # API proxy
#     location /api/ {
#         proxy_pass http://localhost:3000/api/;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
#     
#     # Default location
#     location / {
#         try_files $uri $uri/ =404;
#     }
#     
#     # Logging
#     access_log /var/log/nginx/flaha.access.log;
#     error_log /var/log/nginx/flaha.error.log;
# }
EOF

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "Nginx configuration has been updated successfully."
else
    echo "Nginx configuration test failed. Reverting to backup..."
    cp /etc/nginx/sites-available/flahacalc.bak /etc/nginx/sites-available/flahacalc
    systemctl reload nginx
    echo "Reverted to previous configuration."
    exit 1
fi