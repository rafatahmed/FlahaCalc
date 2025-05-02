#!/bin/bash

echo "Fixing SSL configuration and routing issues..."

# Check SSL certificates
echo "Checking SSL certificates..."
if [ ! -f /etc/letsencrypt/live/flaha.org/fullchain.pem ] || [ ! -f /etc/letsencrypt/live/flaha.org/privkey.pem ]; then
    echo "SSL certificates not found. Renewing with Certbot..."
    certbot renew --force-renewal
fi

# Update Nginx configuration
echo "Updating Nginx configuration..."
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
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    
    # Improved SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
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

# Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    systemctl reload nginx
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

echo "Checking Node.js server status..."
if ! pm2 status | grep -q "flahacalc-server"; then
    echo "Starting Node.js server..."
    cd /var/www/flahacalc/EVAPOTRAN/server
    pm2 start server.js --name flahacalc-server
    pm2 save
else
    echo "Restarting Node.js server..."
    pm2 restart flahacalc-server
fi

echo "Fix completed. Please check the website now."