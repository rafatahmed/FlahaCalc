require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const NodeCache = require('node-cache');
const weatherCache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Using node-cache for caching');

// Middleware
app.use(cors());
app.use(express.json());

// IMPORTANT: The API routes need to match what the client is expecting
// The client is making requests to /api/test and /api/weather

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
    const { q, lat, lon } = req.query;
    
    // Check if we have a cached response
    const cacheKey = q ? `weather_${q}` : `weather_${lat}_${lon}`;
    const cachedResponse = weatherCache.get(cacheKey);
    
    if (cachedResponse) {
      console.log('Returning cached weather data');
      return res.json(cachedResponse);
    }
    
    // Handle location-based query
    if (q) {
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`
      );
      
      // Store response in cache before returning
      weatherCache.set(cacheKey, response.data);
      
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

// Forecast API endpoint
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
