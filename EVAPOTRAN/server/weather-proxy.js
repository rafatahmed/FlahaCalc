// Simple Express server to proxy weather API requests
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS with more specific options
app.use(cors({
  origin: '*', // In production, replace with your specific domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'success', message: 'Server is running correctly' });
});

// Environment variables
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
if (!WEATHER_API_KEY) {
  console.error('ERROR: WEATHER_API_KEY is not set in .env file');
}

// Proxy endpoint for current weather
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url = 'https://api.openweathermap.org/data/2.5/weather?units=metric&appid=' + WEATHER_API_KEY;
    
    // Add either coordinates or city name
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    } else if (q) {
      url += `&q=${encodeURIComponent(q)}`;
    } else {
      return res.status(400).json({ error: 'Missing location parameters' });
    }
    
    console.log(`Fetching weather data from: ${url.replace(WEATHER_API_KEY, 'API_KEY')}`);
    const response = await axios.get(url);
    console.log('Weather API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
      res.status(error.response.status).json({ 
        error: error.response.data.message || 'Failed to fetch weather data' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to fetch weather data' 
      });
    }
  }
});

// Proxy endpoint for forecast
app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }
    
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
    console.log(`Fetching forecast data from: ${url.replace(WEATHER_API_KEY, 'API_KEY')}`);
    const response = await axios.get(url);
    console.log('Forecast API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching forecast data:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
      res.status(error.response.status).json({ 
        error: error.response.data.message || 'Failed to fetch forecast data' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to fetch forecast data' 
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Weather proxy server running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
});

