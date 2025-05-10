# EVAPOTRAN Application

## Setup Instructions

### 1. Set up the API Key

You need to set up an OpenWeatherMap API key for the weather functionality to work:

1. Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api)
2. Run the setup script with your API key:

```bash
# Make the script executable
chmod +x scripts/set-api-key.sh

# Run the script with your API key
./scripts/set-api-key.sh YOUR_API_KEY_HERE
```

### 2. Start the Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
node server.js
```

### 3. Monitor the Application

You can use the monitoring script to check if everything is working correctly:

```bash
# Make the script executable
chmod +x scripts/local-monitor.sh

# Run the monitoring script
./scripts/local-monitor.sh
```

## Troubleshooting

### Weather API Not Working

If you see "API key not configured" errors:

1. Make sure you've set up the API key using the script above
2. Check if the .env file exists in the server directory
3. Verify that the API key is valid by testing it directly:

```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY_HERE"
```

### Server Errors

If the server fails to start:

1. Check for syntax errors in server.js
2. Make sure all dependencies are installed:

```bash
cd server
npm install express cors axios dotenv node-cache
```

3. Check the server logs for more details