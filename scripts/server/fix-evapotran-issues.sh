#!/bin/bash

# Exit on error
set -e

echo "Fixing remaining EVAPOTRAN issues..."

# 1. Fix the API test endpoint message format
echo "Fixing API test endpoint..."
cat > /tmp/test-endpoint.js << 'EOF'
// Add a test endpoint to verify server connectivity
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});
EOF

# Replace the test endpoint in server.js
SERVER_JS="/var/www/flahacalc/EVAPOTRAN/server/server.js"
if grep -q "app.get('/api/test'" $SERVER_JS; then
    sed -i '/app.get('\''\/api\/test'\''/,/});/c\'"$(cat /tmp/test-endpoint.js)" $SERVER_JS
else
    echo "Test endpoint not found, adding it..."
    cat /tmp/test-endpoint.js >> $SERVER_JS
fi

# 2. Fix the Weather API to use real OpenWeatherMap API
echo "Fixing Weather API endpoint..."
cat > /tmp/weather-endpoint.js << 'EOF'
// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const location = req.query.q;
    if (!location) {
      return res.status(400).json({ error: 'Location parameter (q) is required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key is not configured' });
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
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
    res.status(500).json({ error: error.message });
  }
});
EOF

# Replace the weather endpoint in server.js
if grep -q "app.get('/api/weather'" $SERVER_JS; then
    sed -i '/app.get('\''\/api\/weather'\''/,/});/c\'"$(cat /tmp/weather-endpoint.js)" $SERVER_JS
else
    echo "Weather endpoint not found, adding it..."
    cat /tmp/weather-endpoint.js >> $SERVER_JS
fi

# Make sure axios is installed
echo "Ensuring axios is installed..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install axios --save

# 3. Create .env file for API key
echo "Creating .env file for API key..."
if [ ! -f "/var/www/flahacalc/EVAPOTRAN/server/.env" ]; then
    echo "# OpenWeatherMap API Key - Replace with your actual API key" > /var/www/flahacalc/EVAPOTRAN/server/.env
    echo "WEATHER_API_KEY=your_api_key_here" >> /var/www/flahacalc/EVAPOTRAN/server/.env
    echo "PORT=3000" >> /var/www/flahacalc/EVAPOTRAN/server/.env
    echo ".env file created. Please update with your actual API key."
fi

# 4. Fix Nginx configuration for EVAPOTRAN
echo "Fixing Nginx configuration for EVAPOTRAN..."
NGINX_CONF="/etc/nginx/sites-available/flahacalc"

# Check if EVAPOTRAN location is already configured
if ! grep -q "location /EVAPOTRAN" $NGINX_CONF; then
    # Create a backup
    cp $NGINX_CONF ${NGINX_CONF}.bak
    
    # Add EVAPOTRAN location to the server block
    sed -i '/server {/,/}/s|location / {|location /EVAPOTRAN {\n        alias /var/www/flahacalc/EVAPOTRAN;\n        try_files $uri $uri/ /EVAPOTRAN/index.html;\n    }\n\n    location / {|' $NGINX_CONF
fi

# Make sure API proxy is correctly configured
if ! grep -q "location /api/" $NGINX_CONF; then
    # Add API proxy configuration
    sed -i '/server {/,/}/s|location / {|location /api/ {\n        proxy_pass http://localhost:3000/api/;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection '\''upgrade'\'';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n\n    location / {|' $NGINX_CONF
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    systemctl reload nginx
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# 5. Restart Node.js server
echo "Restarting Node.js server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server
pm2 save

echo "All EVAPOTRAN issues fixed!"
echo "NOTE: You need to update the OpenWeatherMap API key in /var/www/flahacalc/EVAPOTRAN/server/.env"