#!/bin/bash

# Exit on error
set -e

echo "Fixing API URLs in local development files..."

# 1. Fix live-weather.js
echo "Fixing live-weather.js..."
# Create a backup
cp EVAPOTRAN/js/live-weather.js EVAPOTRAN/js/live-weather.js.bak

# Update the file with correct API URL handling
cat > EVAPOTRAN/js/live-weather.js << 'WEATHERJS'
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

console.log("Using API_BASE_URL:", API_BASE_URL);
WEATHERJS

# Append the rest of the original file (excluding the first few lines we just replaced)
tail -n +10 EVAPOTRAN/js/live-weather.js.bak >> EVAPOTRAN/js/live-weather.js

# 2. Fix script.js
echo "Fixing script.js..."
# Create a backup
cp EVAPOTRAN/js/script.js EVAPOTRAN/js/script.js.bak

# Find and replace the hardcoded localhost URL in the server warning
sed -i 's|http://localhost:3000|${API_BASE_URL}|g' EVAPOTRAN/js/script.js

# Update the testServerConnection function to use dynamic API URL
cat > /tmp/testServerConnection.js << 'EOF'
// Test server connection
async function testServerConnection() {
    // Use the same API_BASE_URL logic as in live-weather.js
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? "http://localhost:3000/api" 
        : `https://${hostname}/api`;
    
    console.log("Using API URL:", API_BASE_URL);
    
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
        console.error("Server connection test failed:", error);
        return false;
    }
}
EOF

# Replace the testServerConnection function in script.js
sed -i '/async function testServerConnection/,/^}/c\'"$(cat /tmp/testServerConnection.js)" EVAPOTRAN/js/script.js

# Update the DOMContentLoaded event handler
cat > /tmp/domContentLoaded.js << 'EOF'
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Calculator page loaded");
    
    // Test server connection
    const serverAvailable = await testServerConnection();
    if (!serverAvailable) {
        // Get the dynamic API URL
        const hostname = window.location.hostname;
        const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
            ? "http://localhost:3000/api" 
            : `https://${hostname}/api`;
            
        // Show warning about server connection with correct URL
        const warningEl = document.createElement("div");
        warningEl.className = "server-warning";
        warningEl.innerHTML = `
            <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at ${API_BASE_URL}.</p>
            <p>Check the server setup instructions in the README file.</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }
    
    // Load calculator data from localStorage if available
    if (localStorage.getItem('calculatorData')) {
        try {
            console.log("Found calculator data in localStorage");
            const data = JSON.parse(localStorage.getItem('calculatorData'));
            // Load the data into the form
            loadCalculatorData(data);
        } catch (e) {
            console.error("Error loading calculator data:", e);
        }
    }
    
    // Initialize the calculator
    initializeCalculator();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for authentication
    checkAuthentication();
});
EOF

# Replace the DOMContentLoaded event handler in script.js
sed -i '/document.addEventListener('\''DOMContentLoaded'\'', async function()/,/});/c\'"$(cat /tmp/domContentLoaded.js)" EVAPOTRAN/js/script.js

echo "API URLs fixed successfully in local development files!"
echo "Now you can test locally, then commit and push to GitHub."