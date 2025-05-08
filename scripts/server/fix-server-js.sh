#!/bin/bash

# Exit on error
set -e

echo "Fixing server.js to use real OpenWeatherMap API..."

# Create a completely new server.js file
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${process.env.WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# Make sure axios is installed
echo "Installing required dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install express cors axios dotenv --save

# Restart the server
echo "Restarting Node.js server..."
pm2 restart flahacalc-server
pm2 save

echo "Server.js has been fixed and restarted."