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

// Global variables to store EPW data
let epwData = null;
let locationData = null;
let selectedDayData = null;

// DOM elements
const epwFileInput = document.getElementById('epwFile');
const daySelect = document.getElementById('daySelect');
const processEpwBtn = document.getElementById('processEpwBtn');
const locationInfo = document.getElementById('locationInfo');
const weatherData = document.getElementById('weatherData');
const weatherDataBody = document.getElementById('weatherDataBody');
const useDataBtn = document.getElementById('useDataBtn');

// Event listeners
epwFileInput.addEventListener('change', handleFileSelect);
daySelect.addEventListener('change', handleDaySelect);
processEpwBtn.addEventListener('click', processEpwFile);
useDataBtn.addEventListener('click', transferDataToCalculator);

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processEpwBtn.disabled = false;
    } else {
        processEpwBtn.disabled = true;
    }
}

// Process the EPW file
function processEpwFile() {
    const file = epwFileInput.files[0];
    if (!file) {
        alert('Please select an EPW file first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        parseEpwFile(contents);
    };
    reader.readAsText(file);
}

// Parse EPW file content
function parseEpwFile(contents) {
    // Split the file into lines
    const lines = contents.split('\n');
    
    // Extract location data (line 1)
    const locationLine = lines[0].split(',');
    locationData = {
        city: locationLine[1],
        state: locationLine[2],
        country: locationLine[3],
        source: locationLine[4],
        latitude: parseFloat(locationLine[6]),
        longitude: parseFloat(locationLine[7]),
        timezone: parseFloat(locationLine[8]),
        elevation: parseFloat(locationLine[9])
    };
    
    // Display location information
    displayLocationInfo(locationData);
    
    // Extract weather data (starting from line 9)
    epwData = [];
    for (let i = 8; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
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
                    atmosphericPressure: parseFloat(fields[9]) / 1000, // Convert Pa to kPa
                    windDirection: parseFloat(fields[20]),
                    windSpeed: parseFloat(fields[21]),
                    globalHorizontalRadiation: parseFloat(fields[13]),
                    directNormalRadiation: parseFloat(fields[14]),
                    diffuseHorizontalRadiation: parseFloat(fields[15]),
                    extraterrestrialRadiation: parseFloat(fields[28])
                });
            }
        }
    }
    
    // Populate day selection dropdown
    populateDaySelect();
    
    // Enable day selection
    daySelect.disabled = false;
}

// Display location information
function displayLocationInfo(location) {
    document.getElementById('locationName').textContent = `Location: ${location.city}, ${location.country}`;
    document.getElementById('locationLat').textContent = `Latitude: ${location.latitude.toFixed(2)} degrees`;
    document.getElementById('locationLon').textContent = `Longitude: ${location.longitude.toFixed(2)} degrees`;
    document.getElementById('locationElev').textContent = `Elevation: ${location.elevation.toFixed(2)} m`;
    document.getElementById('locationTimeZone').textContent = `Time Zone: ${location.timezone} hours`;
    
    locationInfo.style.display = 'block';
}

// Populate day selection dropdown
function populateDaySelect() {
    // Clear existing options
    daySelect.innerHTML = '<option value="">-- Select a day --</option>';
    
    // Create a map to store unique days
    const uniqueDays = new Map();
    
    // Populate the map with unique days
    epwData.forEach(hourData => {
        const dateKey = `${hourData.year}-${hourData.month}-${hourData.day}`;
        const dayOfYear = getDayOfYear(hourData.year, hourData.month, hourData.day);
        
        if (!uniqueDays.has(dateKey)) {
            uniqueDays.set(dateKey, {
                dateKey,
                dayOfYear,
                displayDate: `${hourData.year}-${hourData.month.toString().padStart(2, '0')}-${hourData.day.toString().padStart(2, '0')} (Day ${dayOfYear})`
            });
        }
    });
    
    // Add options to the dropdown
    Array.from(uniqueDays.values()).forEach(day => {
        const option = document.createElement('option');
        option.value = day.dateKey;
        option.textContent = day.displayDate;
        option.dataset.dayOfYear = day.dayOfYear;
        daySelect.appendChild(option);
    });
}

// Handle day selection
function handleDaySelect() {
    const selectedDateKey = daySelect.value;
    if (!selectedDateKey) {
        weatherData.style.display = 'none';
        document.getElementById('output').style.display = 'none';
        return;
    }
    
    // Extract date components
    const [year, month, day] = selectedDateKey.split('-').map(Number);
    
    // Filter data for the selected day
    const dayData = epwData.filter(hourData => 
        hourData.year === year && hourData.month === month && hourData.day === day
    );
    
    // Calculate daily averages
    selectedDayData = calculateDailyAverages(dayData);
    
    // Display the weather data
    displayWeatherData(selectedDayData);
    
    // Show the weather data and output sections
    weatherData.style.display = 'block';
    document.getElementById('output').style.display = 'block';
}

// Calculate daily averages from hourly data
function calculateDailyAverages(dayData) {
    // Calculate averages
    const avgTemp = dayData.reduce((sum, hour) => sum + hour.dryBulbTemp, 0) / dayData.length;
    const avgDewPoint = dayData.reduce((sum, hour) => sum + hour.dewPointTemp, 0) / dayData.length;
    const avgRH = dayData.reduce((sum, hour) => sum + hour.relativeHumidity, 0) / dayData.length;
    const avgPressure = dayData.reduce((sum, hour) => sum + hour.atmosphericPressure, 0) / dayData.length;
    const avgWindSpeed = dayData.reduce((sum, hour) => sum + hour.windSpeed, 0) / dayData.length;
    
    // Calculate sunshine duration (hours with direct normal radiation > 0)
    const sunshineHours = dayData.filter(hour => hour.directNormalRadiation > 0).length;
    
    // Get day of year
    const dayOfYear = getDayOfYear(dayData[0].year, dayData[0].month, dayData[0].day);
    
    return {
        date: `${dayData[0].year}-${dayData[0].month}-${dayData[0].day}`,
        dayOfYear,
        temperature: avgTemp,
        dewPointTemperature: avgDewPoint,
        relativeHumidity: avgRH,
        atmosphericPressure: avgPressure,
        windSpeed: avgWindSpeed,
        sunshineDuration: sunshineHours
    };
}

// Display weather data
function displayWeatherData(data) {
    // Clear existing data
    weatherDataBody.innerHTML = '';
    
    // Add rows for each parameter
    addDataRow('Date', data.date, '');
    addDataRow('Day of Year', data.dayOfYear, '');
    addDataRow('Average Temperature', data.temperature.toFixed(1), '°C');
    addDataRow('Average Dew Point', data.dewPointTemperature.toFixed(1), '°C');
    addDataRow('Average Relative Humidity', data.relativeHumidity.toFixed(1), '%');
    addDataRow('Average Atmospheric Pressure', data.atmosphericPressure.toFixed(2), 'kPa');
    addDataRow('Average Wind Speed', data.windSpeed.toFixed(2), 'm/s');
    addDataRow('Sunshine Duration', data.sunshineDuration.toFixed(1), 'hours');
    addDataRow('Latitude', locationData.latitude.toFixed(2), 'degrees');
    addDataRow('Elevation', locationData.elevation.toFixed(1), 'm');
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
    if (!selectedDayData || !locationData) {
        alert('Please select a day first.');
        return;
    }
    
    // Store data in localStorage
    localStorage.setItem('etoCalcData', JSON.stringify({
        temperature: selectedDayData.temperature,
        windSpeed: selectedDayData.windSpeed,
        relativeHumidity: selectedDayData.relativeHumidity,
        atmosphericPressure: selectedDayData.atmosphericPressure,
        elevation: locationData.elevation,
        latitude: locationData.latitude,
        dayNumber: selectedDayData.dayOfYear,
        sunshineDuration: selectedDayData.sunshineDuration
    }));
    
    // Redirect to the calculator page instead of index.html
    window.location.href = 'calculator.html';
}

// Helper function to get day of year
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 0);
    const diff = date - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

