# Data Processing

This document explains how EVAPOTRAN processes climate data for evapotranspiration calculations.

## Data Input Methods

### Manual Input

When users enter data manually, the application:

1. Validates all input fields for completeness and range constraints
2. Converts units if necessary (e.g., temperature from °F to °C)
3. Applies the calculation pipeline directly

### EPW File Import

EPW (EnergyPlus Weather) files contain hourly weather data for an entire year. The processing pipeline:

1. **File Parsing**: Reads the EPW file as text and splits into header and data sections
2. **Header Extraction**: Extracts location metadata (latitude, longitude, elevation, etc.)
3. **Data Extraction**: Processes hourly records for:
   - Dry bulb temperature
   - Relative humidity
   - Wind speed
   - Atmospheric pressure
   - Solar radiation
4. **Data Aggregation**: Calculates daily averages for use in ET₀ calculations
5. **Data Transfer**: Allows users to select specific days for detailed analysis

### Live Weather API

When fetching live weather data:

1. **API Request**: Sends a request to OpenWeatherMap API with location parameters
2. **Response Parsing**: Extracts relevant climate parameters from the JSON response
3. **Data Transformation**: Converts API units to the units required for ET₀ calculation
4. **Data Validation**: Checks for missing or invalid values and provides defaults if necessary

## Calculation Pipeline

Regardless of the data source, all inputs go through the same calculation pipeline:

1. **Atmospheric Parameters**:
   - Calculate atmospheric pressure from elevation (if not provided)
   - Calculate psychrometric constant
   
2. **Radiation Parameters**:
   - Calculate extraterrestrial radiation
   - Calculate solar radiation
   - Calculate net radiation

3. **Vapor Pressure Parameters**:
   - Calculate saturation vapor pressure
   - Calculate actual vapor pressure
   - Calculate slope of vapor pressure curve

4. **ET₀ Calculation**:
   - Apply the FAO Penman-Monteith equation
   - Format and display results

## Data Visualization Processing

For the weather visualization module:

1. **Data Aggregation**: Calculates daily, monthly, or annual statistics
2. **Data Normalization**: Scales values for consistent visualization
3. **Color Mapping**: Assigns colors based on value ranges
4. **Rendering**: Creates heatmaps, charts, and other visualizations

## Error Handling

The application implements several error handling strategies:

1. **Input Validation**: Prevents calculation with incomplete or invalid data
2. **Fallback Values**: Provides reasonable defaults when optional parameters are missing
3. **Error Messages**: Displays user-friendly error messages for common issues
4. **Data Correction**: Automatically corrects out-of-range values when possible

## Performance Considerations

For large datasets (particularly EPW files), the application:

1. Uses asynchronous processing to prevent UI freezing
2. Implements efficient parsing algorithms
3. Caches processed data in localStorage to avoid repeated calculations