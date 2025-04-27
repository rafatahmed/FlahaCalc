 /** @format */
/*
###########################################################################################################
##                                   Credits                                                             ##
###########################################################################################################
##                                                                                                       ##
## EPW Weather Data Heatmap Visualization                                                                ##
## Author: Rafat Al Khashan                                                                              ##
## Email: rafat.khashan82@gmail.com                                                                      ##
## Corp.: Flaha Agri Tech                                                                                ##
## Corp.: info@flaha.org                                                                                 ##
##                                                                                                       ##
###########################################################################################################
*/

// Global variables
let epwData = null;
let locationData = null;
let heatmapCharts = {}; // Object to store multiple charts
let tooltip = null;

// DOM elements
const epwFileInput = document.getElementById('epwFile');
const processEpwBtn = document.getElementById('processEpwBtn');
const locationInfo = document.getElementById('locationInfo');
const heatmapContainer = document.getElementById('heatmapContainer');

// Parameters to display
const parameters = [
    'dryBulbTemp',
    'relativeHumidity',
    'windSpeed',
    'globalHorizontalRadiation',
    'directNormalRadiation',
    'diffuseHorizontalRadiation'
];

// Event listeners
epwFileInput.addEventListener('change', handleFileSelect);
processEpwBtn.addEventListener('click', processEpwFile);
// Remove paramSelect change listener since we're removing the select element

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
    try {
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
        
        // Show heatmap container and hide no data message
        document.getElementById('heatmapContainer').style.display = 'block';
        document.getElementById('noDataMessage').style.display = 'none';
        
        // Create heatmaps for all parameters
        createAllHeatmaps();
        
        console.log("EPW data loaded successfully:", epwData.length, "hours of data");
    } catch (error) {
        console.error("Error parsing EPW file:", error);
        alert("Error parsing EPW file. Please check the console for details.");
    }
}

// Display location information
function displayLocationInfo(location) {
    document.getElementById('locationName').textContent = `Location: ${location.city}, ${location.country}`;
    document.getElementById('locationLat').textContent = `Latitude: ${location.latitude.toFixed(2)} degrees`;
    document.getElementById('locationLon').textContent = `Longitude: ${location.longitude.toFixed(2)} degrees`;
    document.getElementById('locationElev').textContent = `Elevation: ${location.elevation.toFixed(2)} m`;
    
    locationInfo.style.display = 'block';
}

// Function to convert day of year to month and day
function dayOfYearToMonthDay(dayOfYear, year = new Date().getFullYear()) {
    const date = new Date(year, 0, dayOfYear);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Create heatmaps for all parameters
async function createAllHeatmaps() {
    try {
        await loadD3Library();
        
        // Create a heatmap for each parameter
        for (const param of parameters) {
            createCalendarHeatmap(param);
        }
    } catch (error) {
        console.error("Failed to load D3 library:", error);
        alert("Failed to load required libraries. Please check your internet connection.");
    }
}

// Prepare data for calendar heatmap
function prepareCalendarHeatmapData(paramName) {
    const dataPoints = [];
    let min = Infinity;
    let max = -Infinity;
    
    // Process data
    epwData.forEach(hourData => {
        const date = new Date(hourData.year, hourData.month - 1, hourData.day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Calculate week number (0-51)
        const startOfYear = new Date(hourData.year, 0, 1);
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const dayOfYear = Math.floor((date - startOfYear) / millisecondsPerDay);
        const weekIndex = Math.floor(dayOfYear / 7);
        
        // Get value for the selected parameter
        const value = hourData[paramName];
        
        // Skip invalid values
        if (isNaN(value) || value === undefined) return;
        
        // Update min and max
        min = Math.min(min, value);
        max = Math.max(max, value);
        
        // Store data point
        dataPoints.push({
            x: weekIndex,
            y: dayOfWeek,
            v: value,
            date: date
        });
    });
    
    return {
        dataPoints,
        min,
        max
    };
}

// Create calendar heatmap visualization for a specific parameter
function createCalendarHeatmap(paramName) {
    console.log(`Creating calendar heatmap for ${paramName}...`);
    
    // Clear any existing chart
    if (heatmapCharts[paramName]) {
        heatmapCharts[paramName].destroy();
        heatmapCharts[paramName] = null;
    }
    
    // Get the container and clear it
    const container = document.getElementById(`${paramName}-wrapper`);
    if (!container) {
        console.error(`Container for ${paramName} not found`);
        return;
    }
    container.innerHTML = '';
    
    // Prepare data for heatmap
    const data = prepareCalendarHeatmapData(paramName);
    
    if (data.dataPoints.length === 0) {
        console.error(`No valid data points for ${paramName} heatmap`);
        return;
    }
    
    // Configuration - increase cell size for better visibility
    const cellSize = 14; // Increased from 12
    const width = (cellSize + 1.5) * 53; // Width for 53 weeks
    const height = cellSize * 7; // Height for 7 days
    
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("style", "max-width: 100%; height: auto; font: 11px sans-serif;"); // Increased font size
    
    // Group data by year
    const yearData = d3.group(data.dataPoints, d => d.date.getFullYear());
    const years = Array.from(yearData.entries());
    
    // Create a group for each year
    years.forEach(([year, values], i) => {
        const yearGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        yearGroup.setAttribute("transform", `translate(40.5, ${cellSize * 1.5})`);
        
        // Add year label
        const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yearLabel.setAttribute("x", -5);
        yearLabel.setAttribute("y", -5);
        yearLabel.setAttribute("font-weight", "bold");
        yearLabel.setAttribute("text-anchor", "end");
        yearLabel.textContent = year;
        yearGroup.appendChild(yearLabel);
        
        // Add day labels (Sun-Sat)
        const dayLabels = document.createElementNS("http://www.w3.org/2000/svg", "g");
        dayLabels.setAttribute("text-anchor", "end");
        
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach((day, j) => {
            const dayLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dayLabel.setAttribute("x", -5);
            dayLabel.setAttribute("y", (j + 0.5) * cellSize);
            dayLabel.setAttribute("dy", "0.31em");
            dayLabel.textContent = day;
            dayLabels.appendChild(dayLabel);
        });
        yearGroup.appendChild(dayLabels);
        
        // Create cells for each data point
        const cellGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        // Group data by day to get daily averages
        const dailyData = d3.rollup(
            values,
            v => d3.mean(v, d => d.v),
            d => d.date.toDateString()
        );
        
        // Create a map of week index to day of week to value
        const cellMap = new Map();
        
        for (const [dateStr, value] of dailyData.entries()) {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Calculate week number (0-51)
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const dayOfYear = Math.floor((date - startOfYear) / millisecondsPerDay);
            const weekIndex = Math.floor(dayOfYear / 7);
            
            if (!cellMap.has(weekIndex)) {
                cellMap.set(weekIndex, new Map());
            }
            cellMap.get(weekIndex).set(dayOfWeek, value);
        }
        
        // Create cells
        for (const [weekIndex, dayMap] of cellMap.entries()) {
            for (const [dayOfWeek, value] of dayMap.entries()) {
                const cell = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                cell.setAttribute("width", cellSize - 1);
                cell.setAttribute("height", cellSize - 1);
                cell.setAttribute("x", weekIndex * cellSize + 0.5);
                cell.setAttribute("y", dayOfWeek * cellSize + 0.5);
                
                // Calculate color based on value
                const normalizedValue = (value - data.min) / (data.max - data.min);
                cell.setAttribute("fill", d3ColorScale(normalizedValue));
                
                // Create date object for this cell
                const date = new Date(year, 0, 1);
                date.setDate(date.getDate() + weekIndex * 7 + dayOfWeek);
                
                // Add event listeners for custom tooltip
                cell.addEventListener('mouseover', (e) => showTooltip(e, date, paramName, value));
                cell.addEventListener('mouseout', hideTooltip);
                
                cellGroup.appendChild(cell);
            }
        }
        
        yearGroup.appendChild(cellGroup);
        
        // Add month separators
        const monthGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        // Get all months in the year
        const months = [];
        for (let month = 0; month < 12; month++) {
            months.push(new Date(year, month, 1));
        }
        
        // Add month labels and separators
        months.forEach(date => {
            const monthIndex = date.getMonth();
            
            // Calculate week index for the first day of the month
            const startOfYear = new Date(year, 0, 1);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const dayOfYear = Math.floor((date - startOfYear) / millisecondsPerDay);
            const weekIndex = Math.floor(dayOfYear / 7);
            
            // Add month label
            const monthLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            monthLabel.setAttribute("x", weekIndex * cellSize + 2);
            monthLabel.setAttribute("y", -5);
            monthLabel.textContent = date.toLocaleString('default', { month: 'short' });
            monthGroup.appendChild(monthLabel);
            
            // Add separator line (except for January)
            if (date.getMonth() > 0) {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", "#fff");
                path.setAttribute("stroke-width", 1.5);
                
                // Create path for month separator
                const d = `M${weekIndex * cellSize},0V${7 * cellSize}`;
                path.setAttribute("d", d);
                
                monthGroup.appendChild(path);
            }
        });
        
        yearGroup.appendChild(monthGroup);
        svg.appendChild(yearGroup);
    });
    
    // Add the SVG to the container
    container.appendChild(svg);
    
    // Update legend
    updateLegend(data.min, data.max, paramName);
    
    // Update statistics
    updateStatistics(paramName, data);
    
    console.log("Calendar heatmap created successfully");
}

// Update heatmap when parameter changes
function updateHeatmap() {
    if (epwData) {
        createHeatmap();
    }
}

// Update legend with min and max values
function updateLegend(min, max, paramName) {
    const legendMin = document.querySelector(`#${paramName}-min`);
    const legendMax = document.querySelector(`#${paramName}-max`);
    
    if (legendMin && legendMax) {
        const unit = getParameterUnit(paramName);
        legendMin.textContent = `${min.toFixed(1)} ${unit}`;
        legendMax.textContent = `${max.toFixed(1)} ${unit}`;
    }
}

// Get parameter unit based on parameter name
function getParameterUnit(paramName) {
    const units = {
        'dryBulbTemp': '°C',
        'dewPointTemp': '°C',
        'relativeHumidity': '%',
        'atmosphericPressure': 'kPa',
        'windDirection': '°',
        'windSpeed': 'm/s',
        'globalHorizontalRadiation': 'Wh/m²',
        'directNormalRadiation': 'Wh/m²',
        'diffuseHorizontalRadiation': 'Wh/m²',
        'extraterrestrialRadiation': 'Wh/m²'
    };
    
    return units[paramName] || '';
}

// Helper function to get day of year from date
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 0);
    const diff = date - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Helper function to get day of year
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const start = new Date(year, 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Add event listener for window resize
window.addEventListener('resize', function() {
    if (heatmapChart) {
        heatmapChart.resize();
    }
});

// Function to get parameter unit
function getParameterUnit(paramName) {
    const units = {
        'dryBulbTemp': '°C',
        'dewPointTemp': '°C',
        'relativeHumidity': '%',
        'atmosphericPressure': 'kPa',
        'windSpeed': 'm/s',
        'windDirection': '°',
        'globalHorizontalRadiation': 'Wh/m²',
        'directNormalRadiation': 'Wh/m²',
        'diffuseHorizontalRadiation': 'Wh/m²',
        'extraterrestrialRadiation': 'Wh/m²'
    };
    
    return units[paramName] || '';
}

// Helper function to get day of year from date
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 0);
    const diff = date - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Helper function to get day of year
function getDayOfYear(year, month, day) {
    const date = new Date(year, month - 1, day);
    const start = new Date(year, 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// Function to generate a unified color scale for all heatmaps
function d3ColorScale(value) {
    // Using a more distinguishable color scale (similar to viridis/spectral)
    const colors = [
        '#313695', // deep blue
        '#4575b4', // blue
        '#74add1', // light blue
        '#abd9e9', // pale blue
        '#e0f3f8', // very pale blue
        '#ffffbf', // pale yellow
        '#fee090', // light orange
        '#fdae61', // orange
        '#f46d43', // dark orange
        '#d73027', // red
        '#a50026'  // dark red
    ];
    
    // Use direct value mapping (low values are blue, high values are red)
    // No longer reversing the value
    
    // Map the value to a color index with better interpolation
    const index = Math.min(Math.floor(value * (colors.length - 1)), colors.length - 2);
    const remainder = (value * (colors.length - 1)) - index;
    
    // Simple linear interpolation between colors for smoother gradient
    if (remainder > 0) {
        const c1 = hexToRgb(colors[index]);
        const c2 = hexToRgb(colors[index + 1]);
        
        return `rgb(${Math.round(c1.r + remainder * (c2.r - c1.r))}, 
                    ${Math.round(c1.g + remainder * (c2.g - c1.g))}, 
                    ${Math.round(c1.b + remainder * (c2.b - c1.b))})`;
    }
    
    return colors[index];
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}

// Make sure we have the d3 library loaded
function loadD3Library() {
    return new Promise((resolve, reject) => {
        if (window.d3) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v7.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Update the createHeatmap function to load D3 first
async function createHeatmap() {
    try {
        await loadD3Library();
        createCalendarHeatmap();
    } catch (error) {
        console.error("Failed to load D3 library:", error);
        alert("Failed to load required libraries. Please check your internet connection.");
    }
}

// Function to get parameter display name
function getParameterDisplayName(paramName) {
    const displayName = {
        'dryBulbTemp': 'Dry Bulb Temperature',
        'relativeHumidity': 'Relative Humidity',
        'windSpeed': 'Wind Speed',
        'globalHorizontalRadiation': 'Global Horizontal Radiation',
        'directNormalRadiation': 'Direct Normal Radiation',
        'diffuseHorizontalRadiation': 'Diffuse Horizontal Radiation'
    };
    
    return displayName[paramName] || paramName;
}

// Initialize tooltip
function initTooltip() {
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'heatmap-tooltip';
        document.body.appendChild(tooltip);
    }
}

// Show tooltip with proper parameters
function showTooltip(event, date, paramName, value) {
    initTooltip();
    
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const paramDisplayName = getParameterDisplayName(paramName);
    const unit = getParameterUnit(paramName);
    
    tooltip.innerHTML = `
        <div class="heatmap-tooltip-date">${formattedDate}</div>
        <div class="heatmap-tooltip-value">${paramDisplayName}: ${value.toFixed(1)} ${unit}</div>
    `;
    
    // Position the tooltip
    const rect = event.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    tooltip.style.top = `${rect.top + scrollTop - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + scrollLeft + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    tooltip.classList.add('visible');
}

// Hide tooltip
function hideTooltip() {
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// Add this function to calculate and display statistics
function updateStatistics(paramName, data) {
    const min = data.min;
    const max = data.max;
    
    // Calculate average
    let sum = 0;
    let count = 0;
    data.dataPoints.forEach(point => {
        sum += point.v;
        count++;
    });
    const avg = count > 0 ? sum / count : 0;
    
    // Update DOM elements
    const minElement = document.getElementById(`${paramName}-stat-min`);
    const maxElement = document.getElementById(`${paramName}-stat-max`);
    const avgElement = document.getElementById(`${paramName}-stat-avg`);
    
    if (minElement && maxElement && avgElement) {
        const unit = getParameterUnit(paramName);
        minElement.textContent = `${min.toFixed(1)} ${unit}`;
        maxElement.textContent = `${max.toFixed(1)} ${unit}`;
        avgElement.textContent = `${avg.toFixed(1)} ${unit}`;
    }
}

// Call this function at the end of createCalendarHeatmap
// Add after updateLegend call:
updateStatistics(paramName, data);






