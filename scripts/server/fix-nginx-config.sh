#!/bin/bash

echo "Fixing Nginx configuration..."

# Get the domain name
DOMAIN=$(grep "server_name" /etc/nginx/sites-enabled/flahacalc | head -1 | awk '{print $2}' | tr -d ';')
echo "Domain: $DOMAIN"

# Check if SSL certificate exists
SSL_EXISTS=false
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate exists"
    SSL_EXISTS=true
else
    echo "❌ SSL certificate not found"
fi

# Create a new Nginx configuration
echo "Creating new Nginx configuration..."
cat > /etc/nginx/sites-available/flahacalc << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS if SSL exists
    $(if [ "$SSL_EXISTS" = true ]; then
        echo "return 301 https://\$host\$request_uri;"
    else
        echo "# No SSL certificate found, not redirecting to HTTPS"
    fi)
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
    # Main site
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # PA division
    location /pa/ {
        alias /var/www/flahacalc/pa/;
        try_files \$uri \$uri/ /pa/index.html;
    }
    
    # EVAPOTRAN application
    location /EVAPOTRAN/ {
        alias /var/www/flahacalc/EVAPOTRAN/;
        try_files \$uri \$uri/ /EVAPOTRAN/index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

$(if [ "$SSL_EXISTS" = true ]; then
    echo "server {"
    echo "    listen 443 ssl;"
    echo "    server_name $DOMAIN www.$DOMAIN;"
    echo ""
    echo "    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo "    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
    echo "    ssl_protocols TLSv1.2 TLSv1.3;"
    echo "    ssl_prefer_server_ciphers on;"
    echo ""
    echo "    # Root directory"
    echo "    root /var/www/flahacalc;"
    echo "    index index.html;"
    echo ""
    echo "    # Main site"
    echo "    location / {"
    echo "        try_files \$uri \$uri/ /index.html;"
    echo "    }"
    echo ""
    echo "    # PA division"
    echo "    location /pa/ {"
    echo "        alias /var/www/flahacalc/pa/;"
    echo "        try_files \$uri \$uri/ /pa/index.html;"
    echo "    }"
    echo ""
    echo "    # EVAPOTRAN application"
    echo "    location /EVAPOTRAN/ {"
    echo "        alias /var/www/flahacalc/EVAPOTRAN/;"
    echo "        try_files \$uri \$uri/ /EVAPOTRAN/index.html;"
    echo "    }"
    echo ""
    echo "    # API proxy"
    echo "    location /api/ {"
    echo "        proxy_pass http://localhost:3000/api/;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_set_header Upgrade \$http_upgrade;"
    echo "        proxy_set_header Connection 'upgrade';"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_cache_bypass \$http_upgrade;"
    echo "    }"
    echo "}"
fi)
EOF

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "Reloading Nginx..."
    systemctl reload nginx
else
    echo "❌ Nginx configuration is invalid"
    exit 1
fi

echo "Nginx configuration fixed successfully!"

