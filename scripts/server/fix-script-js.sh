#!/bin/bash

# Exit on error
set -e

echo "Fixing script.js to use dynamic API URL..."

# Create a backup of the original file
cp /var/www/flahacalc/EVAPOTRAN/js/script.js /var/www/flahacalc/EVAPOTRAN/js/script.js.bak

# Find and replace the hardcoded localhost URL in the server warning
sed -i 's|http://localhost:3000|${API_BASE_URL}|g' /var/www/flahacalc/EVAPOTRAN/js/script.js

# Update the testServerConnection function to use dynamic API URL
cat > /tmp/testServerConnection.js << 'EOF'
// Test server connection
async function testServerConnection() {
    // Use the same API_BASE_URL logic as in live-weather.js
    const hostname = window.location.hostname;
    const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? "http://localhost:3000/api" 
        : `https://${hostname}/api`;
    
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
EOF

# Replace the testServerConnection function in script.js
sed -i '/async function testServerConnection/,/^}/c\'"$(cat /tmp/testServerConnection.js)" /var/www/flahacalc/EVAPOTRAN/js/script.js

# Update the DOMContentLoaded event handler
cat > /tmp/domContentLoaded.js << 'EOF'
document.addEventListener('DOMContentLoaded', async function() {
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
            <p>If you're running locally, check the server setup instructions in the README file.</p>
            <p>If you're using the production site, please contact the administrator.</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }
    
    // Rest of your initialization code...
EOF

# Replace the DOMContentLoaded event handler in script.js
sed -i '/document.addEventListener('\''DOMContentLoaded'\'', async function()/,/});/c\'"$(cat /tmp/domContentLoaded.js)" /var/www/flahacalc/EVAPOTRAN/js/script.js

echo "script.js has been updated to use dynamic API URL."