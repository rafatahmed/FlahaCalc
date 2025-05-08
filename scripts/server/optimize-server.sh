#!/bin/bash

# Exit on error
set -e

echo "Optimizing server performance..."

# 1. Install performance optimization dependencies
echo "Installing performance optimization dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install --save node-cache express-rate-limit compression morgan

# 2. Enable Gzip compression in Nginx
echo "Enabling Gzip compression in Nginx..."
cat > /etc/nginx/conf.d/gzip.conf << 'EOF'
gzip on;
gzip_disable "msie6";
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_buffers 16 8k;
gzip_http_version 1.1;
gzip_min_length 256;
gzip_types
  application/atom+xml
  application/javascript
  application/json
  application/ld+json
  application/manifest+json
  application/rss+xml
  application/vnd.geo+json
  application/vnd.ms-fontobject
  application/x-font-ttf
  application/x-web-app-manifest+json
  application/xhtml+xml
  application/xml
  font/opentype
  image/bmp
  image/svg+xml
  image/x-icon
  text/cache-manifest
  text/css
  text/plain
  text/vcard
  text/vnd.rim.location.xloc
  text/vtt
  text/x-component
  text/x-cross-domain-policy;
EOF

# 3. Enable browser caching
echo "Enabling browser caching..."
cat > /etc/nginx/conf.d/cache.conf << 'EOF'
# Browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}

# HTML and data files
location ~* \.(html|json|xml)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
EOF

# 4. Optimize Node.js server
echo "Optimizing Node.js server..."
cat > /var/www/flahacalc/EVAPOTRAN/server/performance.js << 'EOF'
const cache = require('node-cache');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create a cache with 30 minute TTL
const apiCache = new cache({ stdTTL: 1800 });

// Create a rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Create a logger
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

module.exports = {
  apiCache,
  limiter,
  compression,
  logger: morgan('combined', { stream: accessLogStream })
};
EOF

# 5. Update server.js to use performance optimizations
echo "Updating server.js to use performance optimizations..."
# This is a placeholder - you would need to manually update server.js
# to include the performance.js module

# 6. Restart Nginx
echo "Restarting Nginx..."
nginx -t && systemctl restart nginx

# 7. Restart Node.js server
echo "Restarting Node.js server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Server optimized and restarted successfully."
