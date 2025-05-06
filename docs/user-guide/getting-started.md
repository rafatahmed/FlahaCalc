# Getting Started with EVAPOTRAN

This guide will help you get started with the EVAPOTRAN calculator, a comprehensive tool for calculating reference evapotranspiration using the FAO Penman-Monteith method.

## What is Evapotranspiration?

Evapotranspiration (ET) is the combined process of water evaporation from soil and plant surfaces and transpiration from plants. Reference evapotranspiration (ET₀) represents the evapotranspiration rate from a reference surface, not short of water.

## Accessing EVAPOTRAN

EVAPOTRAN is a web-based application that runs in your browser. You can access it by:

1. Opening the `index.html` file in your web browser
2. Navigating to the hosted version at [https://flaha.org/evapotran](https://flaha.org-evapotran) (if available)

## Navigation

The EVAPOTRAN application consists of several modules:

1. **Home**: The landing page with an overview and navigation options
2. **Manual Calculator**: Enter climate data manually to calculate ET₀
3. **EPW Import**: Upload EnergyPlus Weather files to extract climate data
4. **Weather Visualization**: Generate heatmaps and visualize weather patterns
5. **Live Weather**: Connect to real-time weather data for immediate calculations

## Data Input Methods

EVAPOTRAN offers three methods for data input:

### 1. Manual Input

Enter climate parameters directly through form fields:
- Temperature
- Wind speed
- Relative humidity
- Elevation
- Latitude
- Day of year
- Sunshine duration

### 2. EPW File Import

Upload EnergyPlus Weather (EPW) files containing hourly weather data:
1. Click on "EPW Import" in the navigation menu
2. Click "Choose File" and select an EPW file from your computer
3. Click "Upload and Process" to extract the climate data

### 3. Live Weather API

Fetch current weather data for a specific location:
1. Click on "Live Weather" in the navigation menu
2. Enter a location (city name or coordinates)
3. Click "Fetch Weather Data" to retrieve current conditions

## Next Steps

- Learn how to use the [Manual Calculator](manual-calculator)
- Understand how to [import EPW files](epw-import)
- Explore [weather visualization](weather-visualization) features
- Try the [live weather](live-weather) integration