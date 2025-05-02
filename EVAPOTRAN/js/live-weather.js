/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 *
 * @format
 */

// API configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://localhost:3000/api" 
    : `https://${window.location.hostname}/api`; // Use the current domain for production

// Test server connection
async function testServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`, { 
            method: 'GET',
            mode: 'cors',
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

// Initialize the module
document.addEventListener("DOMContentLoaded", async function () {
	// Initialize DOM elements
	locationInput = document.getElementById("locationInput");
	fetchWeatherBtn = document.getElementById("fetchWeatherBtn");
	weatherResults = document.getElementById("weatherResults");
	useWeatherDataBtn = document.getElementById("useWeatherDataBtn");
	loadingIndicator = document.getElementById("loadingIndicator");
	forecastContainer = document.getElementById("forecastContainer");

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

	if (useWeatherDataBtn) {
		// Remove any existing event listeners to prevent duplicates
		useWeatherDataBtn.removeEventListener("click", useWeatherData);
		// Add the event listener
		useWeatherDataBtn.addEventListener("click", useWeatherData);
		console.log("Use weather data button initialized:", useWeatherDataBtn);
	} else {
		console.warn("useWeatherDataBtn element not found");
	}

	// Check for geolocation support
	if (navigator.geolocation) {
		const geolocateBtn = document.getElementById("geolocateBtn");
		if (geolocateBtn) {
			geolocateBtn.style.display = "inline-block";
			geolocateBtn.addEventListener("click", getUserLocation);
		}
	}

	// Check for saved locations
	loadSavedLocations();
});

// Get user's location using geolocation API
function getUserLocation() {
	if (loadingIndicator) {
		loadingIndicator.style.display = "block";
	}

	// Show a message to the user
	const weatherResults = document.getElementById("weatherResults");
	if (weatherResults) {
		weatherResults.innerHTML = "<p>Requesting your location... This may take a moment.</p>";
		weatherResults.style.display = "block";
	}

	navigator.geolocation.getCurrentPosition(
		function (position) {
			// Success callback
			fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
		},
		function (error) {
			// Error callback
			if (loadingIndicator) {
				loadingIndicator.style.display = "none";
			}
			
			console.error("Geolocation error:", error);
			
			let errorMessage = "Unable to get your location. ";
			
			switch(error.code) {
				case error.PERMISSION_DENIED:
					errorMessage += "You denied the request for geolocation.";
					break;
				case error.POSITION_UNAVAILABLE:
					errorMessage += "Location information is unavailable.";
					break;
				case error.TIMEOUT:
					errorMessage += "The request to get your location timed out. Try again or enter your location manually.";
					break;
				default:
					errorMessage += error.message;
			}
			
			alert(errorMessage);
			
			// Update the results area with the error
			if (weatherResults) {
				weatherResults.innerHTML = `<p class="error">${errorMessage}</p>`;
			}
		},
		{
			enableHighAccuracy: false, // Set to false for faster response
			timeout: 10000,           // Increase timeout to 10 seconds
			maximumAge: 60000         // Allow cached positions up to 1 minute old
		}
	);
}

// Fetch weather data by coordinates
async function fetchWeatherByCoordinates(lat, lon) {
	try {
		// Check cache first
		const cacheKey = `${lat},${lon}`;
		if (checkCache(cacheKey)) {
			processWeatherData(weatherCache[cacheKey].data);
			return;
		}

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
			const errorData = await response.json();
			throw new Error(errorData.error || `Weather API error: ${response.status}`);
		}

		const data = await response.json();

		// Cache the response
		cacheWeatherData(cacheKey, data);

		// Process and display the weather data
		processWeatherData(data);

		// Fetch forecast data
		fetchForecastData(lat, lon);

		// Show results and use data button
		if (weatherResults) {
			weatherResults.style.display = "block";
		}
		const outputSection = document.getElementById("output");
		if (outputSection) {
			outputSection.style.display = "block";
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

// Fetch weather data by location name
async function fetchWeatherData() {
	const locationInput = document.getElementById('locationInput');
	const location = locationInput ? locationInput.value.trim() : '';
	
	if (!location) {
		alert('Please enter a location');
		return;
	}
	
	// Show loading indicator
	const loadingIndicator = document.getElementById('loadingIndicator');
	if (loadingIndicator) {
		loadingIndicator.style.display = 'block';
	}
	
	try {
		// Check cache first
		if (checkCache(location)) {
			processWeatherData(weatherCache[location].data);
			return;
		}

		// Fetch data from our proxy server
		const response = await fetch(
			`${API_BASE_URL}/weather?q=${encodeURIComponent(location)}`
		);

		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}

		const data = await response.json();

		// Cache the response
		cacheWeatherData(location, data);

		// Process and display the weather data
		processWeatherData(data);

		// Fetch forecast data
		fetchForecastData(data.coord.lat, data.coord.lon);

		// Save location to history
		saveLocation(location);

		// Show results and use data button
		weatherResults.style.display = "block";
		const outputSection = document.getElementById("output");
		if (outputSection) {
			outputSection.style.display = "block";
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

// Fetch 5-day forecast data
async function fetchForecastData(lat, lon) {
	try {
		const response = await fetch(
			`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}`
		);

		if (!response.ok) {
			throw new Error(`Forecast API error: ${response.status}`);
		}

		const data = await response.json();

		// Process and display the forecast data
		displayForecastData(data);
	} catch (error) {
		console.error("Error fetching forecast data:", error);
		alert(`Failed to fetch forecast data: ${error.message}`);
	}
}

// Process weather data from API response
function processWeatherData(data) {
    console.log("processWeatherData called with:", data);
    
    if (!data || !data.main) {
        console.error("Invalid weather data received:", data);
        throw new Error("Invalid weather data format");
    }

    // Extract relevant weather parameters
    const weatherData = {
        temperature: parseFloat(data.main.temp),
        windSpeed: parseFloat(data.wind.speed),
        relativeHumidity: parseFloat(data.main.humidity),
        atmosphericPressure: parseFloat(data.main.pressure) / 10, // Convert hPa to kPa
        latitude: parseFloat(data.coord.lat),
        longitude: parseFloat(data.coord.lon),
        location: data.name + (data.sys && data.sys.country ? `, ${data.sys.country}` : ""),
        dayNumber: getDayOfYear(new Date()),
        sunshineDuration: estimateSunshineDuration(
            data.weather && data.weather[0] ? data.weather[0].id : 800,
            data.clouds && data.clouds.all ? data.clouds.all : 0
        ),
        elevation: 0 // Default elevation since we don't get it from the API
    };

    console.log("Initial weather data object:", weatherData);

    // Validate all fields are numbers
    for (const [key, value] of Object.entries(weatherData)) {
        if (['temperature', 'windSpeed', 'relativeHumidity', 'atmosphericPressure', 
             'latitude', 'longitude', 'dayNumber', 'sunshineDuration', 'elevation'].includes(key)) {
            if (isNaN(value)) {
                console.error(`Invalid value for ${key}: ${value}`);
                weatherData[key] = key === 'dayNumber' ? 1 : 0; // Set default values
            }
        }
    }

    console.log("Final weather data to store:", weatherData);

    // Store data for later use
    localStorage.setItem("liveWeatherData", JSON.stringify(weatherData));
    
    // Verify the data was stored correctly
    const storedData = localStorage.getItem("liveWeatherData");
    console.log("Stored weather data:", storedData);

    // Display the weather data
    displayWeatherResults(data);
    
    // Show the output section with the button
    const outputSection = document.getElementById("output");
    if (outputSection) {
        outputSection.style.display = "block";
    }
}

// Display weather data in a user-friendly format
function displayWeatherData(weatherData) {
	if (!weatherResults) return;
	
	// Format the timestamp
	const formattedDate = weatherData.timestamp.toLocaleDateString();
	const formattedTime = weatherData.timestamp.toLocaleTimeString();
	
	// Create HTML for the weather data table
	weatherResults.innerHTML = `
		<h3>${weatherData.location}</h3>
		<p class="timestamp">As of ${formattedDate} at ${formattedTime}</p>
		
		<table>
			<thead>
				<tr>
					<th>Parameter</th>
					<th>Value</th>
					<th>Unit</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Temperature</td>
					<td>${weatherData.temperature.toFixed(1)}</td>
					<td>°C</td>
				</tr>
				<tr>
					<td>Wind Speed</td>
					<td>${weatherData.windSpeed.toFixed(1)}</td>
					<td>m/s</td>
				</tr>
				<tr>
					<td>Relative Humidity</td>
					<td>${weatherData.relativeHumidity}</td>
					<td>%</td>
				</tr>
				<tr>
					<td>Atmospheric Pressure</td>
					<td>${weatherData.atmosphericPressure.toFixed(1)}</td>
					<td>kPa</td>
				</tr>
				<tr>
					<td>Latitude</td>
					<td>${weatherData.latitude.toFixed(4)}</td>
					<td>°</td>
				</tr>
				<tr>
					<td>Day of Year</td>
					<td>${weatherData.dayNumber}</td>
					<td></td>
				</tr>
				<tr>
					<td>Estimated Sunshine Duration</td>
					<td>${weatherData.sunshineDuration.toFixed(1)}</td>
					<td>hours</td>
				</tr>
			</tbody>
		</table>
	`;
	
	// Show the results
	weatherResults.style.display = "block";
}

// Add a row to the weather data table
function addDataRow(tbody, parameter, value, unit) {
	const row = document.createElement("tr");

	const paramCell = document.createElement("td");
	paramCell.textContent = parameter;

	const valueCell = document.createElement("td");
	valueCell.textContent = value;

	const unitCell = document.createElement("td");
	unitCell.textContent = unit;

	row.appendChild(paramCell);
	row.appendChild(valueCell);
	row.appendChild(unitCell);

	tbody.appendChild(row);
}

// Function to use the fetched weather data for ET0 calculation
function useWeatherData() {
    try {
        // First, check if we have weather data displayed
        const weatherResults = document.getElementById('weatherResults');
        if (!weatherResults || weatherResults.style.display === 'none') {
            alert('Please fetch weather data first');
            return;
        }
        
        // Get the data directly from the displayed weather results
        const tempElement = document.querySelector('.weather-data-value[data-param="temperature"]');
        const windElement = document.querySelector('.weather-data-value[data-param="wind"]');
        const humidityElement = document.querySelector('.weather-data-value[data-param="humidity"]');
        const locationElement = document.querySelector('.weather-location');
        
        if (!tempElement || !windElement || !humidityElement) {
            alert('Weather data is incomplete. Please fetch weather data again.');
            return;
        }
        
        // Extract values from the displayed elements
        const temperature = parseFloat(tempElement.textContent);
        const windSpeed = parseFloat(windElement.textContent);
        const relativeHumidity = parseFloat(humidityElement.textContent);
        const location = locationElement ? locationElement.textContent : '';
        
        // Get latitude and longitude from the data attributes
        const latElement = document.querySelector('[data-param="latitude"]');
        const lonElement = document.querySelector('[data-param="longitude"]');
        
        const latitude = latElement ? parseFloat(latElement.textContent) : 0;
        const longitude = lonElement ? parseFloat(lonElement.textContent) : 0;
        
        // Calculate day of year
        const today = new Date();
        const dayNumber = getDayOfYear(today);
        
        // Create the calculator data object
        const calculatorData = {
            temperature: temperature,
            windSpeed: windSpeed,
            relativeHumidity: relativeHumidity,
            atmosphericPressure: 101.3, // Default value
            elevation: 0, // Default value
            latitude: latitude,
            dayNumber: dayNumber,
            sunshineDuration: 8, // Default value
            location: location
        };
        
        // Store individual values directly in localStorage
        localStorage.setItem("calc_temperature", temperature);
        localStorage.setItem("calc_windSpeed", windSpeed);
        localStorage.setItem("calc_relativeHumidity", relativeHumidity);
        localStorage.setItem("calc_atmosphericPressure", 101.3);
        localStorage.setItem("calc_elevation", 0);
        localStorage.setItem("calc_latitude", latitude);
        localStorage.setItem("calc_dayNumber", dayNumber);
        localStorage.setItem("calc_sunshineDuration", 8);
        localStorage.setItem("calc_location", location);
        
        // Also store the complete object as a backup
        localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
        
        // Set a flag to indicate we're coming from the weather page
        localStorage.setItem("fromWeatherPage", "true");
        
        // Redirect to the calculator page
        window.location.href = "calculator.html";
    } catch (error) {
        console.error("Error using weather data:", error);
        alert(`Failed to use weather data: ${error.message}`);
    }
}

// Debug function to inspect localStorage
function debugLocalStorage() {
    console.log("=== DEBUG: localStorage Content ===");
    try {
        const liveWeatherData = localStorage.getItem("liveWeatherData");
        console.log("liveWeatherData raw:", liveWeatherData);
        
        if (liveWeatherData) {
            const parsed = JSON.parse(liveWeatherData);
            console.log("liveWeatherData parsed:", parsed);
            
            // Check each required field
            const requiredFields = [
                'temperature', 'windSpeed', 'relativeHumidity', 
                'latitude', 'dayNumber', 'sunshineDuration'
            ];
            
            console.log("Field validation:");
            for (const field of requiredFields) {
                const value = parsed[field];
                console.log(`${field}: ${value} (${typeof value}) - Valid: ${value !== undefined && value !== null && !isNaN(parseFloat(value))}`);
            }
        } else {
            console.log("liveWeatherData is null or empty");
        }
        
        const etoCalcData = localStorage.getItem("etoCalcData");
        console.log("etoCalcData raw:", etoCalcData);
        
        if (etoCalcData) {
            console.log("etoCalcData parsed:", JSON.parse(etoCalcData));
        } else {
            console.log("etoCalcData is null or empty");
        }
    } catch (e) {
        console.error("Error in debugLocalStorage:", e);
    }
    console.log("=== END DEBUG ===");
}

// Helper function to get day of year from date
function getDayOfYear(date) {
	const start = new Date(date.getFullYear(), 0, 0);
	const diff = date - start;
	const oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(diff / oneDay);
}

// Estimate sunshine duration based on weather conditions and cloud cover
function estimateSunshineDuration(weatherCode, cloudCover) {
	// Get potential daylight hours based on current date
	const potentialDaylight = estimateDaylightHours();

	// Weather codes: https://openweathermap.org/weather-conditions
	// Clear: 800, Clouds: 801-804, Rain: 500-531, etc.

	let sunshineRatio = 0;

	if (weatherCode === 800) {
		// Clear sky
		sunshineRatio = 0.95;
	} else if (weatherCode >= 801 && weatherCode <= 804) {
		// Clouds - use cloud cover percentage
		sunshineRatio = 1 - cloudCover / 100;
	} else if (weatherCode >= 500 && weatherCode <= 531) {
		// Rain
		sunshineRatio = 0.2;
	} else if (weatherCode >= 600 && weatherCode <= 622) {
		// Snow
		sunshineRatio = 0.3;
	} else if (weatherCode >= 700 && weatherCode <= 781) {
		// Atmosphere (mist, fog, etc.)
		sunshineRatio = 0.4;
	} else {
		// Default
		sunshineRatio = 0.5;
	}

	return potentialDaylight * sunshineRatio;
}

// Estimate daylight hours based on current date and latitude
function estimateDaylightHours() {
	// Simple approximation - in reality, this depends on latitude and day of year
	// For a more accurate calculation, we would use astronomical formulas
	return 12; // Default to 12 hours as a simple approximation
}

// Cache functions
function checkCache(key) {
	return weatherCache.hasOwnProperty(key) && Date.now() - weatherCache[key].timestamp < CACHE_DURATION;
}

function cacheWeatherData(key, data) {
	weatherCache[key] = {
		data: data,
		timestamp: Date.now()
	};
}

// Save location to history
function saveLocation(location) {
	let savedLocations = JSON.parse(localStorage.getItem("savedLocations")) || [];
	if (!savedLocations.includes(location)) {
		savedLocations.push(location);
		localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
	}
}

// Load saved locations
function loadSavedLocations() {
	const savedLocations = JSON.parse(localStorage.getItem("savedLocations")) || [];
	const locationSelect = document.getElementById("locationSelect");
	
	// Only proceed if the locationSelect element exists
	if (locationSelect && savedLocations.length > 0) {
		savedLocations.forEach(location => {
			const option = document.createElement("option");
			option.value = location;
			option.textContent = location;
			locationSelect.appendChild(option);
		});
	}
}

// Display forecast data
function displayForecastData(data) {
	if (!forecastContainer) return;

	forecastContainer.innerHTML = "<h3>5-Day Forecast</h3>";
	
	// Create a container for the forecast items
	const forecastList = document.createElement("div");
	forecastList.className = "forecast-container";
	
	// Group forecast data by day
	const dailyForecasts = {};
	
	data.list.forEach(item => {
		const date = new Date(item.dt * 1000);
		const dateKey = date.toISOString().split('T')[0];
		
		// Skip today's forecast
		if (new Date().toISOString().split('T')[0] === dateKey) {
			return;
		}
		
		// Initialize the day's data if it doesn't exist
		if (!dailyForecasts[dateKey]) {
			dailyForecasts[dateKey] = {
				date: date,
				temps: [],
				humidity: [],
				windSpeed: [],
				weather: []
			};
		}
		
		// Add this forecast's data to the day's collection
		dailyForecasts[dateKey].temps.push(item.main.temp);
		dailyForecasts[dateKey].humidity.push(item.main.humidity);
		dailyForecasts[dateKey].windSpeed.push(item.wind.speed);
		dailyForecasts[dateKey].weather.push(item.weather[0].main);
	});
	
	// Create a forecast item for each day
	Object.keys(dailyForecasts).slice(0, 5).forEach(dateKey => {
		const day = dailyForecasts[dateKey];
		
		// Calculate averages
		const avgTemp = day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length;
		const avgHumidity = day.humidity.reduce((sum, hum) => sum + hum, 0) / day.humidity.length;
		const avgWindSpeed = day.windSpeed.reduce((sum, speed) => sum + speed, 0) / day.windSpeed.length;
		
		// Determine most common weather condition
		const weatherCounts = {};
		day.weather.forEach(condition => {
			weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
		});
		const mainWeather = Object.keys(weatherCounts).reduce((a, b) => 
			weatherCounts[a] > weatherCounts[b] ? a : b);
		
		// Create forecast item
		const forecastItem = document.createElement("div");
		forecastItem.className = "forecast-item";
		
		// Format date as day of week
		const dayOfWeek = day.date.toLocaleDateString(undefined, { weekday: 'long' });
		const formattedDate = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		
		forecastItem.innerHTML = `
			<div class="forecast-date">${dayOfWeek}<br>${formattedDate}</div>
			<div class="forecast-temp">${avgTemp.toFixed(1)}°C</div>
			<div class="forecast-detail">
				<span>Humidity:</span>
				<span>${avgHumidity.toFixed(0)}%</span>
			</div>
			<div class="forecast-detail">
				<span>Wind:</span>
				<span>${avgWindSpeed.toFixed(1)} m/s</span>
			</div>
			<div class="forecast-detail">
				<span>Condition:</span>
				<span>${mainWeather}</span>
			</div>
		`;
		
		forecastList.appendChild(forecastItem);
	});
	
	forecastContainer.appendChild(forecastList);
}

// Add this function to handle the weather data and calculate ET0
function processWeatherData(weatherData) {
    // Display the weather data in the results section
    displayWeatherResults(weatherData);
    
    // Show the output section with the "Use This Data" button
    const outputSection = document.getElementById('output');
    if (outputSection) {
        outputSection.style.display = 'block';
    }
    
    // Add event listener to the "Use This Data" button
    const useDataBtn = document.getElementById('useWeatherDataBtn');
    if (useDataBtn) {
        useDataBtn.addEventListener('click', function() {
            // Store the weather data in localStorage for use in calculator
            const calculatorData = {
                temperature: weatherData.temperature,
                windSpeed: weatherData.windSpeed,
                relativeHumidity: weatherData.humidity,
                // Add other relevant data
                atmosphericPressure: weatherData.pressure,
                latitude: weatherData.lat,
                longitude: weatherData.lon
            };
            
            localStorage.setItem('etoCalcData', JSON.stringify(calculatorData));
            
            // Redirect to calculator page
            window.location.href = 'calculator.html';
        });
    }
}

// Function to display weather results in the B2 block
function displayWeatherResults(data) {
    const weatherResults = document.getElementById('weatherResults');
    if (!weatherResults) return;
    
    // Create a clean display of the weather data
    weatherResults.innerHTML = `
        <div class="weather-header">
            <h3 class="weather-location">${data.name}, ${data.sys.country}</h3>
            <p class="weather-description">${data.weather[0].description}</p>
        </div>
        <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
        </div>
        <div class="weather-data">
            <div class="weather-data-item">
                <span class="weather-data-label">Temperature:</span>
                <span class="weather-data-value" data-param="temperature">${data.main.temp}</span>
                <span class="weather-data-unit">°C</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Wind Speed:</span>
                <span class="weather-data-value" data-param="wind">${data.wind.speed}</span>
                <span class="weather-data-unit">m/s</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Humidity:</span>
                <span class="weather-data-value" data-param="humidity">${data.main.humidity}</span>
                <span class="weather-data-unit">%</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Pressure:</span>
                <span class="weather-data-value" data-param="pressure">${data.main.pressure}</span>
                <span class="weather-data-unit">hPa</span>
            </div>
        </div>
        <div class="weather-data-hidden">
            <span data-param="latitude">${data.coord.lat}</span>
            <span data-param="longitude">${data.coord.lon}</span>
        </div>
    `;
    
    // Show the weather results
    weatherResults.style.display = "block";
}

// Add this to your fetchWeatherData function
async function fetchWeatherData() {
    const locationInput = document.getElementById('locationInput');
    const location = locationInput ? locationInput.value.trim() : '';
    
    if (!location) {
        alert('Please enter a location');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    try {
        // Fetch weather data from API
        const response = await fetch(`${API_BASE_URL}/weather?q=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and display the weather data
        processWeatherData(data);
        
        // Also fetch forecast data if available
        if (data.coord && data.coord.lat && data.coord.lon) {
            fetchForecastData(data.coord.lat, data.coord.lon);
        }
        
        // Save location to history
        saveLocation(location);
        
        // Show results and use data button
        const weatherResults = document.getElementById('weatherResults');
        if (weatherResults) {
            weatherResults.style.display = 'block';
        }
        
        const outputSection = document.getElementById('output');
        if (outputSection) {
            outputSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(`Failed to fetch weather data: ${error.message}`);
    } finally {
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

// Make sure the fetch button has an event listener
document.addEventListener('DOMContentLoaded', function() {
    const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
    if (fetchWeatherBtn) {
        fetchWeatherBtn.addEventListener('click', fetchWeatherData);
    }
});


