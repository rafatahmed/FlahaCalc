<!-- @format -->

# FlahaCalc - Horticulture and Agriculture Calculators

![Flaha Logo](EVAPOTRAN/img/Flaha_logo.svg)

## Overview

FlahaCalc is a comprehensive suite of specialized calculators designed for professionals in horticulture, agronomy, landscaping, and agricultural engineering. This web application provides essential tools for precise calculations in plant cultivation, irrigation management, fertilization planning, and hydroponic solution design.

## Key Features

- **Evapotranspiration Calculator:** Calculate water loss through evaporation and transpiration using the industry-standard FAO Penman-Monteith method
- **Irrigation Schedule Planner:** Generate customized irrigation schedules based on plant types, soil conditions, and climate data
- **Fertilizer Program Generator:** Create optimized fertilization plans tailored to specific plant nutrient requirements
- **Hydroponic Solution Calculator:** Design balanced nutrient solutions for hydroponic systems with precise concentration control

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

FlahaCalc implements the FAO Penman-Monteith method, widely recognized as the international standard for calculating reference evapotranspiration. The application supports multiple data input methods:

- Manual parameter entry
- EPW (EnergyPlus Weather) file import
- Real-time weather data integration via API
- Historical weather data visualization

## License

This project is licensed under the [GNU General Public License (GPL) version 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html). This copyleft license ensures that all modifications and derivative works of FlahaCalc must be distributed under the same terms, preserving the open-source nature of the project.

## Contributing

We welcome contributions from the agricultural and software development communities. By collaborating, we can enhance FlahaCalc's capabilities and accuracy, making it an even more valuable tool for professionals worldwide.

---

© 2023 Flaha Agri Tech | [info@flaha.org](mailto:info@flaha.org)
