#!/bin/bash

echo "Fixing server dependencies and configuration..."

# 1. Navigate to server directory
cd /var/www/flahacalc/EVAPOTRAN/server

# 2. Check server.js for missing modules
echo "Checking server.js for required modules..."
REQUIRED_MODULES=$(grep -o "require(['\"][^'\"]*['\"])" server.js | sed "s/require(['\"]//g" | sed "s/['\"])//g" | grep -v "^\.")

echo "Required modules found:"
echo "$REQUIRED_MODULES"

# 3. Install all required modules
echo "Installing all required modules..."
for module in $REQUIRED_MODULES; do
    if [ "$module" != "path" ] && [ "$module" != "fs" ] && [ "$module" != "http" ] && [ "$module" != "https" ] && [ "$module" != "url" ] && [ "$module" != "querystring" ]; then
        echo "Installing $module..."
        npm install $module --save
    fi
done

# 4. Create a backup of server.js
cp server.js server.js.bak

# 5. Create a new minimal server.js file that will work
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
    const { q, lat, lon } = req.query;
    let url;
    
    if (q) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${WEATHER_API_KEY}&units=metric`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
    } else {
      return res.status(400).json({ error: 'Missing location parameters' });
    }
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${WEATHER_API_KEY ? 'Yes' : 'No'}`);
});
EOF

# 6. Create or update .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
PORT=3000
WEATHER_API_KEY=your_openweathermap_api_key
EOF
    echo "⚠️ Created .env file with placeholder API key. Please update it with your actual API key."
else
    echo "✅ .env file already exists"
fi

# 7. Restart the server
echo "Restarting the server..."
cd /var/www/flahacalc
pm2 restart flahacalc-server || pm2 start EVAPOTRAN/server/server.js --name flahacalc-server
pm2 save

# 8. Test the API endpoint
echo "Testing API endpoint..."
sleep 2  # Give the server a moment to start
API_RESPONSE=$(curl -s http://localhost:3000/api/test)
if [[ "$API_RESPONSE" == *"status"*"ok"* ]]; then
    echo "✅ API endpoint is working"
else
    echo "❌ API endpoint is still not working"
    echo "Response: $API_RESPONSE"
    echo "Checking server logs..."
    pm2 logs flahacalc-server --lines 10
fi

echo "Fix completed. Please check if the site is working now."