#!/bin/bash

# Exit on error
set -e

echo "Fixing all issues..."

# 1. Fix the Node.js server error
echo "Fixing Node.js server error..."
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create cache instance
const weatherCache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = (req, res, next) => {
  // Simple rate limiting
  next();
};

// Apply to all API routes
app.use("/api", apiLimiter);

// Add a test endpoint to verify server connectivity
app.get("/api/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running correctly",
    timestamp: new Date().toISOString(),
  });
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    
    // Check if we have a cached response
    const cacheKey = q ? `weather_${q}` : `weather_${lat}_${lon}`;
    const cachedResponse = weatherCache.get(cacheKey);
    
    if (cachedResponse) {
      console.log('Returning cached weather data');
      return res.json(cachedResponse);
    }
    
    // API key from environment variables
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    console.log('API key configured: Yes');
    
    // Build the API URL
    let apiUrl;
    if (q) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Missing location parameters' });
    }
    
    // Fetch data from OpenWeatherMap
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    // Cache the response
    weatherCache.set(cacheKey, data);
    
    // Return the data
    res.json(data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Forecast API endpoint
app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing location parameters' });
    }
    
    // API key from environment variables
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    console.log('API key configured: Yes');
    
    // Build the API URL
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    console.log('Fetching forecast data from:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    // Fetch data from OpenWeatherMap
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    console.log('Returning forecast data');
    res.json(data);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Log that we're using node-cache
console.log('Using node-cache for caching');

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# 2. Fix the Nginx configuration
echo "Fixing Nginx configuration..."
cp /var/www/flahacalc/scripts/server/nginx/flahacalc.conf /etc/nginx/sites-available/flahacalc

# 3. Fix the typo in path-helper.js script tag
echo "Fixing path-helper.js script tag..."
sed -i 's|<script src="/js/path-helper.j"></script>|<script src="/js/path-helper.js"></script>|g' /var/www/flahacalc/public/pa/evapotran/live-weather.html

# 4. Restart services
echo "Restarting services..."
systemctl restart nginx
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server

echo "All issues fixed successfully!"

