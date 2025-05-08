#!/bin/bash
set -e

echo "Fixing all remaining issues..."

# 1. Fix dotenv module
echo "Installing missing dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install dotenv axios express cors --save

# 2. Fix Nginx configuration
echo "Fixing Nginx configuration..."
cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak
sed -i '/location \/pa\/ {/a \
    # EVAPOTRAN location\n    location /pa/evapotran/ {\n        alias /var/www/flahacalc/public/pa/evapotran/;\n        try_files $uri $uri/ =404;\n        index index.html;\n    }' /etc/nginx/sites-available/flahacalc

# 3. Fix Weather API endpoint
echo "Fixing weather API endpoint..."
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Support both query formats (city name or lat/lon)
    if (req.query.q) {
      // City name query
      const city = req.query.q;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      return res.json(response.data);
    } else if (req.query.lat && req.query.lon) {
      // Lat/lon query
      const { lat, lon } = req.query;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      return res.json(response.data);
    } else {
      return res.status(400).json({ 
        error: 'Missing parameters', 
        message: 'Please provide either city name (q) or coordinates (lat & lon)' 
      });
    }
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${process.env.WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# 4. Restart services
echo "Restarting services..."
nginx -t && systemctl reload nginx
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server
pm2 save

echo "All issues fixed! Testing endpoints..."
sleep 2

# Test API endpoints
echo "Testing API test endpoint..."
curl -s http://localhost:3000/api/test

echo -e "\nTesting weather API endpoint..."
curl -s "http://localhost:3000/api/weather?q=London"

echo -e "\nFix completed successfully!"