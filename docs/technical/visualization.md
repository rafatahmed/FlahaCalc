# Visualization Techniques

This document describes the visualization techniques used in EVAPOTRAN for displaying weather data and evapotranspiration results.

## Visualization Components

EVAPOTRAN uses several visualization techniques:

1. **Heatmaps**: Calendar-based visualizations showing data intensity across time periods
2. **Time Series Charts**: Line charts showing how values change over time
3. **Comparison Charts**: Bar and scatter plots for comparing different parameters
4. **Data Tables**: Structured tabular representations of numerical data

## Heatmap Implementation

Heatmaps are implemented using D3.js:

```javascript
function createHeatmap(data, parameter, containerId) {
  const container = document.getElementById(containerId);
  const colorScale = d3.scaleSequential()
    .domain([d3.min(data, d => d[parameter]), d3.max(data, d => d[parameter])])
    .interpolator(getColorInterpolator(parameter));
  
  // Create SVG and add cells
  // ...
}
```

## Color Schemes

The visualization module uses carefully selected color schemes:

1. **Temperature**: Red-blue diverging scale
2. **Humidity**: Blue sequential scale
3. **Solar Radiation**: Yellow-orange sequential scale
4. **Wind Speed**: Green sequential scale
5. **ET₀**: Purple sequential scale

## Responsive Design

All visualizations are designed to be responsive:

1. **Flexible Layouts**: Adapt to different screen sizes
2. **Mobile Optimization**: Touch-friendly interaction on mobile devices
3. **Print Optimization**: Special layouts for printed reports

## Export Options

Users can export visualizations in various formats:

1. **PNG/JPEG**: Raster image formats
2. **SVG**: Vector format for high-quality printing
3. **CSV**: Raw data export for further analysis
4. **PDF**: Formatted reports with visualizations
