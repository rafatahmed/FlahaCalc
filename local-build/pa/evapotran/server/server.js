/** @format */

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const morgan = require("morgan");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
const weatherCache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

// Load environment variables
dotenv.config();
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
	path.join(__dirname, "access.log"),
	{ flags: "a" }
);

// Enable compression
app.use(compression());

// Setup request logging
app.use(morgan("combined", { stream: accessLogStream }));

// Enable CORS
app.use(cors());
app.use(express.json());

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Too many requests, please try again later." },
});

// Apply to all API routes
app.use("/api", apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, "../")));

// Add a test endpoint to verify server connectivity
app.get("/api/test", (req, res) => {
	res.json({
		status: "ok",
		message: "Server is running correctly",
		timestamp: new Date().toISOString(),
	});
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
	try {
		const { q, lat, lon } = req.query;
		
		// Check if we have a cached response
		const cacheKey = q ? `weather_${q}` : `weather_${lat}_${lon}`;
		const cachedResponse = weatherCache.get(cacheKey);
		
		if (cachedResponse) {
			console.log('Returning cached weather data');
			return res.json(cachedResponse);
		}
		
		// No cached data, make API call
		let url;
		if (q) {
			url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${WEATHER_API_KEY}&units=metric`;
		} else if (lat && lon) {
			url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
		} else {
			return res.status(400).json({ error: 'Please provide a city name (q) or coordinates (lat & lon)' });
		}
		
		console.log('Fetching weather data from:', url.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN'));
		const response = await axios.get(url);
		
		// Return the full response data from OpenWeatherMap
		// This ensures all expected fields are available to the client
		const weatherData = response.data;
		
		// Cache the response
		weatherCache.set(cacheKey, weatherData);
		
		console.log('Returning weather data:', weatherData);
		res.json(weatherData);
	} catch (error) {
		console.error('Weather API error:', error.message);
		res.status(500).json({ error: error.message });
	}
});

// Add a forecast API endpoint
app.get('/api/forecast', async (req, res) => {
	try {
		const { lat, lon } = req.query;
		
		if (!lat || !lon) {
			return res.status(400).json({ error: 'Please provide coordinates (lat & lon)' });
		}
		
		// Check if we have a cached response
		const cacheKey = `forecast_${lat}_${lon}`;
		const cachedResponse = weatherCache.get(cacheKey);
		
		if (cachedResponse) {
			console.log('Returning cached forecast data');
			return res.json(cachedResponse);
		}
		
		// No cached data, make API call
		const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
		
		console.log(`Fetching forecast data from: ${url.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN')}`);
		const response = await axios.get(url);
		
		// Return the full response data
		const forecastData = response.data;
		
		// Cache the response
		weatherCache.set(cacheKey, forecastData);
		
		console.log('Returning forecast data');
		res.json(forecastData);
	} catch (error) {
		console.error('Forecast API error:', error.message);
		res.status(500).json({ error: error.message });
	}
});

// Catch-all route to serve the main index.html
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "../index.html"));
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`API key configured: ${WEATHER_API_KEY ? "Yes" : "No"}`);
});
