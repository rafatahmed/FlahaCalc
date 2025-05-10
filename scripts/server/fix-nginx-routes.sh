#!/bin/bash

# Exit on error
set -e

echo "Fixing Nginx routes and configuration..."

# Create a new Nginx configuration file
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Root directory for the main site
    root /var/www/flahacalc/public;
    index index.html;
    
    # Main site - public/index.html as home page
    location = / {
        try_files /index.html =404;
    }
    
    # Remove .html extension from URLs
    location ~ ^(.+)\.html$ {
        return 301 $1;
    }
    
    # Handle URLs without .html extension
    location ~ ^/([^.]+)$ {
        try_files $uri $uri.html $uri/ =404;
    }
    
    # PA division
    location /pa/ {
        alias /var/www/flahacalc/public/pa/;
        try_files $uri $uri/ /pa/index.html;
        
        # Handle CSS, JS, and images
        location ~ \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
        }
    }
    
    # EVAPOTRAN application
    location /pa/evapotran/ {
        alias /var/www/flahacalc/public/pa/evapotran/;
        try_files $uri $uri/ /pa/evapotran/index.html;
        
        # Handle CSS, JS, and images
        location ~ \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
        }
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo "Nginx configuration updated successfully!"