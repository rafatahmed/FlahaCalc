#!/bin/bash

# Exit on error
set -e

echo "Fixing EVAPOTRAN application issues..."

# Ensure the EVAPOTRAN directory exists
mkdir -p /var/www/flahacalc/EVAPOTRAN

# Create or update index.html for EVAPOTRAN
echo "Creating basic index.html for EVAPOTRAN..."
cat > /var/www/flahacalc/EVAPOTRAN/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EVAPOTRAN Calculator</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <h1>EVAPOTRAN Calculator</h1>
        <div id="app">
            <p>Loading application...</p>
        </div>
    </div>
    
    <script src="js/script.js"></script>
    <script src="js/live-weather.js"></script>
</body>
</html>
EOF

# Create CSS directory and basic styles
echo "Creating CSS files..."
mkdir -p /var/www/flahacalc/EVAPOTRAN/css
cat > /var/www/flahacalc/EVAPOTRAN/css/styles.css << 'EOF'
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
}
.container {
    max-width: 1200px;
    margin: 0 auto;
}
h1 {
    color: #2c3e50;
}
#app {
    margin-top: 20px;
}
EOF

# Create JS directory and basic scripts
echo "Creating JS files..."
mkdir -p /var/www/flahacalc/EVAPOTRAN/js

# Create script.js with dynamic API URL
cat > /var/www/flahacalc/EVAPOTRAN/js/script.js << 'EOF'
// Main application script
const hostname = window.location.hostname;
const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${hostname}/api`;

console.log("EVAPOTRAN Calculator initializing...");
console.log("Using API_BASE_URL:", API_BASE_URL);

// Test server connection
async function testServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`, { 
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log("Server connection successful");
            return true;
        } else {
            console.error("Server connection failed:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Server connection error:", error);
        return false;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    const appElement = document.getElementById('app');
    
    // Check server connection
    const serverConnected = await testServerConnection();
    
    if (serverConnected) {
        appElement.innerHTML = '<p>EVAPOTRAN Calculator is ready to use.</p>';
    } else {
        appElement.innerHTML = '<p>Error: Cannot connect to the server. Please try again later.</p>';
    }
});
EOF

# Create live-weather.js with dynamic API URL
cat > /var/www/flahacalc/EVAPOTRAN/js/live-weather.js << 'EOF'
/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 */

// API configuration
const hostname = window.location.hostname;
const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${hostname}/api`;

console.log("Weather module initialized");
console.log("Using API_BASE_URL:", API_BASE_URL);

// Function to fetch weather data
async function fetchWeatherData(location) {
    try {
        const response = await fetch(`${API_BASE_URL}/weather?q=${location}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error("Weather data fetch failed:", response.status);
            return null;
        }
    } catch (error) {
        console.error("Weather data fetch error:", error);
        return null;
    }
}
EOF

# Ensure server.js has the weather endpoint
echo "Checking server.js for weather endpoint..."
if ! grep -q "app.get('/api/weather'" /var/www/flahacalc/EVAPOTRAN/server/server.js; then
    echo "Adding weather endpoint to server.js..."
    cat >> /var/www/flahacalc/EVAPOTRAN/server/server.js << 'EOF'

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const location = req.query.q;
    if (!location) {
      return res.status(400).json({ error: 'Location parameter (q) is required' });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Invalid API key' });
    }
    
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`);
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
EOF

    # Make sure axios is installed
    echo "Installing axios for weather API..."
    cd /var/www/flahacalc/EVAPOTRAN/server
    npm install axios --save
    cd /var/www/flahacalc
fi

# Restart the Node.js server
echo "Restarting Node.js server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "EVAPOTRAN application fix completed."
echo "Please check the application now."