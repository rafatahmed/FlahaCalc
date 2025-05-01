# Performance Optimization

This document outlines the performance optimization strategies implemented in EVAPOTRAN.

## Key Performance Challenges

1. **Large EPW Files**: EPW weather files can contain 8,760+ hourly records
2. **Complex Calculations**: The FAO Penman-Monteith equation involves multiple computational steps
3. **Data Visualization**: Rendering large datasets in interactive visualizations
4. **Mobile Performance**: Ensuring acceptable performance on mobile devices

## Optimization Strategies

### 1. Web Workers for EPW File Parsing

EPW file parsing is offloaded to Web Workers to prevent UI freezing:

```javascript
function parseEpwFile(file) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.style.display = 'block';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const worker = new Worker('js/epw-worker.js');
    
    worker.onmessage = function(e) {
      const result = e.data;
      if (result.success) {
        // Process results
        // ...
      }
    };
    
    worker.postMessage(e.target.result);
  };
  
  reader.readAsText(file);
}
```

### 2. Data Aggregation and Filtering

Data is aggregated to reduce processing load:

```javascript
function aggregateDataByDay(hourlyData) {
  const dailyData = {};
  
  hourlyData.forEach(hourData => {
    const dateKey = `${hourData.year}-${hourData.month}-${hourData.day}`;
    // Aggregate data
    // ...
  });
  
  return Object.values(dailyData);
}
```

### 3. Lazy Loading of Visualization Libraries

Visualization libraries are loaded only when needed:

```javascript
async function loadVisualizationLibraries() {
  if (!window.d3) {
    await loadScript('https://d3js.org/d3.v7.min.js');
  }
  
  if (!window.Chart) {
    await loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js');
  }
}
```

### 4. Memoization for Repeated Calculations

```javascript
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const calculateSolarDeclination = memoize((dayOfYear) => {
  return 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
});
```

## Mobile Optimization

1. **Reduced Data Resolution**: Lower resolution data on mobile
2. **Touch-Optimized Controls**: Larger touch targets
3. **Network Awareness**: Adapt to network conditions
