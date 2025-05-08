#!/bin/bash

# Exit on error
set -e

echo "Hardening server security..."

# 1. Update Nginx configuration with security improvements
echo "Updating Nginx configuration with security improvements..."
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
# Security headers
map $http_user_agent $limit_bots {
    default 0;
    ~*(bot|spider|crawler) 1;
}

# Block access to sensitive files
map $request_uri $block_sensitive {
    default 0;
    ~*(/\.git|/\.env|/wp-|/admin|/login) 1;
}

server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS if SSL is configured
    # Uncomment the following line if SSL is set up
    # return 301 https://$host$request_uri;
    
    # Root directory
    root /var/www/flahacalc;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.openweathermap.org;" always;
    
    # Block sensitive files
    if ($block_sensitive) {
        return 404;
    }
    
    # Rate limiting for bots
    if ($limit_bots) {
        limit_req zone=bots burst=5;
    }
    
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
        
        # Limit request size
        client_max_body_size 1m;
    }
    
    # Default location
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Logging
    access_log /var/log/nginx/flaha.access.log;
    error_log /var/log/nginx/flaha.error.log;
}
EOF

# Add rate limiting configuration to nginx.conf
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    echo "Adding rate limiting configuration..."
    sed -i '/http {/a \    # Rate limiting\n    limit_req_zone $binary_remote_addr zone=bots:10m rate=1r/s;\n    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;' /etc/nginx/nginx.conf
fi

# 2. Secure server.js with input validation
echo "Securing server.js with input validation..."
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// Weather API endpoint with input validation
app.get('/api/weather', async (req, res) => {
  try {
    const location = req.query.q;
    
    // Input validation
    if (!location) {
      return res.status(400).json({ error: 'Location parameter (q) is required' });
    }
    
    if (typeof location !== 'string' || location.length > 100) {
      return res.status(400).json({ error: 'Invalid location parameter' });
    }
    
    // Sanitize input - only allow alphanumeric, spaces, commas, and periods
    if (!/^[a-zA-Z0-9\s,.]+$/.test(location)) {
      return res.status(400).json({ error: 'Location contains invalid characters' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key is not configured' });
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
        { timeout: 5000 } // 5 second timeout
      );
      res.json(response.data);
    } catch (apiError) {
      console.error('OpenWeatherMap API error:', apiError.message);
      if (apiError.response && apiError.response.data) {
        return res.status(apiError.response.status).json(apiError.response.data);
      }
      res.status(500).json({ error: apiError.message });
    }
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${process.env.WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# Install express-rate-limit
echo "Installing express-rate-limit..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install express-rate-limit --save

# 3. Create a robots.txt file to discourage crawlers
echo "Creating robots.txt file..."
cat > /var/www/flahacalc/robots.txt << 'EOF'
User-agent: *
Disallow: /api/
Disallow: /.git/
Disallow: /.env
Disallow: /server/
EOF

# 4. Set proper file permissions
echo "Setting secure file permissions..."
find /var/www/flahacalc -type d -exec chmod 755 {} \;
find /var/www/flahacalc -type f -exec chmod 644 {} \;
chmod 600 /var/www/flahacalc/EVAPOTRAN/server/.env

# 5. Restart services
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting Nginx..."
    systemctl restart nginx
    
    echo "Restarting Node.js server..."
    pm2 restart flahacalc-server
    pm2 save
    
    echo "Security hardening completed successfully!"
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi