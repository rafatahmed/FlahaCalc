# Understanding Climate Data for Evapotranspiration

This guide explains the climate parameters used in evapotranspiration calculations and how to obtain reliable data for your calculations.

## Essential Climate Parameters

### Temperature

**What it is**: The measure of heat energy in the air, typically recorded as minimum and maximum daily values.

**How it affects ET₀**: Higher temperatures increase evaporation rates by providing more energy for the phase change from liquid to vapor.

**Measurement units**: Degrees Celsius (°C) or Fahrenheit (°F)

**Data sources**:
- Weather stations
- National meteorological services
- Satellite-derived products
- EPW files

### Solar Radiation

**What it is**: The electromagnetic radiation emitted by the sun that reaches the Earth's surface.

**How it affects ET₀**: Provides the energy that drives evaporation; higher radiation leads to higher evapotranspiration rates.

**Measurement units**: Megajoules per square meter per day (MJ/m²-day) or Watts per square meter (W-m²)

**Data sources**:
- Pyranometers at weather stations
- Satellite-derived products
- Estimated from sunshine hours

### Humidity

**What it is**: The amount of water vapor present in the air, often measured as relative humidity (percentage of maximum possible humidity at a given temperature).

**How it affects ET₀**: Lower humidity increases the vapor pressure deficit, accelerating evapotranspiration.

**Measurement units**: Percentage (%) for relative humidity; kilopascals (kPa) for vapor pressure

**Data sources**:
- Hygrometers at weather stations
- Psychrometers (wet and dry bulb thermometers)
- Calculated from dew point temperature

### Wind Speed

**What it is**: The rate of air movement across the Earth's surface.

**How it affects ET₀**: Wind removes humid air near plant and soil surfaces, replacing it with drier air that can accept more moisture.

**Measurement units**: Meters per second (m-s) or kilometers per hour (km-h)

**Data sources**:
- Anemometers at weather stations
- Reanalysis datasets
- Airport weather reports

### Atmospheric Pressure

**What it is**: The force exerted by the weight of air above a given point.

**How it affects ET₀**: Affects the psychrometric constant used in ET₀ calculations.

**Measurement units**: Kilopascals (kPa)

**Data sources**:
- Barometers at weather stations
- Estimated from elevation

## Data Quality Considerations

### 1. Temporal Resolution

Different temporal resolutions serve different purposes:

- **Hourly data**: Best for detailed studies and daily calculations
- **Daily data**: Suitable for most irrigation scheduling
- **Monthly averages**: Useful for long-term planning
- **Annual data**: Appropriate for regional water resource planning

### 2. Spatial Representativeness

Consider how well your data source represents your specific location:

- **Distance from weather station**: Data becomes less representative with distance
- **Topographic differences**: Elevation, slope, and aspect affect local climate
- **Coastal vs. inland**: Maritime influence creates different microclimates
- **Urban vs. rural**: Urban heat islands affect temperature readings

### 3. Data Completeness

Missing data can significantly impact calculations:

- Check for gaps in time series data
- Understand how missing values are handled in your data source
- Consider using multiple data sources to fill gaps

### 4. Measurement Height

Standard measurement heights for weather parameters:

- Temperature and humidity: 2 meters above ground
- Wind speed: 10 meters above ground (often converted to 2m for ET₀ calculations)
- Precipitation: Ground level

## Data Sources for Evapotranspiration Calculations

### 1. Weather Stations

**Pros**:
- High accuracy when properly maintained
- Direct measurements of all required parameters
- Often include long historical records

**Cons**:
- Limited spatial coverage
- Potential for instrument errors
- May have data gaps

**Examples**:
- NOAA weather stations
- Agricultural research station networks
- Airport weather stations

### 2. EPW (EnergyPlus Weather) Files

**Pros**:
- Comprehensive hourly data for entire years
- Standardized format
- Available for thousands of locations worldwide

**Cons**:
- May use interpolated or modeled data
- Limited to specific locations
- May not be updated annually

**Sources**:
- EnergyPlus Weather Data repository
- Climate.OneBuilding.Org
- EPW Map tool

### 3. Satellite and Reanalysis Data

**Pros**:
- Global coverage
- Consistent methodology
- No gaps in spatial coverage

**Cons**:
- Lower accuracy than direct measurements
- Coarser spatial resolution
- May require processing before use

**Examples**:
- NASA POWER dataset
- ERA5 reanalysis
- CHIRPS precipitation data

### 4. Agricultural Weather Networks

**Pros**:
- Specifically designed for agricultural applications
- Often include soil moisture and temperature
- Typically well-maintained

**Cons**:
- Limited to agricultural regions
- May require subscription or membership
- Variable data quality standards

**Examples**:
- California Irrigation Management Information System (CIMIS)
- CoAgMet (Colorado Agricultural Meteorological Network)
- Various national and regional agricultural networks

## Converting Between Data Formats

EVAPOTRAN supports multiple data input methods, but you may need to convert between formats:

1. **Unit conversions**:
   - Temperature: °F to °C: (°F - 32) × 5/9
   - Wind speed: km/h to m/s: km/h ÷ 3.6
   - Solar radiation: W/m² to MJ/m²/day: W/m² × 0.0864

2. **Estimating missing parameters**:
   - Solar radiation from sunshine hours
   - Humidity from dew point temperature
   - Wind speed adjustments for measurement height

3. **Temporal aggregation**:
   - Converting hourly to daily data
   - Calculating daily averages from min/max values

By understanding these climate parameters and data sources, you can ensure more accurate evapotranspiration calculations and make better-informed water management decisions.