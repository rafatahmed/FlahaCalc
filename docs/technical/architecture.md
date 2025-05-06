# Application Architecture

EVAPOTRAN follows a modular client-side architecture designed for performance and ease of maintenance.

## Overview

The application is built using vanilla JavaScript, HTML5, and CSS3, with no external frameworks or backend dependencies. This approach ensures:

- Fast loading times
- No installation requirements
- Cross-platform compatibility
- Easy deployment

## Component Structure

```
EVAPOTRAN/
│
├── index.html           # Main landing page with navigation options
├── calculator.html      # Manual ET₀ calculator interface
├── epw-import.html      # EPW weather file import functionality
├── epw-heatmap.html     # Weather data visualization dashboard
├── live-weather.html    # Real-time weather data integration
│
├── css/
│   └── style.css        # Unified stylesheet for consistent UI
│
├── js/
│   ├── script.js        # Core calculation engine
│   ├── epw-import.js    # EPW file parsing utilities
│   ├── epw-heatmap.js   # Data visualization components
│   └── live-weather.js  # Weather API integration services
│
└── img/
    └── Flaha_logo.svg   # Vector logo for high-resolution displays
```

## Data Flow

### Input Methods

EVAPOTRAN offers three methods for data input:

1. **Manual Input**: Users directly enter climate parameters through form fields
2. **EPW File Import**: Users upload EnergyPlus Weather (EPW) files containing hourly weather data
3. **Live Weather API**: Application fetches current weather data from OpenWeatherMap API

### Processing Pipeline

1. **Data Collection**: Climate data is gathered from one of the three input methods
2. **Data Validation**: Input values are validated for range and completeness
3. **Parameter Calculation**: Intermediate parameters are calculated (e.g., solar radiation, vapor pressure)
4. **ET₀ Calculation**: The FAO Penman-Monteith equation is applied to calculate reference evapotranspiration
5. **Result Presentation**: Results are displayed with detailed calculation sheets

### Storage Strategy

- **Session Storage**: Stores temporary calculation results and user preferences
- **Local Storage**: Caches EPW file data to avoid repeated uploads
- **No Server-Side Storage**: All data processing happens client-side for privacy

## User Interface Design

The UI follows a consistent design pattern across all modules:

- **Header**: Logo, application title, and navigation menu
- **Content Area**: Input forms, calculation results, and visualizations
- **Footer**: Copyright information and additional links

## Performance Considerations

For handling large datasets and complex calculations, EVAPOTRAN implements:

- Asynchronous processing for EPW file parsing
- Optimized calculation algorithms
- Efficient data visualization techniques

See [Performance Optimization](performance-optimization) for more details.