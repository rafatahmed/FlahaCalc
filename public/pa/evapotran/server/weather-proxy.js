const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());

app.use('/api', calculationService);

// Add a test endpoint to verify server connectivity
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
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
    
    // Validate input ranges
    if (temp < -50 || temp > 60) {
      return res.status(400).json({ error: `Temperature out of range: ${temp}°C` });
    }
    
    if (wind < 0) {
      return res.status(400).json({ error: `Wind speed cannot be negative: ${wind} m/s` });
    }
    
    if (rh < 0 || rh > 100) {
      return res.status(400).json({ error: `Relative humidity must be between 0-100%: ${rh}%` });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: `Latitude must be between -90° and 90°: ${lat}°` });
    }
    
    if (day < 1 || day > 366) {
      return res.status(400).json({ error: `Day of year must be between 1-366: ${day}` });
    }
    
    if (sunshine < 0 || sunshine > 24) {
      return res.status(400).json({ error: `Sunshine duration must be between 0-24 hours: ${sunshine}h` });
    }
    
    // Calculate atmospheric pressure if not provided
    const atmosphericPressure = press || calculateAtmosphericPressure(elev);
    
    console.log('Calculating with parameters:', {
      temp, wind, rh, atmosphericPressure, lat, day, sunshine
    });
    
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
    
    console.log('Calculation result:', et0);
    
    // Return the result
    res.json({
      et0: et0,
      timestamp: new Date().toISOString(),
      units: 'mm/day'
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ 
      error: 'Calculation failed: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to calculate atmospheric pressure
function calculateAtmosphericPressure(elevation) {
  return 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
}

// ET0 calculation function with additional error checking and debugging
function calculateET0(temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration) {
  try {
    console.log('Starting calculation with:', {
      temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration
    });
    
    // Convert latitude to radians
    const latRad = (lat * Math.PI) / 180;
    console.log('Latitude in radians:', latRad);
    
    // Calculate saturation vapor pressure
    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    console.log('Saturation vapor pressure (es):', es);
    
    // Calculate actual vapor pressure
    const ea = (es * rh) / 100;
    console.log('Actual vapor pressure (ea):', ea);
    
    // Calculate slope of vapor pressure curve
    const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
    console.log('Slope of vapor pressure curve (delta):', delta);
    
    // Calculate psychrometric constant
    const gamma = 0.000665 * pressure;
    console.log('Psychrometric constant (gamma):', gamma);
    
    // Calculate extraterrestrial radiation
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
    console.log('Inverse relative distance Earth-Sun (dr):', dr);
    
    const delta_solar = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
    console.log('Solar declination (delta_solar):', delta_solar);
    
    // Check for potential division by zero or invalid math operations
    const tanLatTanDelta = Math.tan(latRad) * Math.tan(delta_solar);
    console.log('tan(lat) * tan(delta_solar):', tanLatTanDelta);
    
    if (Math.abs(tanLatTanDelta) > 1) {
      throw new Error(`Invalid latitude/day combination: Math domain error. Value: ${tanLatTanDelta}`);
    }
    
    const ws = Math.acos(-tanLatTanDelta);
    console.log('Sunset hour angle (ws):', ws);
    
    const Ra = (24 * 60 / Math.PI) * 0.082 * dr * (
      ws * Math.sin(latRad) * Math.sin(delta_solar) + 
      Math.cos(latRad) * Math.cos(delta_solar) * Math.sin(ws)
    );
    console.log('Extraterrestrial radiation (Ra):', Ra);
    
    // Calculate day length
    const dayLength = 2 * ws / (15 * Math.PI / 180); // Day length in hours
    console.log('Day length (hours):', dayLength);
    
    if (dayLength <= 0) {
      throw new Error(`Invalid day length calculation: ${dayLength}`);
    }
    
    // Calculate solar radiation
    const n_N = Math.min(sunshineDuration / dayLength, 1);
    console.log('Relative sunshine duration (n/N):', n_N);
    
    const Rs = (0.25 + 0.5 * n_N) * Ra;
    console.log('Solar radiation (Rs):', Rs);
    
    // Calculate clear-sky solar radiation
    const elevation = pressure ? (101.3 / pressure) ** (1/5.26) * 293 / 0.0065 : 0;
    const Rso = (0.75 + 2e-5 * elevation) * Ra;
    console.log('Clear-sky solar radiation (Rso):', Rso);
    
    // Calculate net shortwave radiation
    const Rns = 0.77 * Rs;
    console.log('Net shortwave radiation (Rns):', Rns);
    
    // Calculate net longwave radiation
    const Rnl = 4.903e-9 * Math.pow((temp + 273.16), 4) * 
                (0.34 - 0.14 * Math.sqrt(ea)) * 
                (1.35 * (Rs / Rso) - 0.35);
    console.log('Net longwave radiation (Rnl):', Rnl);
    
    // Calculate net radiation
    const Rn = Rns - Rnl;
    console.log('Net radiation (Rn):', Rn);
    
    // Calculate soil heat flux (assumed to be 0 for daily calculations)
    const G = 0;
    
    // Calculate ET0
    const numerator = 0.408 * delta * (Rn - G) + 
                      gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
    console.log('Numerator:', numerator);
    
    const denominator = delta + gamma * (1 + 0.34 * windSpeed);
    console.log('Denominator:', denominator);
    
    if (Math.abs(denominator) < 0.0001) {
      throw new Error(`Division by near-zero in ET0 calculation: ${denominator}`);
    }
    
    const result = numerator / denominator;
    console.log('Final ET0 result:', result);
    
    // Check for reasonable result
    if (isNaN(result)) {
      throw new Error('Calculation resulted in NaN');
    }
    
    if (!isFinite(result)) {
      throw new Error('Calculation resulted in Infinity');
    }
    
    if (result < -10 || result > 15) {
      throw new Error(`ET0 result outside reasonable range: ${result}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error in ET0 calculation function:', error);
    throw new Error(`ET0 calculation error: ${error.message}`);
  }
}

app.listen(PORT, () => {
  console.log(`Weather proxy server running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
});








