<!-- @format -->

<div align="center">
  <img src="EVAPOTRAN/img/Flaha_logo.svg" alt="Flaha Logo" width="80" height="80" style="vertical-align: middle;">
  <div>
    <h1>Flaha Agri Tech</h1>
    <h3>Flaha Precision Agriculture | FlahaCalc</h3>
    <h2>EVAPOTRAN</h2>
  </div>
</div>

## Overview

EVAPOTRAN is a comprehensive calculator designed for professionals in horticulture, agronomy, landscaping, and agricultural engineering. This web application provides essential tools for precise calculations of evapotranspiration using the FAO Penman-Monteith method, supporting irrigation management and water resource planning.

## Key Features

- **Evapotranspiration Calculator:** Calculate water loss through evaporation and transpiration using the industry-standard FAO Penman-Monteith method
- **Multiple Data Input Options:** Enter climate data manually or import from EPW weather files
- **Weather Data Visualization:** Generate heatmaps and visual representations of climate data
- **Live Weather Integration:** Connect to real-time weather data for immediate calculations

## Application Architecture

The application follows a modular structure with specialized components for different calculation needs:

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
    ├── Flaha_logo.svg   # Vector logo for high-resolution displays
    └── Flaha_logo.png   # Raster fallback for legacy browsers
```

## Application Flow

The diagram below illustrates the user journey and data flow through the application:

```
┌─────────────────┐
│   index.html    │
│  (Entry Point)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      User Selects Option                        │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ epw-import.html│   │live-weather.html│   │ calculator.html │   │ epw-heatmap.html│
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │                   │
        ▼                   ▼                   │                   ▼
┌───────────────┐   ┌───────────────┐          │           ┌───────────────┐
│  Upload EPW   │   │  Fetch Live   │          │           │  Generate     │
│ Weather File  │   │ Weather Data  │          │           │   Heatmaps    │
└───────┬───────┘   └───────┬───────┘          │           └───────────────┘
        │                   │                   │                   
        ▼                   ▼                   │                   
┌───────────────┐   ┌───────────────┐          │           
│   Parse EPW   │   │  Process API  │          │           
│     Data      │   │   Response    │          │           
└───────┬───────┘   └───────┬───────┘          │           
        │                   │                   │                   
        ▼                   ▼                   │                   
┌───────────────┐   ┌───────────────┐          │           
│  Select Day   │   │    Display    │          │           
│ from EPW Data │   │ Weather Info  │          │           
└───────┬───────┘   └───────┬───────┘          │           
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Input Climate Parameters                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Calculate Reference Evapotranspiration             │
│                   (FAO Penman-Monteith Method)                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Display ET₀ Results                       │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

EVAPOTRAN implements the FAO Penman-Monteith method, widely recognized as the international standard for calculating reference evapotranspiration. The application supports multiple data input methods:

- Manual parameter entry
- EPW (EnergyPlus Weather) file import
- Real-time weather data integration via API
- Historical weather data visualization

## License

This project is licensed under the [GNU General Public License (GPL) version 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html). This copyleft license ensures that all modifications and derivative works of EVAPOTRAN must be distributed under the same terms, preserving the open-source nature of the project.

## Contributing

We welcome contributions from the agricultural and software development communities. By collaborating, we can enhance EVAPOTRAN's capabilities and accuracy, making it an even more valuable tool for professionals worldwide.

---

<div align="center">
  <p>© 2023 Flaha Agri Tech | <a href="mailto:info@flaha.org">info@flaha.org</a></p>
  <p><small>Developed by Flaha Precision Agriculture Division</small></p>
</div>
