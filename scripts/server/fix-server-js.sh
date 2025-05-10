#!/bin/bash

# Exit on error
set -e

echo "Fixing server.js file..."

# Create a backup of the original file
cp /var/www/flahacalc/EVAPOTRAN/server/server.js /var/www/flahacalc/EVAPOTRAN/server/server.js.bak

# Fix the duplicate cacheKey declaration
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Initialize cache
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes
console.log("Using node-cache for caching");

// Middleware
app.use(cors());
app.use(express.json());

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
    // Get query parameters
    const { lat, lon, q } = req.query;
    
    // Check if we have coordinates or city name
    if (!lat || !lon) {
      if (!q) {
        return res.status(400).json({ error: 'Missing required parameters. Please provide lat and lon, or q (city name)' });
      }
      
      // City name query
      const cacheKey = `weather_city_${q}`;
      
      // Check cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`Returning cached data for city: ${q}`);
        return res.json(cachedData);
      }
      
      // Fetch from OpenWeatherMap API
      console.log(`Fetching weather data for city: ${q}`);
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      // Cache the response
      cache.set(cacheKey, response.data);
      
      return res.json(response.data);
    }
    
    // Coordinates query
    const weatherCacheKey = `weather_${lat}_${lon}`;
    
    // Check cache first
    const cachedWeatherData = cache.get(weatherCacheKey);
    if (cachedWeatherData) {
      console.log(`Returning cached weather data for coordinates: ${lat}, ${lon}`);
      return res.json(cachedWeatherData);
    }
    
    // Fetch from OpenWeatherMap API
    console.log(`Fetching weather data from: https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=API_KEY_HIDDEN&units=metric`);
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    // Cache the response
    cache.set(weatherCacheKey, weatherResponse.data);
    
    return res.json(weatherResponse.data);
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
      return res.status(400).json({ error: 'Missing required parameters: lat, lon' });
    }
    
    const forecastCacheKey = `forecast_${lat}_${lon}`;
    
    // Check cache first
    const cachedForecastData = cache.get(forecastCacheKey);
    if (cachedForecastData) {
      console.log(`Returning cached forecast data for: ${lat}, ${lon}`);
      return res.json(cachedForecastData);
    }
    
    // Fetch from OpenWeatherMap API
    console.log(`Fetching forecast data from: https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=API_KEY_HIDDEN&units=metric`);
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    // Cache the response
    cache.set(forecastCacheKey, forecastResponse.data);
    
    console.log("Returning forecast data");
    return res.json(forecastResponse.data);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${process.env.WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# Make sure all dependencies are installed
echo "Installing required dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install express cors axios dotenv node-cache --save

# Restart the server
echo "Restarting Node.js server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "Server.js has been fixed and restarted."

