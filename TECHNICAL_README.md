# FlahaCalc - Technical Documentation

## Technical Architecture

FlahaCalc is built as a client-side web application using vanilla JavaScript, HTML5, and CSS3. The application follows a modular structure with separate files for different functionalities:

### Core Components

- **User Interface**: HTML templates with responsive CSS styling
- **Calculation Engine**: JavaScript modules implementing FAO Penman-Monteith equations
- **Data Processing**: Modules for parsing EPW files and processing weather data
- **Visualization**: D3.js and Chart.js for data visualization and heatmaps

### Directory Structure

```
EVAPOTRAN/
│
├── index.html                # Main landing page with options
├── calculator.html           # Manual ET₀ calculator page
├── epw-import.html           # EPW weather file import page
├── epw-heatmap.html          # EPW data visualization page
├── live-weather.html         # Live weather data fetching page
│
├── css/
│ └── style.css               # Main stylesheet for the application
│
├── js/
│ ├── script.js               # Main calculator logic
│ ├── epw-import.js           # EPW file parsing and data handling
│ ├── epw-heatmap.js          # EPW data visualization logic
│ └── live-weather.js         # Live weather API integration
│
└── img/
  ├── Flaha_logo.svg          # Vector logo
  └── Flaha_logo.png          # Fallback raster logo
```

## Data Flow

### 1. Data Input Methods

FlahaCalc offers three methods for data input:

- **Manual Input**: Users directly enter climate parameters through form fields
- **EPW File Import**: Users upload EnergyPlus Weather (EPW) files containing hourly weather data
- **Live Weather API**: Application fetches current weather data from OpenWeatherMap API

### 2. Data Processing Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Data Input    │────▶│  Data Parsing   │────▶│  Data Validation│
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│                 │     │                 │     │                 │
│ Result Display  │◀────│  ET₀ Calculation│◀────│ Parameter       │
│                 │     │                 │     │ Calculation     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3. Data Storage

- **Session Storage**: Stores temporary calculation results and user preferences
- **Local Storage**: Caches EPW file data to avoid repeated uploads
- **No Server-Side Storage**: All data processing happens client-side for privacy

## Calculation Methodology

### FAO Penman-Monteith Equation

FlahaCalc implements the FAO Penman-Monteith equation for calculating reference evapotranspiration (ET₀):

```
ET₀ = (0.408 × Δ × (Rn - G) + γ × (900 - (T + 273)) × u₂ × (es - ea)) / (Δ + γ × (1 + 0.34 × u₂))
```

Where:
- ET₀ = Reference evapotranspiration [mm day⁻¹]
- Rn = Net radiation at the crop surface [MJ m⁻² day⁻¹]
- G = Soil heat flux density [MJ m⁻² day⁻¹]
- T = Mean daily air temperature at 2 m height [°C]
- u₂ = Wind speed at 2 m height [m s⁻¹]
- es = Saturation vapor pressure [kPa]
- ea = Actual vapor pressure [kPa]
- es - ea = Saturation vapor pressure deficit [kPa]
- Δ = Slope of vapor pressure curve [kPa °C⁻¹]
- γ = Psychrometric constant [kPa °C⁻¹]

### Intermediate Calculations

1. **Saturation Vapor Pressure (es)**:
   - Calculated using exponential function of temperature
   - For daily calculation: average of es at Tmax and es at Tmin

2. **Actual Vapor Pressure (ea)**:
   - Derived from relative humidity and saturation vapor pressure
   - Alternative methods available when RH data is incomplete

3. **Net Radiation (Rn)**:
   - Calculated as the difference between incoming net shortwave radiation and outgoing net longwave radiation
   - Accounts for albedo, cloud cover, and atmospheric conditions

4. **Soil Heat Flux (G)**:
   - For daily calculations, assumed to be 0
   - For monthly calculations, estimated based on temperature differences

## Visualization Techniques

### Heatmap Generation

The EPW data visualization uses D3.js to create calendar heatmaps showing:
- Temperature variations
- Humidity patterns
- Wind speed distribution
- Solar radiation components

The heatmap generation process:
1. Parses EPW data into structured arrays
2. Calculates daily averages for each parameter
3. Maps values to color scales using D3 scale functions
4. Renders SVG elements with appropriate tooltips and legends

## Technical Challenges and Solutions

### EPW File Parsing

**Challenge**: EPW files contain complex hourly weather data in a specific format.

**Solution**: Custom parser that:
- Reads the file line by line
- Extracts header information for location data
- Processes data rows into structured objects
- Validates data ranges and handles missing values

### Cross-Browser Compatibility

**Challenge**: Ensuring consistent behavior across different browsers.

**Solution**:
- Use of standard Web APIs with polyfills where necessary
- CSS fallbacks for newer properties
- SVG with fallback PNG for logo display

## Future Technical Improvements

### 1. Performance Optimization

- Implement Web Workers for EPW file parsing to prevent UI blocking
- Use IndexedDB for more efficient storage of large EPW datasets
- Implement lazy loading for visualization components

### 2. Enhanced Calculations

- Add crop coefficient (Kc) database to calculate crop-specific ET (ETc)
- Implement alternative ET₀ calculation methods (Hargreaves, Priestley-Taylor)
- Add uncertainty analysis for calculation results

### 3. Data Integration

- Implement GeoJSON support for spatial data visualization
- Add API integration with soil databases for improved calculations
- Enable export to common formats (CSV, JSON, Excel)

### 4. User Experience

- Implement progressive web app (PWA) capabilities for offline use
- Add user accounts for saving and sharing calculations
- Develop mobile-optimized interface with touch interactions

### 5. Visualization Enhancements

- Add interactive time-series graphs for temporal analysis
- Implement geospatial visualization for location-based data
- Create comparison tools for multiple datasets

## Contributing to Technical Development

When contributing to the technical aspects of FlahaCalc:

1. Follow the established code structure and naming conventions
2. Document calculations with references to scientific literature
3. Include unit tests for new calculation methods
4. Ensure accessibility compliance for UI components
5. Optimize for performance, especially for large datasets

For more information on contributing, see [CONTRIBUTING.md](CONTRIBUTING).