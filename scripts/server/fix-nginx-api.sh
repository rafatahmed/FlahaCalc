#!/bin/bash

# Exit on error
set -e

echo "Fixing Nginx API routing..."

# Update Nginx configuration
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
    }

    # EVAPOTRAN application
    location /pa/evapotran/ {
        alias /var/www/flahacalc/public/pa/evapotran/;
        try_files $uri $uri/ /pa/evapotran/index.html;
    }

    # API endpoints - IMPORTANT: This needs to be before the static files location
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Direct API test endpoint (for monitoring tools)
    location = /api/test {
        proxy_pass http://localhost:3000/api/test;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
    
    # Status page for monitoring
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "Nginx API routing fixed successfully!"