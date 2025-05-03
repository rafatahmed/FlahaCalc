const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { router: authRoutes, auth } = require('./auth');

// Load environment variables
require('dotenv').config();
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  console.error('ERROR: WEATHER_API_KEY is not set in .env file');
  console.error('Please create a .env file in the server directory with your OpenWeatherMap API key:');
  console.error('WEATHER_API_KEY=your_api_key_here');
}

// Log the API key status (but not the key itself for security)
console.log('WEATHER_API_KEY status:', WEATHER_API_KEY ? 'Set' : 'Not set');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // Allow all origins in development
    if(process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
    if(allowedOrigins.indexOf(origin) !== -1 || !origin) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Add a test endpoint to verify server connectivity
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// Add a comprehensive health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    env: process.env.NODE_ENV
  };
  
  res.json(health);
});

// Proxy endpoint for current weather
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, q } = req.query;
    let url;
    
    console.log(`Fetching weather data from: https://api.openweathermap.org/data/2.5/weather?units=metric&appid=[MASKED]&${q ? 'q=' + q : `lat=${lat}&lon=${lon}`}`);
    
    if (q) {
      url = `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${WEATHER_API_KEY}&q=${q}`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${WEATHER_API_KEY}&lat=${lat}&lon=${lon}`;
    } else {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch weather data' });
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

// ET0 calculation endpoint
app.post('/api/calculate/et0', (req, res) => {
  try {
    console.log('Received calculation request:', req.body);
    
    const {
      temperature,
      windSpeed,
      relativeHumidity,
      elevation,
      pressure,
      latitude,
      dayOfYear,
      sunshineDuration
    } = req.body;
    
    // Validate input data
    if (temperature === undefined || windSpeed === undefined || 
        relativeHumidity === undefined || elevation === undefined || 
        latitude === undefined || dayOfYear === undefined || 
        sunshineDuration === undefined) {
      console.error('Missing parameters:', req.body);
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: req.body
      });
    }
    
    // Parse values to ensure they're numbers
    const temp = parseFloat(temperature);
    const wind = parseFloat(windSpeed);
    const rh = parseFloat(relativeHumidity);
    const elev = parseFloat(elevation);
    const press = pressure ? parseFloat(pressure) : null;
    const lat = parseFloat(latitude);
    const day = parseFloat(dayOfYear);
    const sunshine = parseFloat(sunshineDuration);
    
    // Check for NaN values
    if (isNaN(temp) || isNaN(wind) || isNaN(rh) || isNaN(elev) || 
        isNaN(lat) || isNaN(day) || isNaN(sunshine)) {
      console.error('Invalid numeric parameters:', { temp, wind, rh, elev, lat, day, sunshine });
      return res.status(400).json({ 
        error: 'Invalid numeric parameters',
        received: { temp, wind, rh, elev, lat, day, sunshine }
      });
    }
    
    // Calculate atmospheric pressure if not provided
    const atmosphericPressure = press || calculateAtmosphericPressure(elev);
    
    // Calculate ET0 using the FAO Penman-Monteith equation
    const et0 = calculateET0(
      temp,
      wind,
      rh,
      atmosphericPressure,
      lat,
      day,
      sunshine
    );
    
    // Return the result
    res.json({
      et0: et0,
      timestamp: new Date().toISOString(),
      units: 'mm/day'
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ 
      error: 'Calculation failed: ' + error.message
    });
  }
});

// Helper function to calculate atmospheric pressure
function calculateAtmosphericPressure(elevation) {
  return 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
}

// ET0 calculation function
function calculateET0(temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration) {
  // Convert latitude from degrees to radians
  const latRad = (Math.PI / 180) * lat;
  
  // Calculate saturation vapor pressure
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  
  // Calculate actual vapor pressure
  const ea = (rh / 100) * es;
  
  // Calculate slope of vapor pressure curve
  const delta = (4098 * (0.6108 * Math.exp((17.27 * temp) / (temp + 237.3)))) / Math.pow(temp + 237.3, 2);
  
  // Calculate psychrometric constant
  const gamma = 0.000665 * pressure;
  
  // Calculate extraterrestrial radiation
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
  const delta_solar = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
  const ws = Math.acos(-Math.tan(latRad) * Math.tan(delta_solar));
  const Ra = (24 * 60 / Math.PI) * 0.082 * dr * (ws * Math.sin(latRad) * Math.sin(delta_solar) + Math.cos(latRad) * Math.cos(delta_solar) * Math.sin(ws));
  
  // Calculate solar radiation
  const n_N = sunshineDuration / (24 / Math.PI * ws);
  const Rs = (0.25 + 0.5 * n_N) * Ra;
  
  // Calculate net shortwave radiation
  const Rns = 0.77 * Rs;
  
  // Calculate clear-sky solar radiation
  const Rso = (0.75 + 2e-5 * elevation) * Ra;
  
  // Calculate net longwave radiation
  const Rnl = 4.903e-9 * Math.pow(temp + 273.16, 4) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Rso - 0.35);
  
  // Calculate net radiation
  const Rn = Rns - Rnl;
  
  // Calculate soil heat flux (assumed to be 0 for daily calculations)
  const G = 0;
  
  // Calculate ET0
  const numerator = 0.408 * delta * (Rn - G) + gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * windSpeed);
  
  return numerator / denominator;
}

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Catch-all route to serve the main index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
  console.log(`Weather API available at: http://localhost:${PORT}/api/weather`);
  console.log(`Auth endpoints available at: http://localhost:${PORT}/api/auth`);
});









