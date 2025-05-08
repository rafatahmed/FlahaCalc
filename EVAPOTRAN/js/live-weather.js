/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 *
 * @format
 */

// API configuration
const hostname = window.location.hostname;
const API_BASE_URL =
	hostname === "localhost" || hostname === "127.0.0.1"
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

// Add a fallback option for when the server is not available
function showFallbackOptions() {
	const fallbackEl = document.createElement("div");
	fallbackEl.className = "fallback-options";
	fallbackEl.innerHTML = `
		<h3>Alternative Options</h3>
		<p>Since the weather server is currently unavailable, you can:</p>
		<ol>
			<li>Enter weather data manually using the form below</li>
			<li>Try again later when the server might be available</li>
			<li>Check the <a href="server/TROUBLESHOOTING.md" target="_blank">troubleshooting guide</a> if you're running locally</li>
		</ol>
		<button id="show-manual-entry" class="btn btn-primary">Show Manual Entry Form</button>
	`;
	
	document.querySelector(".weather-container").appendChild(fallbackEl);
	
	// Add event listener for the manual entry button
	document.getElementById("show-manual-entry").addEventListener("click", function() {
		// Show the manual entry form
		document.getElementById("manual-entry").style.display = "block";
		// Hide the fallback options
		fallbackEl.style.display = "none";
	});
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
	// Initialize DOM elements
	locationInput = document.getElementById("location");
	fetchWeatherBtn = document.getElementById("fetch-weather");
	weatherResults = document.getElementById("weather-results");
	useWeatherDataBtn = document.getElementById("use-weather-data");
	loadingIndicator = document.getElementById("loading");
	forecastContainer = document.getElementById("forecast-container");

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
		
		// Show fallback options
		showFallbackOptions();
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

// Test server connection with better error handling
async function testServerConnection() {
	try {
		console.log("Testing server connection to:", `${API_BASE_URL}/test`);
		const response = await fetch(`${API_BASE_URL}/test`, {
			method: "GET",
			mode: "cors",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			console.error(`Server connection test failed: ${response.status}`);
			
			// Add more detailed error information
			let errorMessage = "Unknown error";
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || "Unknown error";
			} catch (e) {
				// If we can't parse JSON, use status text
				errorMessage = response.statusText;
			}
			
			console.error(`Error details: ${errorMessage}`);
			
			// Provide specific guidance based on error code
			if (response.status === 502) {
				console.warn("502 Bad Gateway error suggests the server proxy is not properly configured.");
			} else if (response.status === 404) {
				console.warn("404 Not Found error suggests the API endpoint doesn't exist on the server.");
			}
			
			return false;
		}

		const data = await response.json();
		console.log("Server connection test successful:", data);
		return true;
	} catch (error) {
		console.error("Server connection test error:", error);
		return false;
	}
}

// Initialize geolocation
function initGeolocation() {
	const geolocateBtn = document.getElementById("geolocateBtn");
	if (geolocateBtn) {
		geolocateBtn.addEventListener("click", function () {
			if (navigator.geolocation) {
				// Show loading indicator
				if (loadingIndicator) {
					loadingIndicator.style.display = "block";
				}

				navigator.geolocation.getCurrentPosition(
					// Success callback
					function (position) {
						const lat = position.coords.latitude;
						const lon = position.coords.longitude;
						console.log(`Geolocation successful: ${lat}, ${lon}`);
						fetchWeatherByCoordinates(lat, lon);
					},
					// Error callback
					function (error) {
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
						maximumAge: 0,
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
		elevation: 0, // Default elevation
		elevationEstimated: true // Flag to indicate elevation is estimated
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
			sunshineDuration: weatherData.sunshineDuration,
			location: weatherData.location,
			elevationEstimated: true
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
	
	// Try to get elevation data if coordinates are available
	if (data.coord && data.coord.lat && data.coord.lon) {
		fetchElevationData(data.coord.lat, data.coord.lon);
	}
}

// Function to fetch elevation data
async function fetchElevationData(lat, lon) {
	try {
		// Use Open-Elevation API or similar service
		const response = await fetch(
			`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`,
			{
				method: 'GET',
				headers: {
					'Accept': 'application/json'
				}
			}
		);
		
		if (!response.ok) {
			throw new Error(`Elevation API error: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data && data.results && data.results.length > 0) {
			const elevation = data.results[0].elevation;
			console.log(`Fetched elevation data: ${elevation}m`);
			
			// Update the weather data with elevation
			if (processedWeatherData) {
				processedWeatherData.elevation = elevation;
				processedWeatherData.elevationEstimated = false;
				
				// Update localStorage
				localStorage.setItem("liveWeatherData", JSON.stringify(processedWeatherData));
				
				// Update calculator data
				const calculatorData = JSON.parse(localStorage.getItem("etoCalcData") || "{}");
				calculatorData.elevation = elevation;
				calculatorData.elevationEstimated = false;
				localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
				
				// Update display
				updateElevationDisplay(elevation);
			}
		}
	} catch (error) {
		console.error("Error fetching elevation data:", error);
		// Use a fallback method - estimate based on location
		estimateElevationFromLocation();
	}
}

// Function to estimate elevation based on location name
function estimateElevationFromLocation() {
	if (!processedWeatherData || !processedWeatherData.location) return;
	
	// This is a very rough estimation - in a real app, you'd use a more accurate API
	// For now, we'll set a default elevation of 100m with a clear indication it's estimated
	const estimatedElevation = 100;
	
	// Update the weather data with estimated elevation
	processedWeatherData.elevation = estimatedElevation;
	processedWeatherData.elevationEstimated = true;
	
	// Update localStorage
	localStorage.setItem("liveWeatherData", JSON.stringify(processedWeatherData));
	
	// Update calculator data
	const calculatorData = JSON.parse(localStorage.getItem("etoCalcData") || "{}");
	calculatorData.elevation = estimatedElevation;
	calculatorData.elevationEstimated = true;
	localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
	
	// Update display
	updateElevationDisplay(estimatedElevation, true);
}

// Function to update elevation display
function updateElevationDisplay(elevation, isEstimated = false) {
	// Add elevation to the weather display
	const weatherDataEl = document.querySelector('.weather-data');
	if (weatherDataEl) {
		// Check if elevation element already exists
		let elevationEl = weatherDataEl.querySelector('[data-param="elevation"]');
		if (!elevationEl) {
			// Create new element if it doesn't exist
			const elevationItem = document.createElement('div');
			elevationItem.className = 'weather-data-item';
			elevationItem.innerHTML = `
				<span class="weather-data-label">Elevation:</span>
				<span class="weather-data-value" data-param="elevation">${elevation} m${isEstimated ? ' (estimated)' : ''}</span>
			`;
			weatherDataEl.appendChild(elevationItem);
		} else {
			// Update existing element
			elevationEl.textContent = `${elevation} m${isEstimated ? ' (estimated)' : ''}`;
		}
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
            <h3 class="weather-location">${data.name}${
		country ? `, ${country}` : ""
	}</h3>
            <p class="weather-description">${
							data.weather && data.weather[0]
								? data.weather[0].description
								: "Weather data"
						}</p>
        </div>
        <div class="weather-icon">
            ${
							data.weather && data.weather[0] && data.weather[0].icon
								? `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">`
								: ""
						}
        </div>
        <div class="weather-data">
            <div class="weather-data-item">
                <span class="weather-data-label">Temperature:</span>
                <span class="weather-data-value" data-param="temp">${
									data.main && data.main.temp
										? data.main.temp.toFixed(1)
										: "N/A"
								}°C</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Humidity:</span>
                <span class="weather-data-value" data-param="humidity">${
									data.main && data.main.humidity ? data.main.humidity : "N/A"
								}%</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Wind Speed:</span>
                <span class="weather-data-value" data-param="wind">${
									data.wind && data.wind.speed ? data.wind.speed : "N/A"
								} m/s</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Pressure:</span>
                <span class="weather-data-value" data-param="pressure">${
									data.main && data.main.pressure ? data.main.pressure : "N/A"
								} hPa</span>
            </div>
            <div class="weather-data-item">
                <span class="weather-data-label">Coordinates:</span>
                <span class="weather-data-value" data-param="coordinates">${
									data.coord
										? `${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(
												4
										  )}`
										: "N/A"
								}</span>
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
			location: processedWeatherData.location,
			elevationEstimated: processedWeatherData.elevationEstimated || true
		};
		
		localStorage.setItem("etoCalcData", JSON.stringify(calculatorData));
		
		// Redirect to calculator page
		window.location.href = "calculator.html";
	} catch (error) {
		console.error("Error using weather data:", error);
		alert("Error using weather data: " + error.message);
	}
}

// Fetch weather data by coordinates with improved error handling
async function fetchWeatherByCoordinates(lat, lon) {
	try {
		// Show loading indicator
		if (loadingIndicator) {
			loadingIndicator.style.display = "block";
		}

		console.log(`Fetching weather data from: ${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`);
		
		// Fetch data from our proxy server
		const response = await fetch(
			`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`,
			{
				method: "GET",
				mode: "cors",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			let errorMessage = "Unknown error";
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || `Status code: ${response.status}`;
			} catch (e) {
				errorMessage = `Weather API error: ${response.status}`;
			}
			
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log("Weather data received:", data);

		// Process and display the weather data
		processWeatherData(data);
		
		// Fetch forecast data
		fetchForecastByCoordinates(lat, lon);

		// Show results and use data button
		if (weatherResults) {
			weatherResults.style.display = "block";
		}
		const outputSection = document.getElementById("output");
		if (outputSection) {
			outputSection.style.display = "block";
		}
		
		// Add event listener to the "Use This Data" button
		const useDataBtn = document.getElementById("useWeatherDataBtn");
		if (useDataBtn) {
			// Remove any existing event listeners
			const newUseDataBtn = useDataBtn.cloneNode(true);
			useDataBtn.parentNode.replaceChild(newUseDataBtn, useDataBtn);
			
			// Add the event listener to the new button
			newUseDataBtn.addEventListener("click", useWeatherData);
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
				method: "GET",
				mode: "cors",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}

		const data = await response.json();

		// Process and display the weather data
		processWeatherData(data);
		
		// Fetch forecast data if coordinates are available
		if (data.coord) {
			fetchForecastByCoordinates(data.coord.lat, data.coord.lon);
		}

		// Save location to history
		saveLocation(location);

		// Show results and use data button
		weatherResults.style.display = "block";
		const outputSection = document.getElementById("output");
		if (outputSection) {
			outputSection.style.display = "block";
		}
		
		// Add event listener to the "Use This Data" button
		const useDataBtn = document.getElementById("useWeatherDataBtn");
		if (useDataBtn) {
			// Remove any existing event listeners
			const newUseDataBtn = useDataBtn.cloneNode(true);
			useDataBtn.parentNode.replaceChild(newUseDataBtn, useDataBtn);
			
			// Add the event listener to the new button
			newUseDataBtn.addEventListener("click", useWeatherData);
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
		const historyString = localStorage.getItem("locationHistory");
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
		const storedHistory = localStorage.getItem("locationHistory");
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
	const historyDropdown = document.getElementById("locationHistory");
	if (!historyDropdown || !history || !history.length) return;

	// Clear existing options
	historyDropdown.innerHTML = "";

	// Add default option
	const defaultOption = document.createElement("option");
	defaultOption.value = "";
	defaultOption.textContent = "Recent locations...";
	defaultOption.disabled = true;
	defaultOption.selected = true;
	historyDropdown.appendChild(defaultOption);

	// Add history options
	history.forEach((location) => {
		const option = document.createElement("option");
		option.value = location;
		option.textContent = location;
		historyDropdown.appendChild(option);
	});

	// Show the dropdown
	historyDropdown.style.display = "block";

	// Add change event listener
	historyDropdown.addEventListener("change", function () {
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
	if (
		weatherCache[key] &&
		Date.now() - weatherCache[key].timestamp < CACHE_DURATION
	) {
		console.log(`Using cached data for ${key}`);
		return true;
	}
	return false;
}

// Cache weather data
function cacheWeatherData(key, data) {
	weatherCache[key] = {
		data: data,
		timestamp: Date.now(),
	};
	console.log(`Cached weather data for ${key}`);
}

// Add new function to fetch forecast data
async function fetchForecastByCoordinates(lat, lon) {
	try {
		// Fetch forecast data from our proxy server
		const response = await fetch(
			`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}`,
			{
				method: 'GET',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			throw new Error(`Forecast API error: ${response.status}`);
		}

		const data = await response.json();
		
		// Display the forecast data
		displayForecast(data);
	} catch (error) {
		console.error("Error fetching forecast data:", error);
		// Don't show alert for forecast errors to avoid multiple alerts
		
		// Clear forecast container
		if (forecastContainer) {
			forecastContainer.innerHTML = `<p class="error-message">Forecast data unavailable: ${error.message}</p>`;
		}
	}
}

// Add new function to display forecast data
function displayForecast(data) {
	if (!forecastContainer || !data || !data.list) return;
	
	// Clear previous forecast
	forecastContainer.innerHTML = '';
	
	// Group forecast by day
	const dailyForecasts = {};
	
	// Process forecast data
	data.list.forEach(item => {
		const date = new Date(item.dt * 1000);
		const day = date.toLocaleDateString();
		
		// Only keep one forecast per day (noon if possible)
		if (!dailyForecasts[day] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[day].dt * 1000).getHours() - 12)) {
			dailyForecasts[day] = item;
		}
	});
	
	// Create forecast items (limit to 5 days)
	Object.values(dailyForecasts).slice(0, 5).forEach(forecast => {
		const date = new Date(forecast.dt * 1000);
		const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
		const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		
		const forecastItem = document.createElement('div');
		forecastItem.className = 'forecast-item';
		forecastItem.innerHTML = `
			<div class="forecast-date">${dayName}, ${monthDay}</div>
			<div class="forecast-icon">
				${forecast.weather && forecast.weather[0] && forecast.weather[0].icon ? 
				  `<img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">` : 
				  ''}
			</div>
			<div class="forecast-temp">${forecast.main.temp.toFixed(1)}°C</div>
			<div class="forecast-description">${forecast.weather[0].description}</div>
			<div class="forecast-detail">
				<span>Humidity:</span>
				<span>${forecast.main.humidity}%</span>
			</div>
			<div class="forecast-detail">
				<span>Wind:</span>
				<span>${forecast.wind.speed} m/s</span>
			</div>
		`;
		
		forecastContainer.appendChild(forecastItem);
	});
	
	// Show the forecast container
	forecastContainer.style.display = 'flex';
	
	// Show the forecast section
	const forecastSection = document.getElementById('B3');
	if (forecastSection) {
		forecastSection.style.display = 'block';
	}
}
