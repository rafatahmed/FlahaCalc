# Visualization Techniques

This document describes the visualization techniques used in EVAPOTRAN for displaying weather data and evapotranspiration results.

## Visualization Components

EVAPOTRAN uses several visualization techniques to represent climate data and calculation results:

1. **Heatmaps**: Calendar-based visualizations showing data intensity across time periods
2. **Time Series Charts**: Line charts showing how values change over time
3. **Comparison Charts**: Bar and scatter plots for comparing different parameters
4. **Data Tables**: Structured tabular representations of numerical data

## Heatmap Implementation

The heatmap visualizations are implemented using D3.js and follow these steps:

1. **Data Processing**: Hourly data is aggregated into daily or monthly averages
2. **Color Mapping**: Values are mapped to a color scale based on their range
3. **Grid Generation**: A calendar grid is created with cells for each time period
4. **Tooltip Integration**: Interactive tooltips show detailed information on hover

```javascript
function createHeatmap(data, parameter, containerId) {
  // Get container and check if it exists
  const container = document.getElementById(containerId);
  
  // Create color scale based on parameter type
  const colorScale = d3.scaleSequential()
    .domain([d3.min(data, d => d[parameter]), d3.max(data, d => d[parameter])])
    .interpolator(getColorInterpolator(parameter));
  
  // Create SVG element
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
  // Add cells for each data point
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.hour || 0))
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .attr("fill", d => colorScale(d[parameter]))
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip);
}
```

## Time Series Charts

Time series charts are implemented using Chart.js and provide:

1. **Temporal Trends**: Visualize how values change over days, months, or years
2. **Multi-parameter Comparison**: Plot multiple parameters on the same chart
3. **Interactive Features**: Zoom, pan, and data point inspection

## Color Schemes

The visualization module uses carefully selected color schemes:

1. **Temperature**: Red-blue diverging scale (blue for cold, red for hot)
2. **Humidity**: Blue sequential scale (lighter blue for low, darker blue for high)
3. **Solar Radiation**: Yellow-orange sequential scale
4. **Wind Speed**: Green sequential scale
5. **ET₀**: Purple sequential scale

## Responsive Design

All visualizations are designed to be responsive:

1. **Flexible Layouts**: Adapt to different screen sizes
2. **Mobile Optimization**: Touch-friendly interaction on mobile devices
3. **Print Optimization**: Special layouts for printed reports

## Accessibility Considerations

The visualizations follow accessibility best practices:

1. **Color Blindness**: Alternative color schemes for color vision deficiencies
2. **Screen Readers**: ARIA attributes and text alternatives
3. **Keyboard Navigation**: Full keyboard accessibility for all interactive elements

## Export Options

Users can export visualizations in various formats:

1. **PNG/JPEG**: Raster image formats for general use
2. **SVG**: Vector format for high-quality printing
3. **CSV**: Raw data export for further analysis
4. **PDF**: Formatted reports with visualizations and data tables