#!/bin/bash

# Exit on error
set -e

echo "Fixing production environment issues..."

# 1. Fix script.js to use the correct API URL
echo "Fixing script.js..."
SCRIPT_PATH="/var/www/flahacalc/EVAPOTRAN/js/script.js"

# Create a backup
cp $SCRIPT_PATH ${SCRIPT_PATH}.bak

# Replace the testServerConnection function
cat > /tmp/testServerConnection.js << 'EOF'
// Test server connection
async function testServerConnection() {
    // PRODUCTION FIX: Always use the current hostname for API URL
    const hostname = window.location.hostname;
    const API_BASE_URL = `https://${hostname}/api`;
    
    console.log("Using API URL:", API_BASE_URL);
    
    try {
        const response = await fetch(`${API_BASE_URL}/test`, { 
            method: 'GET',
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

# Replace the function in the file
sed -i '/async function testServerConnection/,/^}/c\'"$(cat /tmp/testServerConnection.js)" $SCRIPT_PATH

# 2. Fix live-weather.js
echo "Fixing live-weather.js..."
WEATHER_PATH="/var/www/flahacalc/EVAPOTRAN/js/live-weather.js"

# Create a backup
cp $WEATHER_PATH ${WEATHER_PATH}.bak

# Replace the API URL configuration
cat > /tmp/weather-api-config.js << 'EOF'
/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 */

// API configuration
// PRODUCTION FIX: Always use the current hostname for API URL
const hostname = window.location.hostname;
const API_BASE_URL = `https://${hostname}/api`;

console.log("Using API_BASE_URL:", API_BASE_URL);
EOF

# Replace the beginning of the file
head -n 10 ${WEATHER_PATH}.bak > /tmp/weather-header.js
diff_count=$(diff /tmp/weather-header.js /tmp/weather-api-config.js | wc -l)

if [ $diff_count -gt 0 ]; then
    # Replace the first 10 lines with our fixed version
    sed -i '1,10d' $WEATHER_PATH
    cat /tmp/weather-api-config.js > /tmp/new-weather.js
    cat $WEATHER_PATH >> /tmp/new-weather.js
    mv /tmp/new-weather.js $WEATHER_PATH
fi

# 3. Update Nginx configuration
echo "Updating Nginx configuration..."
NGINX_CONF="/etc/nginx/sites-available/flahacalc"

# Create a backup
cp $NGINX_CONF ${NGINX_CONF}.bak

# Update the CSP header to allow connections to the API
sed -i 's|connect-src '\''self'\'' https://api.openweathermap.org|connect-src '\''self'\'' https://api.openweathermap.org https://flaha.org|g' $NGINX_CONF

# 4. Make sure the API test endpoint exists
echo "Ensuring API test endpoint exists..."
SERVER_JS="/var/www/flahacalc/EVAPOTRAN/server/server.js"

if ! grep -q "app.get.*('/api/test'" $SERVER_JS; then
    echo "Adding API test endpoint..."
    cat >> $SERVER_JS << 'EOF'

// Add a test endpoint to verify server connectivity
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});
EOF
fi

# 5. Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting Nginx..."
    systemctl restart nginx
else
    echo "Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# 6. Restart Node.js server
echo "Restarting Node.js server..."
cd /var/www/flahacalc/EVAPOTRAN/server
pm2 restart flahacalc-server || pm2 start server.js --name flahacalc-server
pm2 save

echo "All fixes applied successfully!"
echo "Please clear your browser cache and reload the page to test."