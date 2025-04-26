/**
 * Live Weather Data Integration
 * This module fetches current weather data from OpenWeatherMap API
 * and formats it for use in the ETo calculator
 *
 * @format
 */

// API configuration
const WEATHER_API_KEY = "0f6b5da65f63c57f2db7d6cb40f39965"; // Replace with your actual API key
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

// DOM elements
let locationInput;
let fetchWeatherBtn;
let weatherResults;
let useWeatherDataBtn;
let loadingIndicator;

// Initialize the module
document.addEventListener("DOMContentLoaded", function () {
	// Get DOM elements
	locationInput = document.getElementById("locationInput");
	fetchWeatherBtn = document.getElementById("fetchWeatherBtn");
	weatherResults = document.getElementById("weatherResults");
	useWeatherDataBtn = document.getElementById("useWeatherDataBtn");
	loadingIndicator = document.getElementById("loadingIndicator");

	// Add event listeners
	fetchWeatherBtn.addEventListener("click", fetchWeatherData);
	useWeatherDataBtn.addEventListener("click", transferDataToCalculator);

	// Hide results and loading indicator initially
	weatherResults.style.display = "none";
	loadingIndicator.style.display = "none";
	useWeatherDataBtn.style.display = "none";
});

// Fetch weather data from API
async function fetchWeatherData() {
	const location = locationInput.value.trim();

	if (!location) {
		alert("Please enter a location");
		return;
	}

	// Show loading indicator
	loadingIndicator.style.display = "block";
	weatherResults.style.display = "none";
	useWeatherDataBtn.style.display = "none";

	try {
		// Fetch data from OpenWeatherMap API
		const response = await fetch(
			`${WEATHER_API_URL}?q=${encodeURIComponent(
				location
			)}&units=metric&appid=${WEATHER_API_KEY}`
		);

		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}

		const data = await response.json();

		// Process and display the weather data
		processWeatherData(data);

		// Show results and use data button
		weatherResults.style.display = "block";
		useWeatherDataBtn.style.display = "block";
	} catch (error) {
		console.error("Error fetching weather data:", error);
		alert(`Failed to fetch weather data: ${error.message}`);
	} finally {
		// Hide loading indicator
		loadingIndicator.style.display = "none";
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
}

// Display weather data in the results section
function displayWeatherData(data) {
	// Clear previous results
	weatherResults.innerHTML = "";

	// Create table to display weather data
	const table = document.createElement("table");

	// Add table header
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");
	["Parameter", "Value", "Unit"].forEach((text) => {
		const th = document.createElement("th");
		th.textContent = text;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	// Add table body
	const tbody = document.createElement("tbody");

	// Add rows for each parameter
	addDataRow(tbody, "Location", data.location, "");
	addDataRow(tbody, "Date & Time", data.timestamp.toLocaleString(), "");
	addDataRow(tbody, "Temperature", data.temperature.toFixed(1), "°C");
	addDataRow(tbody, "Wind Speed", data.windSpeed.toFixed(1), "m/s");
	addDataRow(tbody, "Relative Humidity", data.relativeHumidity.toFixed(0), "%");
	addDataRow(
		tbody,
		"Atmospheric Pressure",
		data.atmosphericPressure.toFixed(2),
		"kPa"
	);
	addDataRow(tbody, "Latitude", data.latitude.toFixed(2), "degrees");
	addDataRow(tbody, "Day of Year", data.dayNumber, "");
	addDataRow(
		tbody,
		"Estimated Sunshine Duration",
		data.sunshineDuration.toFixed(1),
		"hours"
	);

	table.appendChild(tbody);
	weatherResults.appendChild(table);
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

// Transfer data to the main calculator
function transferDataToCalculator() {
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
