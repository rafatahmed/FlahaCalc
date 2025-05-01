# EVAPOTRAN Weather API Proxy

This is a simple proxy server for the OpenWeatherMap API to keep the API key secure.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your OpenWeatherMap API key:
   ```
   WEATHER_API_KEY=your_api_key_here
   ```

3. Start the server:
   ```
   npm start
   ```

## Endpoints

- `/api/weather` - Get current weather data
  - Query parameters:
    - `lat` & `lon` - Coordinates
    - OR `q` - City name

- `/api/forecast` - Get 5-day forecast
  - Query parameters:
    - `lat` & `lon` - Coordinates (required)

## Deployment

For production, deploy this server to a hosting service like:
- Heroku
- Vercel
- DigitalOcean
- AWS

After deployment, update the `API_BASE_URL` in `live-weather.js` to point to your deployed server URL.