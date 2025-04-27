<!-- @format -->

# FlahaCalc - Horticulture and Agriculture Calculators

FlahaCalc is a versatile and comprehensive web application that offers a set of specialized calculators tailored for Horticulturists, Agronomists, Landscapers, and Engineers. Whether you're involved in plant cultivation, irrigation management, fertilization, or hydroponic solutions, FlahaCalc provides the tools you need to streamline your work and make informed decisions.

## Project Structure

```
EVAPOTRAN/
│
├── index.html           # Main landing page with options
├── calculator.html      # Manual ET₀ calculator page
├── epw-import.html      # EPW weather file import page
├── epw-heatmap.html     # EPW data visualization page
├── live-weather.html    # Live weather data fetching page
│
├── css/
│   └── style.css        # Main stylesheet for the application
│
├── js/
│   ├── script.js        # Main calculator logic
│   ├── epw-import.js    # EPW file parsing and data handling
│   ├── epw-heatmap.js   # EPW data visualization logic
│   └── live-weather.js  # Live weather API integration
│
└── img/
    ├── Flaha_logo.svg   # Vector logo
    └── Flaha_logo.png   # Fallback raster logo
```

## Flaha Calc - Evapotranspiration Calculator Flow Chart

### Flow chart representation of the application:

```
┌─────────────────┐
│                 │
│   index.html    │
│  (Entry Point)  │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
<<<<<<< HEAD
│                      User Selects Option                        │
│                                                                 │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│               │   │               │   │               │   │               │
│ epw-import.html│   │live-weather.html│   │ calculator.html │   │ epw-heatmap.html│
│               │   │               │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │                   │
        ▼                   ▼                   │                   ▼
┌───────────────┐   ┌───────────────┐          │           ┌───────────────┐
│  Upload EPW   │   │  Fetch Live   │          │           │  Upload EPW   │
│ Weather File  │   │ Weather Data  │          │           │ Weather File  │
└───────┬───────┘   └───────┬───────┘          │           └───────┬───────┘
        │                   │                   │                   │
        ▼                   ▼                   │                   ▼
┌───────────────┐   ┌───────────────┐          │           ┌───────────────┐
│   Parse EPW   │   │  Process API  │          │           │   Parse EPW   │
│     Data      │   │   Response    │          │           │     Data      │
└───────┬───────┘   └───────┬───────┘          │           └───────┬───────┘
        │                   │                   │                   │
        ▼                   ▼                   │                   ▼
┌───────────────┐   ┌───────────────┐          │           ┌───────────────┐
│  Select Day   │   │    Display    │          │           │   Generate    │
│ from EPW Data │   │ Weather Info  │          │           │   Heatmaps    │
└───────┬───────┘   └───────┬───────┘          │           └───────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   Input Climate Parameters                      │
│                                                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Calculate Reference Evapotranspiration             │
│                   (FAO Penman-Monteith Method)                  │
│                                                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                       Display ET₀ Results                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
│                       User Selects Option                       │
│                                                                 │
└───────┬───────────────────┬───────────────────┬────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│               │   │               │   │               │
│ epw-import.html │ │live-weather.html│ │ calculator.html │
│               │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   │
┌───────────────┐   ┌───────────────┐          │
│ Upload EPW    │   │ Fetch Live    │          │
│ Weather File  │   │ Weather Data  │          │
└───────┬───────┘   └───────┬───────┘          │
        │                   │                   │
        ▼                   ▼                   │
┌───────────────┐   ┌───────────────┐          │
│ Parse EPW     │   │ Process API   │          │
│ Data          │   │ Response      │          │
└───────┬───────┘   └───────┬───────┘          │
        │                   │                   │
        ▼                   ▼                   │
┌───────────────┐   ┌───────────────┐          │
│ User Chooses  │   │ Display       │          │
│ Action        │   │ Weather Info  │          │
└───┬─────┬─────┘   └───────┬───────┘          │
    │     │                 │                   │
    │     │                 │                   │
    │     ▼                 ▼                   ▼
    │  ┌──────────────────────────────────────────────────────┐
    │  │                                                      │
    │  │              Input Climate Parameters                │
    │  │                                                      │
    │  └──────────────────────┬───────────────────────────────┘
    │                         │
    │                         ▼
    │  ┌──────────────────────────────────────────────────────┐
    │  │                                                      │
    │  │         Calculate Reference Evapotranspiration       │
    │  │             (FAO Penman-Monteith Method)            │
    │  │                                                      │
    │  └──────────────────────┬───────────────────────────────┘
    │                         │
    │                         ▼
    │  ┌──────────────────────────────────────────────────────┐
    │  │                                                      │
    │  │                Display ET₀ Results                   │
    │  │                                                      │
    │  └──────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────┐
│               │
│ epw-heatmap.html │
│               │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Generate      │
│ Heatmaps      │
└───────────────┘
>>>>>>> 91c65573e4d80027365ea914d51043704bdfcc4f
```

## Features

- **Evapotranspiration Calculator:** Calculate the rate at which water is lost from the soil through evaporation and transpiration, aiding in irrigation planning.
- **Irrigation Schedule Planner:** Create customized irrigation schedules based on various factors like plant types, soil moisture levels, and climate conditions.
- **Fertilizers Program Generator:** Generate optimized fertilization plans to meet specific plant nutrient requirements, promoting healthy growth and yield.
- **Hydroponic Solution Calculator:** Design nutrient solutions for hydroponic systems, ensuring optimal nutrient concentrations for plants.

## License

This project is licensed under the [GNU General Public License (GPL) version 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html). The GPL v3 is a copyleft license that ensures any modifications or derivative works of FlahaCalc will also be released under the same license, preserving the open-source nature of the project and encouraging collaboration within the community.

Feel free to use, modify, and distribute FlahaCalc under the terms of the GPL v3. We welcome contributions and improvements from the community to make FlahaCalc even more powerful and useful for professionals in the field of horticulture and agriculture.

Let's cultivate a thriving and collaborative ecosystem together!
