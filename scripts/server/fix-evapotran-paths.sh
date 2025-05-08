#!/bin/bash

# Exit on error
set -e

echo "Fixing EVAPOTRAN paths for /pa/evapotran/ URL structure..."

# Update index.html with correct paths
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
        <div class="navigation">
            <a href="/pa/">Back to Precision Agriculture Division</a>
        </div>
    </div>
    
    <script src="js/script.js"></script>
    <script src="js/live-weather.js"></script>
</body>
</html>
EOF

# Update script.js to handle the /pa/evapotran/ path
cat > /var/www/flahacalc/EVAPOTRAN/js/script.js << 'EOF'
// Main application script
const hostname = window.location.hostname;
const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `http://${hostname}/api`;

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

# Update live-weather.js to handle the /pa/evapotran/ path
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
    : `http://${hostname}/api`;

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

echo "EVAPOTRAN paths have been fixed."