/**
 * Live Weather Data Integration - DEBUG VERSION
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 */

// API configuration with debug info
const hostname = window.location.hostname;
console.log("Current hostname:", hostname);

const API_BASE_URL = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${hostname}/api`;

console.log("Using API_BASE_URL:", API_BASE_URL);

// Test server connection with detailed logging
async function testServerConnection() {
    console.log("Testing connection to:", `${API_BASE_URL}/test`);
    try {
        const response = await fetch(`${API_BASE_URL}/test`, { 
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Server response:", response);
        
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

// Initialize on page load with debug info
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing weather module...");
    
    // Test server connection
    console.log("Testing server connection...");
    const serverAvailable = await testServerConnection();
    console.log("Server available:", serverAvailable);
    
    if (!serverAvailable) {
        console.log("Adding server warning to UI...");
        // Show warning about server connection
        const warningEl = document.createElement("div");
        warningEl.className = "server-warning";
        warningEl.innerHTML = `
            <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at ${API_BASE_URL}.</p>
            <p>If you're running locally, check the server setup instructions in the README file.</p>
            <p>If you're using the production site, please contact the administrator.</p>
            <p>Debug info: hostname=${hostname}, API_BASE_URL=${API_BASE_URL}</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }
});