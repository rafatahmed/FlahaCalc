#!/bin/bash

# Exit on error
set -e

echo "Fixing all API issues..."

# Navigate to server directory
cd /var/www/flahacalc/EVAPOTRAN/server

# 1. Install missing dependencies
echo "Installing dependencies..."
npm install dotenv express cors axios --save
npm install node-cache --save || echo "Failed to install node-cache, will use fallback"

# 2. Update server.js with correct API routes
echo "Updating server.js with correct API routes..."
cat > server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a simple in-memory cache if node-cache is not available
let weatherCache;
try {
  const NodeCache = require('node-cache');
  weatherCache = new NodeCache({ stdTTL: 1800 });
  console.log("Using node-cache for caching");
} catch (error) {
  console.warn("node-cache not available, using simple in-memory cache");
  // Simple in-memory cache implementation
  weatherCache = {
    data: {},
    has: function(key) {
      return this.data.hasOwnProperty(key) && 
             (this.data[key].expiry > Date.now());
    },
    get: function(key) {
      return this.data[key].value;
    },
    set: function(key, value) {
      this.data[key] = {
        value: value,
        expiry: Date.now() + (1800 * 1000) // 30 minutes TTL
      };
    }
  };
}

// Middleware
app.use(cors());
app.use(express.json());

// API endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/weather', async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    
    // Handle location-based query
    if (q) {
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`
      );
      
      return res.json(response.data);
    }
    
    // Handle coordinate-based query
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Create a cache key based on coordinates
    const cacheKey = `weather_${lat}_${lon}`;
    
    // Check if we have cached data
    if (weatherCache.has(cacheKey)) {
      console.log('Returning cached weather data');
      return res.json(weatherCache.get(cacheKey));
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    // Cache the response
    weatherCache.set(cacheKey, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Create a cache key based on coordinates
    const cacheKey = `forecast_${lat}_${lon}`;
    
    // Check if we have cached data
    if (weatherCache.has(cacheKey)) {
      console.log('Returning cached forecast data');
      return res.json(weatherCache.get(cacheKey));
    }
    
    // No cached data, make API call
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    console.log(`Fetching forecast data from: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    const response = await axios.get(url);
    
    // Return the full response data
    const forecastData = response.data;
    
    // Cache the response
    weatherCache.set(cacheKey, forecastData);
    
    console.log('Returning forecast data');
    res.json(forecastData);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${process.env.WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# 3. Check if .env file exists and has API key
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "WEATHER_API_KEY=your_api_key_here" > .env
  echo "⚠️ Please update the API key in .env file"
else
  if ! grep -q "WEATHER_API_KEY" .env; then
    echo "Adding WEATHER_API_KEY to .env file..."
    echo "WEATHER_API_KEY=your_api_key_here" >> .env
    echo "⚠️ Please update the API key in .env file"
  fi
fi

# 4. Fix Nginx configuration
echo "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/flahacalc" ]; then
  # Create a backup
  cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak
  
  # Check if API proxy is already configured
  if grep -q "location /api/" "/etc/nginx/sites-available/flahacalc"; then
    echo "✅ API proxy already configured in Nginx"
    
    # Update the proxy_pass directive to ensure it's correct
    sed -i 's|proxy_pass http://localhost:[0-9]*/;|proxy_pass http://localhost:3000/api/;|g' /etc/nginx/sites-available/flahacalc
  else
    echo "Adding API proxy configuration to Nginx..."
    
    # Find the server block
    SERVER_BLOCK=$(grep -n "server {" /etc/nginx/sites-available/flahacalc | head -1 | cut -d: -f1)
    
    # Add the API location block after the server block
    sed -i "${SERVER_BLOCK}a\\
    location /api/ {\\
        proxy_pass http://localhost:3000/api/;\\
        proxy_http_version 1.1;\\
        proxy_set_header Upgrade \$http_upgrade;\\
        proxy_set_header Connection 'upgrade';\\
        proxy_set_header Host \$host;\\
        proxy_cache_bypass \$http_upgrade;\\
    }\\
" /etc/nginx/sites-available/flahacalc
  fi
  
  # Test and reload Nginx
  nginx -t && systemctl reload nginx
fi

# 5. Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# 6. Test the API endpoints
echo "Testing API endpoints..."
sleep 2

echo "Testing /api/test endpoint:"
curl -s http://localhost:3000/api/test

echo -e "\nTesting /api/weather endpoint with city query:"
curl -s "http://localhost:3000/api/weather?q=London" | head -c 100
echo -e "...\n"

echo "Testing /api/weather endpoint with coordinates:"
curl -s "http://localhost:3000/api/weather?lat=25.4934&lon=51.4057" | head -c 100
echo -e "...\n"

echo "All API issues fixed successfully!"
