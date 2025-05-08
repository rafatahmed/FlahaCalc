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

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
let weatherCache = {};

// DOM elements
let locationInput;
let fetchWeatherBtn;
let weatherResults;
let useWeatherDataBtn;
let loadingIndicator;
let forecastContainer;
let processedWeatherData = null;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize DOM elements
    locationInput = document.getElementById('locationInput');
    fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
    weatherResults = document.getElementById('weatherResults');
    useWeatherDataBtn = document.getElementById('useWeatherDataBtn');
    loadingIndicator = document.getElementById('loadingIndicator');
    forecastContainer = document.getElementById('forecastContainer');
    
    // Test server connection
    const serverAvailable = await testServerConnection();
    if (!serverAvailable) {
        // Show warning about server connection
        const warningEl = document.createElement("div");
        warningEl.className = "server-warning";
        warningEl.innerHTML = `
            <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at ${API_BASE_URL}.</p>
            <p>If you're running locally, check the server setup instructions in the README file.</p>
            <p>If you're using the production site, please contact the administrator.</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }

    // Add event listeners
    if (fetchWeatherBtn) {
        fetchWeatherBtn.addEventListener("click", fetchWeatherData);
    }
    
    // Load location history
    loadLocationHistory();
    
    // Initialize geolocation
    initGeolocation();
});

// Test server connection
async function testServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("Server connection test successful:", data);
            return true;
        }
        
        console.error("Server connection test failed:", response.status);
        return false;
    } catch (error) {
        console.error("Server connection test error:", error);
        return false;
    }
}

// Initialize geolocation
function initGeolocation() {
    const geolocateBtn = document.getElementById('geolocateBtn');
    if (geolocateBtn) {
        geolocateBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                // Show loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = "block";
                }
                
                navigator.geolocation.getCurrentPosition(
                    // Success callback
                    function(position) {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        console.log(`Geolocation successful: ${lat}, ${lon}`);
                        fetchWeatherByCoordinates(lat, lon);
                    },
                    // Error callback
                    function(error) {
                        console.error("Geolocation error:", error);
                        alert(`Geolocation failed: ${error.message}`);
                        
                        // Hide loading indicator
                        if (loadingIndicator) {
                            loadingIndicator.style.display = "none";
                        }
                    },
                    // Options
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        });
    }
}

// Process weather data from API response
function processWeatherData(data) {
    console.log("processWeatherData called with:", data);
    
    if (!data || !data.main) {
        console.error("Invalid weather data received:", data);
        alert("Weather data is incomplete. Please fetch weather data again.");
        return;
    }

    // Calculate day of year
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Extract relevant weather parameters
    const weatherData = {
        temperature: data.main.temp,
        windSpeed: data.wind ? data.wind.speed : 0,
        relativeHumidity: data.main.humidity,
        atmosphericPressure: data.main.pressure / 10, // Convert hPa to kPa
        latitude: data.coord ? data.coord.lat : 0,
        longitude: data.coord ? data.coord.lon : 0,
        location: data.name + (data.sys && data.sys.country ? `, ${data.sys.country}` : ""),
        dayNumber: dayOfYear,
        sunshineDuration: 8, // Default value
        elevation: 0 // Default elevation
    };

    // Store data for later use
    try {
        localStorage.setItem("liveWeatherData", JSON.stringify(weatherData));
        
        // Also store in the format expected by the calculator
        const calculatorData = {
            temperature: weatherData.temperature,
            windSpeed: weatherData.windSpeed,
            relativeHumidity: weatherData.relativeHumidity,
            atmosphericPressure: weatherData.atmosphericPressure,
            elevation: weatherData.elevation || 0,
            latitude: weatherData.latitude,
            dayNumber: weatherData.dayNumber,
            sunshineDuration: weatherData.sunshineDuration
        };
        
        localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
    } catch (error) {
        console.error("Error storing weather data:", error);
        alert("Warning: Could not store weather data. " + error.message);
    }

    // Save the processed data for later use
    processedWeatherData = weatherData;

    // Display the weather data
    displayWeatherResults(data);
    
    // Show the output section with the button
    const outputSection = document.getElementById("output");
    if (outputSection) {
        outputSection.style.display = "block";
    }
}

// Display weather results
function displayWeatherResults(data) {
    if (!weatherResults) return;
    
    // Extract country code if available
    const country = data.sys && data.sys.country ? data.sys.country : "";
    
    // Create a clean display of the weather data
    weatherResults.innerHTML = `
        <div class="weather-header">
            <h3 class="weather-location">${data.name}${country ? `, ${country}` : ""}</h3>
            <p class="weather-description">${data.weather && data.weather[0] ? data.weather[0].description : "Weather data"}</p>
        </div>
        <div class="weather-icon">
            ${data.weather && data.weather[0] && data.weather[0].icon ? 
              `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">` : 
              ''}
        </div>
        <div class="weather-data">
            <div class="weather-data-item">
                <span class="weather-data-label">Temperature:</span>
                <span class="weather-data-value" data-param="temp">${data.main && data.main.temp ? data.main.temp.toFixed(1) : "N/A"}°C</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Humidity:</span>
                <span class="weather-data-value" data-param="humidity">${data.main && data.main.humidity ? data.main.humidity : "N/A"}%</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Wind Speed:</span>
                <span class="weather-data-value" data-param="wind">${data.wind && data.wind.speed ? data.wind.speed : "N/A"} m/s</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Pressure:</span>
                <span class="weather-data-value" data-param="pressure">${data.main && data.main.pressure ? data.main.pressure : "N/A"} hPa</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Coordinates:</span>
                <span class="weather-data-value" data-param="coordinates">${data.coord ? `${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(4)}` : "N/A"}</span>
            </div>
        </div>
    `;
    
    // Show the weather results
    weatherResults.style.display = "block";
}

// Function to use weather data in calculator
function useWeatherData() {
    try {
        // Get the processed weather data
        if (!processedWeatherData) {
            throw new Error("No weather data available");
        }
        
        // Store in localStorage for use in calculator
        const calculatorData = {
            temperature: processedWeatherData.temperature,
            windSpeed: processedWeatherData.windSpeed,
            relativeHumidity: processedWeatherData.relativeHumidity,
            atmosphericPressure: processedWeatherData.atmosphericPressure,
            elevation: processedWeatherData.elevation || 0,
            latitude: processedWeatherData.latitude,
            dayNumber: processedWeatherData.dayNumber,
            sunshineDuration: processedWeatherData.sunshineDuration,
            location: processedWeatherData.location
        };
        
        localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
        
        // Redirect to calculator page
        window.location.href = "calculator.html";
    } catch (error) {
        console.error("Error using weather data:", error);
        alert("Error using weather data: " + error.message);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        // Show loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = "block";
        }

        // Fetch data from our proxy server
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`,
            {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Process and display the weather data
        processWeatherData(data);

        // Show results and use data button
        if (weatherResults) {
            weatherResults.style.display = "block";
        }
        const outputSection = document.getElementById("output");
        if (outputSection) {
            outputSection.style.display = "block";
        }
        
        // Add event listener to the "Use This Data" button
        const useDataBtn = document.getElementById('useWeatherDataBtn');
        if (useDataBtn) {
            // Remove any existing event listeners
            const newUseDataBtn = useDataBtn.cloneNode(true);
            useDataBtn.parentNode.replaceChild(newUseDataBtn, useDataBtn);
            
            // Add the event listener to the new button
            newUseDataBtn.addEventListener('click', useWeatherData);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(`Failed to fetch weather data: ${error.message}`);
    } finally {
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = "none";
        }
    }
}

// Fetch weather data
async function fetchWeatherData() {
    // Get location from input
    const location = locationInput.value.trim();
    if (!location) {
        alert("Please enter a location");
        return;
    }
    
    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
    }
    
    try {
        // Fetch data from our proxy server
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${encodeURIComponent(location)}`,
            {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Process and display the weather data
        processWeatherData(data);

        // Save location to history
        saveLocation(location);

        // Show results and use data button
        weatherResults.style.display = "block";
        const outputSection = document.getElementById("output");
        if (outputSection) {
            outputSection.style.display = "block";
        }
        
        // Add event listener to the "Use This Data" button
        const useDataBtn = document.getElementById('useWeatherDataBtn');
        if (useDataBtn) {
            // Remove any existing event listeners
            const newUseDataBtn = useDataBtn.cloneNode(true);
            useDataBtn.parentNode.replaceChild(newUseDataBtn, useDataBtn);
            
            // Add the event listener to the new button
            newUseDataBtn.addEventListener('click', useWeatherData);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(`Failed to fetch weather data: ${error.message}`);
    } finally {
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = "none";
        }
    }
}

// Load location history from localStorage
function loadLocationHistory() {
    try {
        const historyString = localStorage.getItem('locationHistory');
        if (historyString) {
            const history = JSON.parse(historyString);
            populateLocationHistory(history);
            return history;
        }
        return [];
    } catch (error) {
        console.error("Error loading location history:", error);
        return [];
    }
}

// Save location to history
function saveLocation(location) {
    if (!location) return;
    
    try {
        let history = [];
        const storedHistory = localStorage.getItem('locationHistory');
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
        
        // Add location if it doesn't exist
        if (!history.includes(location)) {
            history.unshift(location); // Add to beginning
            // Keep only the last 5 locations
            if (history.length > 5) {
                history = history.slice(0, 5);
            }
            localStorage.setItem("locationHistory", JSON.stringify(history));
            
            // Update the location history dropdown
            populateLocationHistory(history);
        }
    } catch (error) {
        console.error("Error saving location to history:", error);
    }
}

// Populate location history dropdown
function populateLocationHistory(history) {
    const historyDropdown = document.getElementById('locationHistory');
    if (!historyDropdown || !history || !history.length) return;
    
    // Clear existing options
    historyDropdown.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Recent locations...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    historyDropdown.appendChild(defaultOption);
    
    // Add history options
    history.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        historyDropdown.appendChild(option);
    });
    
    // Show the dropdown
    historyDropdown.style.display = 'block';
    
    // Add change event listener
    historyDropdown.addEventListener('change', function() {
        const selectedLocation = this.value;
        if (selectedLocation) {
            locationInput.value = selectedLocation;
            // Reset the dropdown
            this.selectedIndex = 0;
        }
    });
}

// Check if data is in cache and still valid
function checkCache(key) {
    if (weatherCache[key] && (Date.now() - weatherCache[key].timestamp < CACHE_DURATION)) {
        console.log(`Using cached data for ${key}`);
        return true;
    }
    return false;
}

// Cache weather data
function cacheWeatherData(key, data) {
    weatherCache[key] = {
        data: data,
        timestamp: Date.now()
    };
    console.log(`Cached weather data for ${key}`);
}