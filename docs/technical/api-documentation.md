# API Documentation

This document provides detailed information about the JavaScript functions and objects used in EVAPOTRAN.

## Core Calculation Module (script.js)

### ET₀ Calculation Functions

#### `calculateET0(params)`

Calculates reference evapotranspiration using the FAO Penman-Monteith method.

**Parameters:**
- `params` (Object): An object containing the following properties:
  - `tmin` (Number): Minimum daily temperature in °C
  - `tmax` (Number): Maximum daily temperature in °C
  - `rhmin` (Number): Minimum relative humidity in %
  - `rhmax` (Number): Maximum relative humidity in %
  - `u2` (Number): Wind speed at 2m height in m/s
  - `n` (Number): Actual sunshine hours in hours
  - `lat` (Number): Latitude in decimal degrees
  - `elev` (Number): Elevation in meters
  - `doy` (Number): Day of year (1-365)

**Returns:**
- (Object): An object containing:
  - `et0` (Number): Reference evapotranspiration in mm/day
  - `intermediateParams` (Object): All intermediate calculation parameters

**Example:**
```javascript
const result = calculateET0({
  tmin: 15.0,
  tmax: 28.5,
  rhmin: 45,
  rhmax: 85,
  u2: 2.1,
  n: 8.5,
  lat: 35.2,
  elev: 210,
  doy: 182
});

console.log(`ET₀: ${result.et0.toFixed(2)} mm/day`);
```

#### `calculateRadiation(lat, doy, n, N)`

Calculates solar radiation parameters.

**Parameters:**
- `lat` (Number): Latitude in decimal degrees
- `doy` (Number): Day of year (1-365)
- `n` (Number): Actual sunshine hours
- `N` (Number): Maximum possible sunshine hours

**Returns:**
- (Object): An object containing radiation parameters

### Utility Functions

#### `saturationVaporPressure(temp)`

Calculates saturation vapor pressure at a given temperature.

**Parameters:**
- `temp` (Number): Temperature in °C

**Returns:**
- (Number): Saturation vapor pressure in kPa

#### `slopeVaporPressureCurve(temp)`

Calculates the slope of the saturation vapor pressure curve.

**Parameters:**
- `temp` (Number): Temperature in °C

**Returns:**
- (Number): Slope in kPa/°C

## EPW Import Module (epw-import.js)

### `parseEPWFile(fileContent)`

Parses an EPW file and extracts weather data.

**Parameters:**
- `fileContent` (String): The content of the EPW file as text

**Returns:**
- (Object): An object containing:
  - `location` (Object): Location information
  - `data` (Array): Hourly weather data for the entire year

### `extractDailyData(epwData, dayOfYear)`

Extracts daily averages from hourly EPW data.

**Parameters:**
- `epwData` (Array): Hourly weather data from EPW file
- `dayOfYear` (Number): Day of year (1-365)

**Returns:**
- (Object): Daily average values for all weather parameters

## Visualization Module (epw-heatmap.js)

### `createHeatmap(container, data, options)`

Creates a heatmap visualization.

**Parameters:**
- `container` (String|Element): The container element or its ID
- `data` (Array): 2D array of values to visualize
- `options` (Object): Configuration options for the heatmap

**Returns:**
- (Object): The heatmap instance

### `createTimeSeriesChart(container, data, options)`

Creates a time series chart.

**Parameters:**
- `container` (String|Element): The container element or its ID
- `data` (Object): Data series to plot
- `options` (Object): Configuration options for the chart

**Returns:**
- (Object): The chart instance

## Live Weather Module (live-weather.js)

### `fetchWeatherData(location, apiKey)`

Fetches current weather data from OpenWeatherMap API.

**Parameters:**
- `location` (String|Object): Location name or coordinates object
- `apiKey` (String): OpenWeatherMap API key

**Returns:**
- (Promise): Resolves to weather data object

### `weatherToET0Params(weatherData)`

Converts weather API data to parameters needed for ET₀ calculation.

**Parameters:**
- `weatherData` (Object): Weather data from API

**Returns:**
- (Object): Parameters formatted for ET₀ calculation