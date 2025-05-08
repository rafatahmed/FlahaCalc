/**
 * EPW File Processing Worker
 * Handles parsing of EPW files in a separate thread to prevent UI freezing
 */

self.onmessage = function(e) {
  const rawEpwContent = e.data;
  
  try {
    const lines = rawEpwContent.split('\n');
    
    // Extract location data from header
    const locationData = extractLocationData(lines);
    
    // Process data in chunks to provide progress updates
    processDataInChunks(lines).then(epwData => {
      // Send the complete parsed data back to the main thread
      self.postMessage({
        type: 'complete',
        success: true,
        locationData: locationData,
        epwData: epwData
      });
    });
  } catch (error) {
    self.postMessage({
      type: 'complete',
      success: false,
      error: error.message
    });
  }
};

// Extract location data from EPW header
function extractLocationData(lines) {
  // EPW header format: LOCATION,CITY,STATE/PROVINCE,COUNTRY,DATA SOURCE,WMO#,LATITUDE,LONGITUDE,TIME ZONE,ELEVATION
  if (lines.length < 1) {
    throw new Error("Invalid EPW file: missing header");
  }
  
  const locationLine = lines[0].split(',');
  
  if (locationLine.length < 10) {
    throw new Error("Invalid EPW file: incomplete location data");
  }
  
  return {
    city: locationLine[1].trim(),
    state: locationLine[2].trim(),
    country: locationLine[3].trim(),
    dataSource: locationLine[4].trim(),
    wmoNumber: locationLine[5].trim(),
    latitude: parseFloat(locationLine[6]),
    longitude: parseFloat(locationLine[7]),
    timeZone: parseFloat(locationLine[8]),
    elevation: parseFloat(locationLine[9])
  };
}

// Add chunked processing for large files
async function processDataInChunks(lines) {
  const CHUNK_SIZE = 1000; // Process 1000 lines at a time
  const headerLines = 8; // Skip header lines
  const dataLines = lines.slice(headerLines);
  const totalLines = dataLines.length;
  const epwData = [];
  
  for (let i = 0; i < totalLines; i += CHUNK_SIZE) {
    const chunk = dataLines.slice(i, i + CHUNK_SIZE);
    const processedChunk = processChunk(chunk);
    epwData.push(...processedChunk);
    
    // Report progress
    const progress = Math.min(100, Math.round((i + chunk.length) / totalLines * 100));
    self.postMessage({
      type: 'progress',
      progress: progress
    });
    
    // Allow UI thread to breathe
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return epwData;
}

function processChunk(lines) {
  return lines.map(line => {
    // Your existing parsing logic
    const parts = line.trim().split(',');
    // Process and return data
    // ...
  }).filter(Boolean); // Remove any null entries
}

