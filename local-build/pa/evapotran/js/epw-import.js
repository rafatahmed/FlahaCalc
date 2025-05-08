/** @format */

/* 
###########################################################################################################
##                                   Credits                                                             ##
###########################################################################################################
##                                                                                                       ##
## EPW File Import for Evapotranspiration Calculation                                                    ##
## Author: Rafat Al Khashan                                                                              ##
## Email: rafat.khashan82@gmail.com                                                                      ##
## Corp.: Flaha Agri Tech                                                                                ##
## Corp.: info@flaha.org                                                                                 ##
##                                                                                                       ##
###########################################################################################################
*/

// Add this function near the top of your file
function showError(message) {
    const errorElement = document.getElementById('epwFileValidation');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('error');
    } else {
        // Fallback to alert if the validation element doesn't exist
        alert(message);
    }
}

// Global variable to store the parsed EPW data
let epwData = null;

// Process EPW file button click handler
document.getElementById('processEpwBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('epwFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select an EPW file first');
        return;
    }
    
    // Show progress container
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';
    
    // Read the file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parse the EPW content
            const content = e.target.result;
            
            // Update progress during parsing
            epwData = parseEpwContent(content, function(progress) {
                progressBar.value = progress;
                progressText.textContent = `Processing: ${progress}%`;
            });
            
            // Show success message
            progressText.textContent = 'EPW file processed successfully!';
            
            // Display location information
            displayLocationInfo(epwData.header);
            
            // Show options for next steps
            document.getElementById('epwOptions').style.display = 'block';
            
            // Populate day selection dropdown
            populateDaySelection();
            
        } catch (error) {
            console.error('Error processing EPW file:', error);
            progressText.textContent = 'Error processing EPW file: ' + error.message;
        }
    };
    
    reader.onerror = function() {
        progressText.textContent = 'Error reading the file';
    };
    
    reader.readAsText(file);
});

// Display location information from EPW header
function displayLocationInfo(header) {
    const locationInfo = document.getElementById('locationInfo');
    
    // Create a location string from city, state, country
    let locationName = header.city || "Unknown";
    if (header.state) locationName += ", " + header.state;
    if (header.country) locationName += ", " + header.country;
    
    document.getElementById('locationName').textContent = 'Location: ' + locationName;
    document.getElementById('locationLat').textContent = 'Latitude: ' + (isNaN(header.latitude) ? "Unknown" : header.latitude.toFixed(2) + ' degrees');
    document.getElementById('locationLon').textContent = 'Longitude: ' + (isNaN(header.longitude) ? "Unknown" : header.longitude.toFixed(2) + ' degrees');
    document.getElementById('locationElev').textContent = 'Elevation: ' + (isNaN(header.elevation) ? "Unknown" : header.elevation.toFixed(2) + ' m');
    document.getElementById('locationTimeZone').textContent = 'Time Zone: ' + (isNaN(header.timeZone) ? "Unknown" : header.timeZone + ' hours');
    
    locationInfo.style.display = 'block';
}

// Populate day selection dropdown
function populateDaySelection() {
    if (!epwData || !epwData.data || epwData.data.length === 0) {
        console.error("No EPW data available");
        return;
    }
    
    const daySelect = document.getElementById('daySelect');
    daySelect.innerHTML = '<option value="">-- Select a day --</option>';
    
    // Get unique days from the data
    const uniqueDays = new Set();
    const dayOptions = [];
    
    epwData.data.forEach(entry => {
        const key = `${entry.month}-${entry.day}`;
        if (!uniqueDays.has(key) && entry.hour === 12) { // Only add noon entries
            uniqueDays.add(key);
            
            const date = new Date(2000, entry.month - 1, entry.day);
            const monthName = date.toLocaleString('default', { month: 'long' });
            
            dayOptions.push({
                key: key,
                text: `${monthName} ${entry.day}`,
                month: entry.month,
                day: entry.day
            });
        }
    });
    
    // Sort by month and day
    dayOptions.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
    });
    
    // Add options to select
    dayOptions.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.key;
        optElement.textContent = option.text;
        daySelect.appendChild(optElement);
    });
}

// Day selection change handler
document.getElementById('daySelect').addEventListener('change', function() {
    const selectedDay = this.value;
    if (!selectedDay) return;
    
    // Find the data for the selected day
    const dayParts = selectedDay.split('-');
    const month = parseInt(dayParts[0]);
    const day = parseInt(dayParts[1]);
    
    // Find data for this day at noon (hour 12)
    const dayData = epwData.data.find(entry => 
        entry.month === month && 
        entry.day === day && 
        entry.hour === 12
    );
    
    if (dayData) {
        displayWeatherData(dayData);
    }
});

// Select day button click handler
document.getElementById('selectDayBtn').addEventListener('click', function() {
    document.getElementById('daySelectionSection').style.display = 'block';
});

// View heatmaps button click handler
document.getElementById('viewHeatmapsBtn').addEventListener('click', function() {
    // Validate data before storing
    if (!Array.isArray(epwData) || epwData.length === 0) {
        console.error("Invalid EPW data - cannot generate heatmaps", epwData);
        alert("Error: No valid weather data available for visualization.");
        return;
    }
    
    try {
        // Create a structured object with header and data
        const dataToStore = {
            header: {
                location: epwHeader.location || "",
                city: epwHeader.city || "",
                state: epwHeader.state || "",
                country: epwHeader.country || "",
                latitude: epwHeader.latitude || 0,
                longitude: epwHeader.longitude || 0,
                timeZone: epwHeader.timeZone || 0,
                elevation: epwHeader.elevation || 0
            },
            data: epwData
        };
        
        // Store the EPW data in localStorage
        const jsonData = JSON.stringify(dataToStore);
        console.log(`Storing ${epwData.length} data points, JSON length: ${jsonData.length}`);
        localStorage.setItem('epwData', jsonData);
        
        // Set a flag in sessionStorage
        sessionStorage.setItem('epwDataLoaded', 'true');
        
        // Redirect to heatmap page
        window.location.href = 'epw-heatmap.html';
    } catch (error) {
        console.error("Error storing EPW data:", error);
        alert("Error: Could not store weather data. The dataset may be too large.");
    }
});

// Display weather data for the selected day
function displayWeatherData(dayData) {
    const weatherData = document.getElementById('weatherData');
    const weatherDataBody = document.getElementById('weatherDataBody');
    
    // Clear previous data
    weatherDataBody.innerHTML = '';
    
    // Add rows for each parameter
    const parameters = [
        { name: 'Temperature', value: dayData.dryBulbTemp, unit: '°C' },
        { name: 'Dew Point Temperature', value: dayData.dewPointTemp, unit: '°C' },
        { name: 'Relative Humidity', value: dayData.relativeHumidity, unit: '%' },
        { name: 'Atmospheric Pressure', value: dayData.atmosphericPressure, unit: 'kPa' },
        { name: 'Wind Speed', value: dayData.windSpeed, unit: 'm/s' },
        { name: 'Global Horizontal Radiation', value: dayData.globalHorizontalRadiation, unit: 'Wh/m²' },
        { name: 'Direct Normal Radiation', value: dayData.directNormalRadiation, unit: 'Wh/m²' },
        { name: 'Diffuse Horizontal Radiation', value: dayData.diffuseHorizontalRadiation, unit: 'Wh/m²' },
        { name: 'Day of Year', value: dayData.dayOfYear, unit: '' }
    ];
    
    parameters.forEach(param => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = param.name;
        
        const valueCell = document.createElement('td');
        valueCell.textContent = isNaN(param.value) ? 'N/A' : param.value.toFixed(2);
        
        const unitCell = document.createElement('td');
        unitCell.textContent = param.unit;
        
        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(unitCell);
        
        weatherDataBody.appendChild(row);
    });
    
    // Show the weather data and output options
    weatherData.style.display = 'block';
    document.getElementById('output').style.display = 'block';
    
    // Set up the "Use Selected Day" button
    document.getElementById('useDataBtn').addEventListener('click', function() {
        // Prepare data for the calculator
        const calculatorData = {
            temperature: dayData.dryBulbTemp,
            windSpeed: dayData.windSpeed,
            relativeHumidity: dayData.relativeHumidity,
            atmosphericPressure: dayData.atmosphericPressure,
            elevation: epwData.header.elevation,
            latitude: epwData.header.latitude,
            dayNumber: dayData.dayOfYear,
            // Estimate sunshine duration as 8 hours (default)
            sunshineDuration: 8
        };
        
        // Store data for the calculator page
        localStorage.setItem('etoCalcData', JSON.stringify(calculatorData));
        
        // Redirect to calculator page
        window.location.href = 'calculator.html';
    });
}

// Add a row to the weather data table
function addDataRow(parameter, value, unit) {
    const row = document.createElement('tr');
    
    const paramCell = document.createElement('td');
    paramCell.textContent = parameter;
    
    const valueCell = document.createElement('td');
    valueCell.textContent = value;
    
    const unitCell = document.createElement('td');
    unitCell.textContent = unit;
    
    row.appendChild(paramCell);
    row.appendChild(valueCell);
    row.appendChild(unitCell);
    
    weatherDataBody.appendChild(row);
}

// Transfer data to the main calculator
function transferDataToCalculator() {
    if (!epwData) {
        alert('Please process an EPW file first.');
        return;
    }
    
    const selectedDay = document.getElementById('daySelect').value;
    if (!selectedDay) {
        alert('Please select a day first.');
        return;
    }
    
    const dayParts = selectedDay.split('-');
    const month = parseInt(dayParts[0]);
    const day = parseInt(dayParts[1]);
    
    const dayData = epwData.data.find(entry => 
        entry.month === month && 
        entry.day === day && 
        entry.hour === 12
    );
    
    if (dayData) {
        const calculatorData = {
            temperature: dayData.dryBulbTemp,
            windSpeed: dayData.windSpeed,
            relativeHumidity: dayData.relativeHumidity,
            atmosphericPressure: dayData.atmosphericPressure / 1000, // Convert Pa to kPa
            elevation: epwData.header.elevation,
            latitude: epwData.header.latitude,
            dayNumber: getDayOfYear(month, day),
            sunshineDuration: estimateSunshineDuration(dayData)
        };
        
        localStorage.setItem('etoCalcData', JSON.stringify(calculatorData));
        window.location.href = 'calculator.html';
    }
}

// Helper function to get day of year
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 0);
    const diff = date - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Estimate sunshine duration from radiation data
function estimateSunshineDuration(dayData) {
    if (dayData.globalHorizontalRadiation > 0) {
        return 8; // Rough estimate: if there's significant radiation, assume 8 hours of sunshine
    }
    return 0;
}

// Add event listener for the "Use Data" button
document.getElementById('useDataBtn').addEventListener('click', function() {
    transferDataToCalculator();
});

/**
 * Parse the content of an EPW file
 * @param {string} content - The text content of the EPW file
 * @param {function} progressCallback - Callback function to report progress
 * @returns {Object} Parsed EPW data
 */
function parseEpwContent(content, progressCallback) {
    // Split the content into lines
    const lines = content.split('\n');
    
    // EPW format has a specific structure:
    // Line 1: LOCATION info
    if (lines.length < 8) {
        throw new Error("Invalid EPW file format: not enough header lines");
    }
    
    // Parse the LOCATION line (first line)
    const locationLine = lines[0].trim();
    const locationParts = locationLine.split(',').map(part => part.trim());
    
    // EPW LOCATION line format: 
    // LOCATION,City,State/Province,Country,Source,WMO,Latitude,Longitude,Time Zone,Elevation
    const header = {
        location: locationLine,
        city: locationParts[1] || "Unknown",
        state: locationParts[2] || "",
        country: locationParts[3] || "",
        latitude: parseFloat(locationParts[6]) || 0,
        longitude: parseFloat(locationParts[7]) || 0,
        timeZone: parseFloat(locationParts[8]) || 0,
        elevation: parseFloat(locationParts[9]) || 0
    };
    
    console.log("Parsed header:", header); // Debug log
    
    // Parse the data rows (starting from line 9)
    const data = [];
    const totalLines = lines.length;
    
    for (let i = 8; i < totalLines; i++) {
        // Report progress
        if (progressCallback && i % 100 === 0) {
            const progress = Math.floor(((i - 8) / (totalLines - 8)) * 100);
            progressCallback(progress);
        }
        
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const fields = line.split(',');
        if (fields.length < 35) continue; // Skip incomplete lines
        
        // Extract relevant data
        const entry = {
            year: parseInt(fields[0]),
            month: parseInt(fields[1]),
            day: parseInt(fields[2]),
            hour: parseInt(fields[3]),
            dryBulbTemp: parseFloat(fields[6]),
            dewPointTemp: parseFloat(fields[7]),
            relativeHumidity: parseFloat(fields[8]),
            atmosphericPressure: parseFloat(fields[9]) / 100, // Convert Pa to kPa
            windSpeed: parseFloat(fields[21]),
            globalHorizontalRadiation: parseFloat(fields[13]),
            directNormalRadiation: parseFloat(fields[14]),
            diffuseHorizontalRadiation: parseFloat(fields[15])
        };
        
        // Calculate day of year
        const date = new Date(entry.year, entry.month - 1, entry.day);
        const startOfYear = new Date(entry.year, 0, 0);
        const diff = date - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        entry.dayOfYear = Math.floor(diff / oneDay);
        
        data.push(entry);
    }
    
    // Report 100% progress when done
    if (progressCallback) {
        progressCallback(100);
    }
    
    return { header, data };
}

// Enable the process button when a file is selected
document.getElementById('epwFile').addEventListener('change', function() {
    const processBtn = document.getElementById('processEpwBtn');
    processBtn.disabled = !this.files.length;
});

// Add this function to ensure data is properly formatted before saving
function prepareDataForHeatmap(header, data) {
    // Make sure all required properties exist in each data point
    const requiredProps = ["dryBulbTemp", "relativeHumidity", "windSpeed", "globalHorizontalRadiation"];
    
    // Check the first item to see if it has all required properties
    if (data.length > 0) {
        const firstItem = data[0];
        const missingProps = requiredProps.filter(prop => firstItem[prop] === undefined);
        
        if (missingProps.length > 0) {
            console.error(`Data missing required properties for heatmap: ${missingProps.join(', ')}`);
            return null;
        }
    }
    
    // Create the properly formatted data object
    return {
        header: header,
        data: data
    };
}

// Find where the data is saved to localStorage and modify it to use the prepare function
// This might be in a function like saveEpwData or similar
// Example:
function saveEpwData(header, data) {
    const formattedData = prepareDataForHeatmap(header, data);
    
    if (formattedData) {
        localStorage.setItem("epwData", JSON.stringify(formattedData));
        console.log("EPW data saved to localStorage for heatmap visualization");
        return true;
    } else {
        console.error("Failed to format EPW data for heatmap visualization");
        return false;
    }
}

// If you can't find the exact function, add this to the viewHeatmapsBtn click handler
document.getElementById("viewHeatmapsBtn").addEventListener("click", function() {
    // Get the parsed EPW data
    if (!epwData) {
        alert("No EPW data available. Please process an EPW file first.");
        return;
    }
    
    // Format and save the data
    const formattedData = prepareDataForHeatmap(epwData.header, epwData.data);
    
    if (formattedData) {
        localStorage.setItem("epwData", JSON.stringify(formattedData));
        console.log("EPW data saved to localStorage for heatmap visualization");
        
        // Navigate to the heatmap page
        window.location.href = "epw-heatmap.html";
    } else {
        alert("Error: Cannot generate heatmaps. The weather data is missing required properties.");
    }
});

// Update the EPW file processing function to use Web Workers
function processEpwFile(file) {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    loadingIndicator.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = 'Preparing to process file...';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const rawEpwContent = e.target.result;
        
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
                    const dataToStore = {
                        header: result.locationData,
                        data: result.epwData
                    };
                    
                    // Use IndexedDB for storage instead of localStorage
                    storeEpwData(file.name, dataToStore)
                        .then(() => {
                            // Set a flag in sessionStorage
                            sessionStorage.setItem('epwDataLoaded', 'true');
                            sessionStorage.setItem('currentEpwFile', file.name);
                            
                            // Redirect to heatmap page
                            window.location.href = 'epw-heatmap.html';
                        })
                        .catch(error => {
                            console.error("Error storing EPW data:", error);
                            alert("Error: Could not store weather data. The dataset may be too large.");
                            loadingIndicator.style.display = 'none';
                        });
                } else {
                    console.error('Error parsing EPW file:', result.error);
                    alert('Error parsing EPW file: ' + result.error);
                    loadingIndicator.style.display = 'none';
                }
            }
        };
        
        // Send the raw EPW content to the worker
        worker.postMessage(rawEpwContent);
    };
    
    reader.onerror = function() {
        console.error("File reading failed");
        alert("Error reading the file. Please try again.");
        loadingIndicator.style.display = 'none';
    };
    
    reader.readAsText(file);
}

// Add IndexedDB storage functions
const dbName = 'EvapotranDB';
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

// Store EPW data in IndexedDB
async function storeEpwData(fileName, epwData) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([epwStoreName], 'readwrite');
        const store = transaction.objectStore(epwStoreName);
        
        const record = {
            fileName: fileName,
            epwData: epwData,
            dateAdded: new Date()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve(true);
            request.onerror = event => reject(event.target.error);
        });
    } catch (error) {
        console.error('Error storing EPW data:', error);
        return Promise.reject(error);
    }
}

// Retrieve EPW data from IndexedDB
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
        return Promise.reject(error);
    }
}

// Add event listener for the "Use Data" button
document.getElementById('useDataBtn').addEventListener('click', function() {
    transferDataToCalculator();
});

/**
 * Parse the content of an EPW file
 * @param {string} content - The text content of the EPW file
 * @param {function} progressCallback - Callback function to report progress
 * @returns {Object} Parsed EPW data
 */
function parseEpwContent(content, progressCallback) {
    // Split the content into lines
    const lines = content.split('\n');
    
    // EPW format has a specific structure:
    // Line 1: LOCATION info
    if (lines.length < 8) {
        throw new Error("Invalid EPW file format: not enough header lines");
    }
    
    // Parse the LOCATION line (first line)
    const locationLine = lines[0].trim();
    const locationParts = locationLine.split(',').map(part => part.trim());
    
    // EPW LOCATION line format: 
    // LOCATION,City,State/Province,Country,Source,WMO,Latitude,Longitude,Time Zone,Elevation
    const header = {
        location: locationLine,
        city: locationParts[1] || "Unknown",
        state: locationParts[2] || "",
        country: locationParts[3] || "",
        latitude: parseFloat(locationParts[6]) || 0,
        longitude: parseFloat(locationParts[7]) || 0,
        timeZone: parseFloat(locationParts[8]) || 0,
        elevation: parseFloat(locationParts[9]) || 0
    };
    
    console.log("Parsed header:", header); // Debug log
    
    // Parse the data rows (starting from line 9)
    const data = [];
    const totalLines = lines.length;
    
    for (let i = 8; i < totalLines; i++) {
        // Report progress
        if (progressCallback && i % 100 === 0) {
            const progress = Math.floor(((i - 8) / (totalLines - 8)) * 100);
            progressCallback(progress);
        }
        
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const fields = line.split(',');
        if (fields.length < 35) continue; // Skip incomplete lines
        
        // Extract relevant data
        const entry = {
            year: parseInt(fields[0]),
            month: parseInt(fields[1]),
            day: parseInt(fields[2]),
            hour: parseInt(fields[3]),
            dryBulbTemp: parseFloat(fields[6]),
            dewPointTemp: parseFloat(fields[7]),
            relativeHumidity: parseFloat(fields[8]),
            atmosphericPressure: parseFloat(fields[9]) / 100, // Convert Pa to kPa
            windSpeed: parseFloat(fields[21]),
            globalHorizontalRadiation: parseFloat(fields[13]),
            directNormalRadiation: parseFloat(fields[14]),
            diffuseHorizontalRadiation: parseFloat(fields[15])
        };
        
        // Calculate day of year
        const date = new Date(entry.year, entry.month - 1, entry.day);
        const startOfYear = new Date(entry.year, 0, 0);
        const diff = date - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        entry.dayOfYear = Math.floor(diff / oneDay);
        
        data.push(entry);
    }
    
    // Report 100% progress when done
    if (progressCallback) {
        progressCallback(100);
    }
    
    return { header, data };
}

// Enable the process button when a file is selected
document.getElementById('epwFile').addEventListener('change', function() {
    const processBtn = document.getElementById('processEpwBtn');
    processBtn.disabled = !this.files.length;
});

// Add this function to ensure data is properly formatted before saving
function prepareDataForHeatmap(header, data) {
    // Make sure all required properties exist in each data point
    const requiredProps = ["dryBulbTemp", "relativeHumidity", "windSpeed", "globalHorizontalRadiation"];
    
    // Check the first item to see if it has all required properties
    if (data.length > 0) {
        const firstItem = data[0];
        const missingProps = requiredProps.filter(prop => firstItem[prop] === undefined);
        
        if (missingProps.length > 0) {
            console.error(`Data missing required properties for heatmap: ${missingProps.join(', ')}`);
            return null;
        }
    }
    
    // Create the properly formatted data object
    return {
        header: header,
        data: data
    };
}

// Find where the data is saved to localStorage and modify it to use the prepare function
// This might be in a function like saveEpwData or similar
// Example:
function saveEpwData(header, data) {
    const formattedData = prepareDataForHeatmap(header, data);
    
    if (formattedData) {
        localStorage.setItem("epwData", JSON.stringify(formattedData));
        console.log("EPW data saved to localStorage for heatmap visualization");
        return true;
    } else {
        console.error("Failed to format EPW data for heatmap visualization");
        return false;
    }
}

// If you can't find the exact function, add this to the viewHeatmapsBtn click handler
document.getElementById("viewHeatmapsBtn").addEventListener("click", function() {
    // Get the parsed EPW data
    if (!epwData) {
        alert("No EPW data available. Please process an EPW file first.");
        return;
    }
    
    // Format and save the data
    const formattedData = prepareDataForHeatmap(epwData.header, epwData.data);
    
    if (formattedData) {
        localStorage.setItem("epwData", JSON.stringify(formattedData));
        console.log("EPW data saved to localStorage for heatmap visualization");
        
        // Navigate to the heatmap page
        window.location.href = "epw-heatmap.html";
    } else {
        alert("Error: Cannot generate heatmaps. The weather data is missing required properties.");
    }
});


