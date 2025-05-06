# EPW Import

The EPW Import feature allows you to upload EnergyPlus Weather (EPW) files to automatically extract climate data for your location.

## What are EPW Files?

EPW (EnergyPlus Weather) files contain hourly weather data for an entire year for a specific location. These files include:

- Temperature
- Humidity
- Wind speed
- Solar radiation
- Precipitation
- And many other climate parameters

EPW files are widely used in building energy simulation and are available for thousands of locations worldwide.

## Obtaining EPW Files

You can download EPW files from several sources:

1. [EnergyPlus Weather Data](https://energyplus.net-weather) (official repository)
2. [Climate.OneBuilding.Org](https://climate.onebuilding.org-) (comprehensive collection)
3. [EPW Map](https://www.ladybug.tools/epwmap-) (interactive map interface)

## Uploading an EPW File

1. From the EVAPOTRAN home page, click on "EPW Import"
2. Click the "Choose File" button in the upload section
3. Select an EPW file from your computer
4. Click "Upload and Process"

During processing, you'll see a loading indicator. Large files may take a few moments to process.

## Working with EPW Data

After uploading, you'll see:

1. **Location Information**: Details extracted from the EPW header
2. **Data Selection**: Options to select specific days or months
3. **Calculation Options**: Parameters for ET₀ calculation

### Selecting a Specific Day

1. Use the date picker or calendar interface to select a day
2. Climate data for that day will be automatically populated
3. Click "Calculate ET₀" to perform the calculation

### Generating Annual Reports

1. Click the "Generate Annual Report" button
2. Select the parameters you want to include
3. The application will calculate ET₀ for each day of the year
4. View the results as a table or download as CSV

## Visualizing EPW Data

After uploading an EPW file, you can:

1. Click "View Weather Heatmaps" to see visual representations of the data
2. Select different parameters (temperature, humidity, etc.) from the dropdown
3. Toggle between daily, monthly, or hourly views
4. Export visualizations as images

## Saving EPW Data

The application automatically saves your uploaded EPW data in your browser's local storage. This means:

1. You don't need to re-upload the same file when you return
2. You can switch between different sections of the application without losing data
3. Data persists until you clear your browser cache or upload a new file

## Troubleshooting EPW Imports

If you encounter issues with EPW imports:

1. **File Format Errors**: Ensure your EPW file follows the standard format
2. **Large File Issues**: Try using a smaller EPW file if processing takes too long
3. **Missing Data**: Some EPW files may have gaps in certain parameters