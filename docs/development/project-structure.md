# Project Structure

This document provides a detailed overview of the EVAPOTRAN project structure to help developers understand the codebase organization.

## Directory Structure

```
EVAPOTRAN/
│
├── index.html                # Main landing page
├── calculator.html           # Manual ET₀ calculator
├── epw-import.html           # EPW file import interface
├── epw-heatmap.html          # Weather visualization dashboard
├── live-weather.html         # Live weather data integration
│
├── css/
│   └── style.css             # Main stylesheet
│
├── js/
│   ├── script.js             # Core calculation engine
│   ├── epw-import.js         # EPW file parsing utilities
│   ├── epw-heatmap.js        # Data visualization components
│   └── live-weather.js       # Weather API integration
│
├── img/
│   ├── Flaha_logo.svg        # Vector logo
│   └── Flaha_logo.png        # Fallback raster logo
│
└── docs/                     # Documentation
    ├── user-guide/           # End-user documentation
    ├── technical/            # Technical documentation
    ├── development/          # Developer guidelines
    └── about/                # Project information
```

## Core Files

### HTML Files

- **index.html**: Landing page with navigation to all modules
- **calculator.html**: Manual input form for ET₀ calculation
- **epw-import.html**: Interface for uploading and processing EPW files
- **epw-heatmap.html**: Visualization tools for weather data analysis
- **live-weather.html**: Interface for fetching real-time weather data

### JavaScript Files

- **script.js**: Implements the FAO Penman-Monteith equation and core calculation logic
- **epw-import.js**: Handles parsing and processing of EPW weather files
- **epw-heatmap.js**: Creates data visualizations using D3.js
- **live-weather.js**: Integrates with OpenWeatherMap API for live data

### CSS Files

- **style.css**: Contains all styling for the application, organized by component

## Documentation Structure

The documentation is organized into four main sections:

1. **User Guide**: End-user documentation for using the application
2. **Technical Documentation**: Detailed explanation of algorithms and methods
3. **Development**: Guidelines for developers contributing to the project
4. **About**: License information and contact details

## Build and Deployment

EVAPOTRAN is a static web application with no build process required. To deploy:

1. Copy all files to a web server
2. Ensure the directory structure is maintained
3. Access via a web browser

For local development, simply open any HTML file in a web browser.

## Server Components

### Performance Optimization

The server implements several performance optimization techniques:

- **server.js**: Core server with performance optimizations
  - API response caching using `node-cache`
  - Rate limiting with `express-rate-limit`
  - Response compression with `compression`
  - Request logging with `morgan`

### Scripts

The `scripts/server/` directory contains server management scripts:

- **optimize-server.sh**: Installs and configures performance optimization dependencies
- **restart-server.sh**: Safely restarts the server while preserving sessions
- **fix-api-key.sh**: Updates API keys and ensures proper configuration
- **debug-api-key.sh**: Diagnoses API key configuration issues
