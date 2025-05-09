#!/bin/bash

echo "Fixing security headers configuration..."

# Update Nginx configuration
echo "Updating Nginx configuration with proper security headers..."
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com chrome-extension:; img-src 'self' data: https://via.placeholder.com; connect-src 'self' https://api.openweathermap.org https://www.google-analytics.com;" always;
    
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

# Create a symbolic link if it doesn't exist
if [ ! -f /etc/nginx/sites-enabled/flahacalc ]; then
    ln -s /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
fi

# Remove security meta tags from HTML files
echo "Removing security meta tags from HTML files..."
cd /var/www/flahacalc/EVAPOTRAN
for file in *.html; do
    # Remove Content-Security-Policy meta tag
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' "$file"
    # Remove X-Content-Type-Options meta tag
    sed -i '/<meta http-equiv="X-Content-Type-Options"/d' "$file"
    # Remove X-Frame-Options meta tag
    sed -i '/<meta http-equiv="X-Frame-Options"/d' "$file"
    # Remove X-XSS-Protection meta tag
    sed -i '/<meta http-equiv="X-XSS-Protection"/d' "$file"
    # Remove Referrer-Policy meta tag
    sed -i '/<meta http-equiv="Referrer-Policy"/d' "$file"
    # Remove Permissions-Policy meta tag
    sed -i '/<meta http-equiv="Permissions-Policy"/d' "$file"
done

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

echo "Security headers fix completed. Please check the website now."

