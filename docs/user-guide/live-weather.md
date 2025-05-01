# Live Weather

The Live Weather module allows you to fetch current weather data from online sources and calculate real-time evapotranspiration.

## Accessing Live Weather

From the EVAPOTRAN home page, click on the "Live Weather" option or navigate directly to `live-weather.html`.

## Setting Up Weather API

The Live Weather feature uses the OpenWeatherMap API to fetch current weather data. To use this feature:

1. **Get an API Key**:
   - Register for a free account at [OpenWeatherMap](https://openweathermap.org/)
   - Navigate to your account page and copy your API key

2. **Enter API Key**:
   - In the Live Weather page, click "Settings"
   - Paste your API key in the designated field
   - Click "Save Settings"

Your API key will be saved in your browser's local storage for future use.

## Fetching Weather Data

### By Location Name

1. Enter a city name in the search field (e.g., "Paris, France")
2. Click "Get Weather Data"
3. The application will fetch current weather conditions

### By Coordinates

1. Click "Use My Location" to use your device's GPS
2. Alternatively, enter latitude and longitude manually
3. Click "Get Weather Data"

### By Weather Station ID

For more precise data:

1. Click "Advanced Options"
2. Enter a specific weather station ID
3. Click "Get Weather Data"

## Understanding Weather Data

After fetching data, you'll see:

1. **Current Conditions**: Temperature, humidity, wind speed, etc.
2. **Location Details**: Coordinates, elevation, timezone
3. **Data Source**: Weather station information and data timestamp

## Calculating Real-Time ET₀

1. Review the fetched weather parameters
2. Adjust any parameters if needed (e.g., if you have more accurate local measurements)
3. Click "Calculate ET₀"
4. View the calculated reference evapotranspiration

## Data Limitations

When using live weather data, be aware of these limitations:

1. **Data Resolution**: Most weather APIs provide current conditions, not hourly averages
2. **Missing Parameters**: Some parameters required for ET₀ calculation might be estimated
3. **Update Frequency**: Free API tiers may have limited update frequency
4. **Geographic Precision**: Data may come from weather stations some distance from your exact location

## Saving and Tracking Data

The Live Weather module allows you to:

1. **Save Calculations**: Store results for specific locations
2. **Track Changes**: Monitor ET₀ changes throughout the day
3. **Export Data**: Download current conditions and calculations

## Offline Use

If you lose internet connection:

1. The application will notify you of connection issues
2. You can still use previously cached weather data
3. Manual calculator remains available for offline use