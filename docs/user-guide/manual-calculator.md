# Manual Calculator

The Manual Calculator allows you to calculate reference evapotranspiration (ET₀) by entering climate data directly.

## Accessing the Calculator

1. From the EVAPOTRAN home page, click on the "Manual Calculator" option
2. Alternatively, navigate directly to `calculator.html` in your browser

## Input Parameters

The calculator requires the following input parameters:

### Location Information

| Parameter | Description | Units | Example |
|-----------|-------------|-------|---------|
| Latitude | Site latitude (positive for Northern hemisphere) | degrees | 35.2 |
| Elevation | Height above sea level | meters | 210 |
| Day of Year | Day number (1-365) | - | 182 |

### Climate Data

| Parameter | Description | Units | Example |
|-----------|-------------|-------|---------|
| Min Temperature | Minimum daily temperature | °C | 15.0 |
| Max Temperature | Maximum daily temperature | °C | 28.5 |
| Wind Speed | Average wind speed at 2m height | m/s | 2.1 |
| Relative Humidity | Average relative humidity | % | 65 |
| Sunshine Hours | Hours of bright sunshine | hours | 8.5 |

## Calculation Process

1. Enter all required parameters in the form
2. Click the "Calculate ET₀" button
3. Review the results displayed in the results section

## Understanding the Results

The calculator provides:

1. **Reference ET₀ Value**: The daily reference evapotranspiration in mm/day
2. **Detailed Calculation Sheet**: A breakdown of all intermediate parameters:
   - Net radiation
   - Soil heat flux
   - Saturation vapor pressure
   - Actual vapor pressure
   - Vapor pressure deficit
   - Slope of vapor pressure curve
   - Psychrometric constant

## Tips for Accurate Calculations

- Use daily average values for best results
- Ensure wind speed measurements are at 2m height (or use the conversion tool)
- For sunshine hours, use actual measurements rather than estimates when possible
- When relative humidity data is unavailable, use the dew point temperature option

## Example Calculation

Here's an example calculation for a location in the Mediterranean region during summer:

- Latitude: 37.5° N
- Elevation: 150 m
- Day of Year: 195 (July 14)
- Min Temperature: 18°C
- Max Temperature: 32°C
- Wind Speed: 2.5 m/s
- Relative Humidity: 55%
- Sunshine Hours: 10.2 hours

Expected result: ET₀ ≈ 6.8 mm/day

## Saving and Exporting Results

You can save your calculation results by:

1. Using the "Save Results" button to store data in your browser
2. Using the "Export to CSV" option to download results as a spreadsheet
3. Using the "Print Results" option to create a PDF report
