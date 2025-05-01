/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 *
 * @format
 */

// API configuration
const API_BASE_URL = "http://localhost:3000/api"; // Change this to your deployed server URL in production

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
			<p>Check the server setup instructions in the README file.</p>
		`;
		document.querySelector(".container").prepend(warningEl);
	}

	// Add event listeners
	if (fetchWeatherBtn) {
		fetchWeatherBtn.addEventListener("click", fetchWeatherData);
	}

	if (useWeatherDataBtn) {
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
			alert(`Geolocation error: ${error.message}`);
		},
		{
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
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
	const location = locationInput.value.trim();
	if (!location) {
		alert("Please enter a location");
		return;
	}

	try {
		// Check cache first
		if (checkCache(location)) {
			processWeatherData(weatherCache[location].data);
			return;
		}

		// Show loading indicator
		loadingIndicator.style.display = "block";

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
		loadingIndicator.style.display = "none";
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
	// Extract relevant weather parameters
	const weatherData = {
		temperature: data.main.temp,
		windSpeed: data.wind.speed,
		relativeHumidity: data.main.humidity,
		atmosphericPressure: data.main.pressure / 10, // Convert hPa to kPa
		latitude: data.coord.lat,
		longitude: data.coord.lon,
		location: `${data.name}, ${data.sys.country}`,
		timestamp: new Date(data.dt * 1000),
	};

	// Calculate day of year
	const dayOfYear = getDayOfYear(weatherData.timestamp);
	weatherData.dayNumber = dayOfYear;

	// Estimate sunshine duration based on weather conditions
	weatherData.sunshineDuration = estimateSunshineDuration(
		data.weather[0].id,
		data.clouds.all
	);

	// Store data for later use
	localStorage.setItem("liveWeatherData", JSON.stringify(weatherData));

	// Display the weather data
	displayWeatherData(weatherData);
	
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
	// Get the stored weather data
	const weatherData = JSON.parse(localStorage.getItem("liveWeatherData"));
	
	if (!weatherData) {
		alert("No weather data available. Please fetch weather data first.");
		return;
	}
	
	// Store data in localStorage for the calculator
	localStorage.setItem(
		"etoCalcData",
		JSON.stringify({
			temperature: weatherData.temperature,
			windSpeed: weatherData.windSpeed,
			relativeHumidity: weatherData.relativeHumidity,
			atmosphericPressure: weatherData.atmosphericPressure,
			elevation: 0, // We don't get elevation from the API, could use a geocoding API for this
			latitude: weatherData.latitude,
			dayNumber: weatherData.dayNumber,
			sunshineDuration: weatherData.sunshineDuration,
		})
	);
	
	// Redirect to the calculator page
	window.location.href = "calculator.html";
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











