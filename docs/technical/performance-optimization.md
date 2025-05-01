# Performance Optimization

This document outlines the performance optimization strategies implemented in EVAPOTRAN to ensure efficient processing of large weather datasets and smooth user experience.

## Key Performance Challenges

EVAPOTRAN faces several performance challenges:

1. **Large EPW Files**: EPW weather files can contain 8,760+ hourly records (a full year)
2. **Complex Calculations**: The FAO Penman-Monteith equation involves multiple computational steps
3. **Data Visualization**: Rendering large datasets in interactive visualizations
4. **Mobile Performance**: Ensuring acceptable performance on mobile devices

## Optimization Strategies

### 1. Web Workers for EPW File Parsing

EPW file parsing is offloaded to Web Workers to prevent UI freezing:

```javascript
function parseEpwFile(file) {
  // Show loading indicator
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.style.display = 'block';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const rawEpwContent = e.target.result;
    
    // Create a worker
    const worker = new Worker('js/epw-worker.js');
    
    // Handle worker messages
    worker.onmessage = function(e) {
      const result = e.data;
      
      if (result.success) {
        // Store the parsed data
        epwData = result.epwData;
        locationData = result.locationData;
        
        // Update UI with the parsed data
        updateUI();
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
      } else {
        console.error('Error parsing EPW file:', result.error);
        alert('Error parsing EPW file: ' + result.error);
        loadingIndicator.style.display = 'none';
      }
    };
    
    // Send the raw EPW content to the worker
    worker.postMessage(rawEpwContent);
  };
  
  reader.readAsText(file);
}
```

### 2. Data Aggregation and Filtering

Instead of processing all hourly data for visualizations, we aggregate data to reduce processing load:

```javascript
function aggregateDataByDay(hourlyData) {
  const dailyData = {};
  
  hourlyData.forEach(hourData => {
    const dateKey = `${hourData.year}-${hourData.month}-${hourData.day}`;
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        sum: 0,
        count: 0,
        date: new Date(hourData.year, hourData.month - 1, hourData.day)
      };
    }
    
    dailyData[dateKey].sum += hourData.value;
    dailyData[dateKey].count++;
  });
  
  return Object.values(dailyData).map(day => ({
    date: day.date,
    value: day.sum / day.count
  }));
}
```

### 3. Lazy Loading of Visualization Libraries

Visualization libraries are loaded only when needed:

```javascript
async function loadVisualizationLibraries() {
  try {
    // Load D3.js only when needed
    if (!window.d3) {
      await loadScript('https://d3js.org/d3.v7.min.js');
      console.log('D3.js loaded dynamically');
    }
    
    // Load Chart.js only when needed
    if (!window.Chart) {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js');
      console.log('Chart.js loaded dynamically');
    }
    
    return true;
  } catch (error) {
    console.error('Error loading visualization libraries:', error);
    return false;
  }
}
```

### 4. Virtualized Rendering for Large Tables

For large data tables, we implement virtualized rendering to only display visible rows:

```javascript
function createVirtualizedTable(container, data, columns) {
  const visibleRows = 20;
  const rowHeight = 30;
  let startIndex = 0;
  
  function renderVisibleRows() {
    const tableBody = container.querySelector('tbody');
    tableBody.innerHTML = '';
    
    const endIndex = Math.min(startIndex + visibleRows, data.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const row = document.createElement('tr');
      
      columns.forEach(column => {
        const cell = document.createElement('td');
        cell.textContent = data[i][column.key];
        row.appendChild(cell);
      });
      
      tableBody.appendChild(row);
    }
  }
  
  // Initial render
  renderVisibleRows();
  
  // Handle scroll events
  container.addEventListener('scroll', () => {
    const newStartIndex = Math.floor(container.scrollTop / rowHeight);
    
    if (newStartIndex !== startIndex) {
      startIndex = newStartIndex;
      renderVisibleRows();
    }
  });
}
```

### 5. Memoization for Repeated Calculations

For frequently repeated calculations, we implement memoization:

```javascript
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Memoized version of a calculation function
const calculateSolarDeclination = memoize((dayOfYear) => {
  return 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
});
```

### 6. Progressive Loading for Visualizations

Large visualizations are loaded progressively:

```javascript
function createProgressiveHeatmap(data, parameter, container) {
  // Initial setup with empty grid
  const heatmap = setupHeatmapGrid(container);
  
  // Load data in chunks
  const chunkSize = 100;
  let currentIndex = 0;
  
  function loadNextChunk() {
    if (currentIndex >= data.length) {
      return; // All data loaded
    }
    
    const chunk = data.slice(currentIndex, currentIndex + chunkSize);
    addDataToHeatmap(heatmap, chunk, parameter);
    
    currentIndex += chunkSize;
    
    // Schedule next chunk
    if (currentIndex < data.length) {
      setTimeout(loadNextChunk, 0);
    }
  }
  
  // Start loading data
  loadNextChunk();
}
```

## Browser Compatibility

Performance optimizations are implemented with browser compatibility in mind:

1. **Feature Detection**: Check for feature support before using advanced APIs
2. **Fallbacks**: Provide simpler alternatives for older browsers
3. **Polyfills**: Include polyfills for essential features

## Mobile Optimization

Special considerations for mobile devices:

1. **Reduced Data Resolution**: Use lower resolution data on mobile
2. **Touch-Optimized Controls**: Larger touch targets for mobile users
3. **Network Awareness**: Adapt to network conditions

## Monitoring and Profiling

The application includes performance monitoring:

1. **Performance Metrics**: Track key metrics like load time and interaction time
2. **Error Logging**: Capture and report errors for analysis
3. **User Timing API**: Measure critical rendering paths