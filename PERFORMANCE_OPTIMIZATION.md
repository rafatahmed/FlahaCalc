# Performance Optimization Guide for FlahaCalc

This document outlines specific strategies and implementation details for optimizing the performance of FlahaCalc, particularly for handling large EPW datasets and complex visualizations.

## 1. Web Workers for EPW File Parsing

### Why Web Workers?
EPW files can be large (>10MB) and parsing them in the main thread causes UI freezing, resulting in poor user experience.

### Implementation Steps:

1. **Create a dedicated worker file** (`epw-worker.js`):

```javascript
// epw-worker.js
self.onmessage = function(e) {
  const rawEpwContent = e.data;
  
  try {
    // Parse EPW data (moved from epw-import.js)
    const lines = rawEpwContent.split('\n');
    
    // Extract location data
    const locationData = extractLocationData(lines);
    
    // Extract weather data
    const epwData = extractWeatherData(lines);
    
    // Send the parsed data back to the main thread
    self.postMessage({
      success: true,
      locationData: locationData,
      epwData: epwData
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    });
  }
};

// Helper functions moved from epw-import.js
function extractLocationData(lines) {
  // Implementation here
}

function extractWeatherData(lines) {
  // Implementation here
}
```

2. **Update the main script** to use the worker:

```javascript
// In epw-import.js
function processEpwFile() {
  const file = epwFileInput.files[0];
  if (!file) {
    alert('Please select an EPW file first.');
    return;
  }
  
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

3. **Add a loading indicator** to the HTML:

```html
<div id="loadingIndicator" style="display: none;">
  <div class="spinner"></div>
  <p>Processing EPW file... This may take a moment for large files.</p>
</div>
```

## 2. IndexedDB for Efficient Storage

### Why IndexedDB?
LocalStorage has a size limit (typically 5-10MB) and is synchronous, which can block the main thread. IndexedDB offers:
- Larger storage capacity
- Asynchronous API
- Structured storage with indexing

### Implementation Steps:

1. **Create a database module** (`indexeddb-storage.js`):

```javascript
// indexeddb-storage.js
const dbName = 'FlahaCalcDB';
const dbVersion = 1;
const epwStoreName = 'epwFiles';

// Open/create the database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = event => reject(event.target.error);
    request.onsuccess = event => resolve(event.target.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains(epwStoreName)) {
        const store = db.createObjectStore(epwStoreName, { keyPath: 'fileName' });
        store.createIndex('dateAdded', 'dateAdded', { unique: false });
      }
    };
  });
}

// Store EPW data
async function storeEpwData(fileName, epwData, locationData) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([epwStoreName], 'readwrite');
    const store = transaction.objectStore(epwStoreName);
    
    const record = {
      fileName: fileName,
      epwData: epwData,
      locationData: locationData,
      dateAdded: new Date()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error storing EPW data:', error);
    return false;
  }
}

// Retrieve EPW data
async function getEpwData(fileName) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([epwStoreName], 'readonly');
    const store = transaction.objectStore(epwStoreName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error retrieving EPW data:', error);
    return null;
  }
}

// List all stored EPW files
async function listEpwFiles() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([epwStoreName], 'readonly');
    const store = transaction.objectStore(epwStoreName);
    
    return new Promise((resolve, reject) => {
      const request = store.index('dateAdded').openCursor(null, 'prev');
      const files = [];
      
      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          files.push({
            fileName: cursor.value.fileName,
            dateAdded: cursor.value.dateAdded
          });
          cursor.continue();
        } else {
          resolve(files);
        }
      };
      
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error listing EPW files:', error);
    return [];
  }
}

// Export functions
export { storeEpwData, getEpwData, listEpwFiles };
```

2. **Update the EPW import script** to use IndexedDB:

```javascript
// In epw-import.js
import { storeEpwData, getEpwData } from './indexeddb-storage.js';

// After successfully parsing EPW data
async function saveEpwData() {
  try {
    const success = await storeEpwData(epwFileName, epwData, locationData);
    if (success) {
      console.log('EPW data stored successfully in IndexedDB');
      
      // Set a flag in sessionStorage (small data only)
      sessionStorage.setItem('epwDataLoaded', 'true');
      sessionStorage.setItem('currentEpwFile', epwFileName);
      
      // Redirect to heatmap page
      window.location.href = 'epw-heatmap.html';
    } else {
      throw new Error('Failed to store EPW data');
    }
  } catch (error) {
    console.error('Error saving EPW data:', error);
    alert('Error saving EPW data: ' + error.message);
  }
}
```

3. **Update the heatmap page** to load data from IndexedDB:

```javascript
// In epw-heatmap.js
import { getEpwData } from './indexeddb-storage.js';

async function loadEpwData() {
  const fileName = sessionStorage.getItem('currentEpwFile');
  if (!fileName) {
    console.error('No EPW file specified');
    return false;
  }
  
  try {
    const data = await getEpwData(fileName);
    if (data) {
      epwData = data.epwData;
      locationData = data.locationData;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading EPW data:', error);
    return false;
  }
}

// On page load
document.addEventListener('DOMContentLoaded', async function() {
  // Try to load data from IndexedDB
  const dataLoaded = await loadEpwData();
  
  if (dataLoaded) {
    // Hide file upload section
    const fileUploadSection = document.getElementById('SBlock1A');
    if (fileUploadSection) {
      fileUploadSection.style.display = 'none';
    }
    
    // Show heatmap container
    const heatmapContainer = document.getElementById('heatmapContainer');
    if (heatmapContainer) {
      heatmapContainer.style.display = 'block';
    }
    
    // Create heatmaps
    createAllHeatmaps();
  }
});
```

## 3. Lazy Loading for Visualization Components

### Why Lazy Loading?
Visualization components can be resource-intensive. Loading them only when needed improves initial page load time.

### Implementation Steps:

1. **Implement dynamic script loading**:

```javascript
// In epw-heatmap.js
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    
    document.head.appendChild(script);
  });
}

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

2. **Implement lazy loading for heatmap components**:

```javascript
// In epw-heatmap.js
async function createHeatmapForParameter(paramName) {
  // Check if libraries are loaded
  if (!window.d3) {
    const loaded = await loadVisualizationLibraries();
    if (!loaded) {
      alert('Failed to load required visualization libraries');
      return;
    }
  }
  
  // Create the heatmap for this parameter
  createCalendarHeatmap(paramName);
}

// Update the parameter selection handler
function handleParameterSelection(event) {
  const paramName = event.target.value;
  if (!paramName) return;
  
  // Show loading indicator
  document.getElementById('parameterLoadingIndicator').style.display = 'block';
  
  // Create heatmap for selected parameter
  createHeatmapForParameter(paramName).then(() => {
    // Hide loading indicator
    document.getElementById('parameterLoadingIndicator').style.display = 'none';
  });
}
```

3. **Add a parameter selector to the HTML**:

```html
<div class="parameter-selector">
  <label for="parameterSelect">Select parameter to visualize:</label>
  <select id="parameterSelect">
    <option value="">-- Select Parameter --</option>
    <option value="dryBulbTemp">Temperature</option>
    <option value="relativeHumidity">Relative Humidity</option>
    <option value="windSpeed">Wind Speed</option>
    <option value="globalHorizontalRadiation">Global Horizontal Radiation</option>
    <option value="directNormalRadiation">Direct Normal Radiation</option>
    <option value="diffuseHorizontalRadiation">Diffuse Horizontal Radiation</option>
  </select>
  <div id="parameterLoadingIndicator" class="loading-indicator" style="display: none;">
    <div class="spinner-small"></div>
  </div>
</div>
```

## 4. Data Chunking for Large Datasets

### Why Data Chunking?
Processing large datasets all at once can cause browser unresponsiveness. Chunking breaks the work into smaller pieces.

### Implementation Steps:

1. **Implement chunked data processing**:

```javascript
// In epw-worker.js
function processDataInChunks(lines, chunkSize = 1000) {
  return new Promise((resolve, reject) => {
    const totalLines = lines.length;
    const epwData = [];
    let processedLines = 0;
    
    function processChunk() {
      const endIndex = Math.min(processedLines + chunkSize, totalLines);
      
      for (let i = processedLines; i < endIndex; i++) {
        if (i < 8) continue; // Skip header lines
        
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',');
        if (fields.length >= 35) {
          epwData.push({
            year: parseInt(fields[0]),
            month: parseInt(fields[1]),
            day: parseInt(fields[2]),
            hour: parseInt(fields[3]),
            minute: parseInt(fields[4]),
            dryBulbTemp: parseFloat(fields[6]),
            dewPointTemp: parseFloat(fields[7]),
            relativeHumidity: parseFloat(fields[8]),
            atmosphericPressure: parseFloat(fields[9]) / 1000,
            windDirection: parseFloat(fields[20]),
            windSpeed: parseFloat(fields[21]),
            globalHorizontalRadiation: parseFloat(fields[13]),
            directNormalRadiation: parseFloat(fields[14]),
            diffuseHorizontalRadiation: parseFloat(fields[15])
          });
        }
      }
      
      processedLines = endIndex;
      
      // Report progress
      self.postMessage({
        type: 'progress',
        progress: processedLines / totalLines
      });
      
      if (processedLines < totalLines) {
        // Schedule next chunk
        setTimeout(processChunk, 0);
      } else {
        // All done
        resolve(epwData);
      }
    }
    
    // Start processing
    processChunk();
  });
}

// Update onmessage handler
self.onmessage = async function(e) {
  const rawEpwContent = e.data;
  
  try {
    const lines = rawEpwContent.split('\n');
    
    // Extract location data
    const locationData = extractLocationData(lines);
    
    // Process data in chunks
    const epwData = await processDataInChunks(lines);
    
    // Send the parsed data back to the main thread
    self.postMessage({
      type: 'complete',
      success: true,
      locationData: locationData,
      epwData: epwData
    });
  } catch (error) {
    self.postMessage({
      type: 'complete',
      success: false,
      error: error.message
    });
  }
};
```

2. **Update the main script to handle progress updates**:

```javascript
// In epw-import.js
function processEpwFile() {
  // ... existing code ...
  
  // Create progress bar
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  progressBar.style.display = 'block';
  progressBar.value = 0;
  
  // Create a worker
  const worker = new Worker('js/epw-worker.js');
  
  // Handle worker messages
  worker.onmessage = function(e) {
    const result = e.data;
    
    if (result.type === 'progress') {
      // Update progress bar
      const percent = Math.round(result.progress * 100);
      progressBar.value = percent;
      progressText.textContent = `Processing: ${percent}%`;
    } else if (result.type === 'complete') {
      if (result.success) {
        // Store the parsed data
        epwData = result.epwData;
        locationData = result.locationData;
        
        // Update UI with the parsed data
        updateUI();
        
        // Hide progress bar
        progressBar.style.display = 'none';
      } else {
        console.error('Error parsing EPW file:', result.error);
        alert('Error parsing EPW file: ' + result.error);
        progressBar.style.display = 'none';
      }
    }
  };
  
  // Send the raw EPW content to the worker
  worker.postMessage(rawEpwContent);
}
```

3. **Add a progress bar to the HTML**:

```html
<div id="progressContainer" style="display: none;">
  <progress id="progressBar" value="0" max="100"></progress>
  <span id="progressText">Processing: 0%</span>
</div>
```

## 5. Memory Management Techniques

### Why Memory Management?
JavaScript's automatic garbage collection isn't always efficient with large datasets. Proper memory management prevents memory leaks and improves performance.

### Implementation Steps:

1. **Implement data filtering to reduce memory usage**:

```javascript
// In epw-heatmap.js
function filterDataForVisualization(paramName) {
  // Instead of using all hourly data, calculate daily averages
  const dailyData = {};
  
  epwData.forEach(hourData => {
    const dateKey = `${hourData.year}-${hourData.month}-${hourData.day}`;
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        sum: 0,
        count: 0,
        date: new Date(hourData.year, hourData.month - 1, hourData.day)
      };
    }
    
    // Only include valid values
    if (!isNaN(hourData[paramName]) && hourData[paramName] !== undefined) {
      dailyData[dateKey].sum += hourData[paramName];
      dailyData[dateKey].count++;
    }
  });
  
  // Convert to array of daily averages
  return Object.values(dailyData).map(day => ({
    date: day.date,
    value: day.count > 0 ? day.sum / day.count : null
  }));
}
```

2. **Implement cleanup functions to release memory**:

```javascript
// In epw-heatmap.js
function cleanupVisualization(paramName) {
  // Remove old SVG elements
  const container = document.getElementById(`heatmap-${paramName}`);
  if (container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  
  // Remove references to large data objects
  if (heatmapCharts[paramName]) {
    heatmapCharts[paramName] = null;
  }
}

// Call cleanup when switching parameters
function handleParameterSelection(event) {
  const paramName = event.target.value;
  if (!paramName) return;
  
  // Clean up previous visualizations
  parameters.forEach(param => {
    if (param !== paramName) {
      cleanupVisualization(param);
    }
  });
  
  // Create new visualization
  createHeatmapForParameter(param