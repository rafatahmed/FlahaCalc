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

// Process EPW data in chunks to avoid blocking
function processDataInChunks(lines, chunkSize = 1000) {
  return new Promise((resolve, reject) => {
    const totalLines = lines.length;
    const epwData = [];
    let processedLines = 0;
    
    function processNextChunk() {
      // Calculate end index for this chunk
      const endIndex = Math.min(processedLines + chunkSize, totalLines);
      
      // Process this chunk of lines
      for (let i = processedLines; i < endIndex; i++) {
        // Skip header lines (first 8 lines are header)
        if (i < 8) continue;
        
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',');
        if (fields.length >= 35) {
          epwData.push({
            year: parseInt(fields[0]),
            month: parseInt(fields[1]),
            day: parseInt(fields[2]),
            hour: parseInt(fields[3]),
            dryBulbTemp: parseFloat(fields[6]),
            dewPointTemp: parseFloat(fields[7]),
            relativeHumidity: parseFloat(fields[8]),
            atmosphericPressure: parseFloat(fields[9]) / 1000, // Convert Pa to kPa
            windDirection: parseFloat(fields[20]),
            windSpeed: parseFloat(fields[21]),
            globalHorizontalRadiation: parseFloat(fields[13]),
            directNormalRadiation: parseFloat(fields[14]),
            diffuseHorizontalRadiation: parseFloat(fields[15])
          });
        }
      }
      
      // Update processed lines count
      processedLines = endIndex;
      
      // Calculate and report progress
      const progress = processedLines / totalLines;
      self.postMessage({
        type: 'progress',
        progress: progress
      });
      
      // If there are more lines to process, schedule the next chunk
      if (processedLines < totalLines) {
        setTimeout(processNextChunk, 0);
      } else {
        // All done, resolve the promise with the data
        resolve(epwData);
      }
    }
    
    // Start processing the first chunk
    processNextChunk();
  });
}