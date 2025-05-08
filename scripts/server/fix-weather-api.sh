#!/bin/bash
set -e

echo "Fixing weather API endpoint..."

# Update server.js to handle city parameter
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

# Restart the server
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server
pm2 save

echo "Weather API endpoint fixed!"