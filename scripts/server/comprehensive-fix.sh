#!/bin/bash

# Exit on error
set -e

echo "Applying comprehensive fix for API key and server issues..."

# 1. Fix server.js to properly load and use the API key
echo "Fixing server.js..."

# Backup the original file
cp /var/www/flahacalc/EVAPOTRAN/server/server.js /var/www/flahacalc/EVAPOTRAN/server/server.js.bak

# Create a new server.js with proper API key handling
cat > /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();
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

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());

// Add a test endpoint to verify server connectivity
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

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

// Proxy endpoint for 5-day forecast
app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing coordinates parameters' });
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

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`Weather endpoint: http://localhost:${PORT}/api/weather?q=London`);
});
EOF

# 2. Prompt for OpenWeatherMap API key
read -p "Enter your OpenWeatherMap API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "API key cannot be empty. Please get a valid API key from https://openweathermap.org/"
    exit 1
fi

# 3. Create or update .env file
echo "Creating/updating .env file..."
cat > /var/www/flahacalc/EVAPOTRAN/server/.env << EOF
# OpenWeatherMap API Key
WEATHER_API_KEY=$API_KEY

# Server port (default: 3000)
PORT=3000
EOF

# 4. Fix Nginx configuration
echo "Fixing Nginx configuration..."

# Backup the original file if it exists
if [ -f "/etc/nginx/sites-available/flahacalc" ]; then
    cp /etc/nginx/sites-available/flahacalc /etc/nginx/sites-available/flahacalc.bak
fi

# Create a new Nginx configuration
cat > /etc/nginx/sites-available/flahacalc << 'EOF'
server {
    listen 80;
    server_name flaha.org www.flaha.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name flaha.org www.flaha.org;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/flaha.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flaha.org/privkey.pem;
    
    root /var/www/flahacalc/EVAPOTRAN;
    index index.html;
    
    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Create a symbolic link if it doesn't exist
if [ ! -f "/etc/nginx/sites-enabled/flahacalc" ]; then
    ln -sf /etc/nginx/sites-available/flahacalc /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
nginx -t

# Reload Nginx if the test was successful
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "Nginx configuration updated and reloaded"
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# 5. Install dependencies
echo "Installing dependencies..."
cd /var/www/flahacalc/EVAPOTRAN/server
npm install dotenv axios express cors body-parser --save

# 6. Restart the server
echo "Restarting the server..."
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

# 7. Test the API key
echo "Testing API key..."
sleep 2  # Give the server a moment to start up
KEY=$API_KEY
RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$KEY")

if echo "$RESPONSE" | grep -q "Invalid API key"; then
    echo "WARNING: The API key appears to be invalid."
    echo "Response: $RESPONSE"
    echo "Please check your API key and try again."
elif echo "$RESPONSE" | grep -q "name"; then
    echo "SUCCESS: The API key is valid."
    
    # Test the server endpoint
    echo "Testing server endpoint..."
    RESPONSE=$(curl -s "http://localhost:3000/api/weather?q=London")
    
    if echo "$RESPONSE" | grep -q "name"; then
        echo "SUCCESS: Server endpoint is working correctly."
        echo "The weather API should now work correctly."
    else
        echo "WARNING: Server endpoint test failed."
        echo "Response: $RESPONSE"
        echo "Please check the server logs: pm2 logs flahacalc-server"
    fi
else
    echo "INCONCLUSIVE: Unexpected response from OpenWeatherMap."
    echo "Response: $RESPONSE"
    echo "Please test the weather functionality manually."
fi

echo "Comprehensive fix completed!"
