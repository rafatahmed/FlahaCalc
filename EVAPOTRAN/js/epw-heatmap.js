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
let heatmapChart = null;

// DOM elements
const epwFileInput = document.getElementById('epwFile');
const paramSelect = document.getElementById('paramSelect');
const processEpwBtn = document.getElementById('processEpwBtn');
const locationInfo = document.getElementById('locationInfo');
const heatmapContainer = document.getElementById('heatmapContainer');
const legendContainer = document.getElementById('legendContainer');

// Event listeners
epwFileInput.addEventListener('change', handleFileSelect);
processEpwBtn.addEventListener('click', processEpwFile);
paramSelect.addEventListener('change', updateHeatmap);

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
        
        // Enable parameter selection
        paramSelect.disabled = false;
        
        // Show heatmap container and hide no data message
        document.getElementById('heatmapContainer').style.display = 'block';
        document.getElementById('noDataMessage').style.display = 'none';
        
        // Create initial heatmap
        createHeatmap();
        
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

// Create heatmap visualization
function createHeatmap() {
    console.log("Creating heatmap...");
    
    // Destroy existing chart if it exists
    if (heatmapChart) {
        console.log("Destroying existing chart");
        heatmapChart.destroy();
    }
    
    // Prepare data for heatmap
    const data = prepareHeatmapData();
    
    if (data.dataPoints.length === 0) {
        console.error("No valid data points for heatmap");
        return;
    }
    
    // Get canvas context
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    
    // Create matrix chart (for heatmap visualization)
    heatmapChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: paramSelect.options[paramSelect.selectedIndex].text,
                data: data.dataPoints,
                backgroundColor: (context) => {
                    if (!context || !context.dataset || !context.dataset.data || !context.dataIndex) {
                        return 'rgba(0, 0, 255, 0.5)';
                    }
                    
                    const value = context.dataset.data[context.dataIndex].v;
                    const min = data.min;
                    const max = data.max;
                    const normalizedValue = (value - min) / (max - min);
                    
                    // Color scale similar to the D3 example (green to red)
                    return d3ColorScale(normalizedValue);
                },
                borderWidth: 1,
                borderColor: '#fff',
                width: (ctx) => {
                    // Fixed width for each cell
                    return 20;
                },
                height: (ctx) => {
                    // Fixed height for each cell
                    return 20;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 40,
                    left: 60
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            if (!context || context.length === 0) return '';
                            const dataPoint = context[0].dataset.data[context[0].dataIndex];
                            const date = dayOfYearToMonthDay(dataPoint.y);
                            return `${date} (Day ${dataPoint.y}), Hour ${dataPoint.x}`;
                        },
                        label: function(context) {
                            const dataPoint = context.dataset.data[context.dataIndex];
                            const paramName = paramSelect.options[paramSelect.selectedIndex].text;
                            const unit = getParameterUnit(paramSelect.value);
                            return `${paramName}: ${dataPoint.v.toFixed(1)} ${unit}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 23,
                    offset: true,
                    title: {
                        display: true,
                        text: 'Hour of Day',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        maxRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    min: 1,
                    max: 365,
                    offset: true,
                    reverse: true,
                    title: {
                        display: true,
                        text: 'Day of Year',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            // Show day numbers at the beginning of each month
                            const monthStarts = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            
                            for (let i = 0; i < monthStarts.length; i++) {
                                if (value === monthStarts[i]) {
                                    return `${monthNames[i]} (${value})`;
                                }
                            }
                            
                            // Show every 30th day
                            if (value % 30 === 0) {
                                return value;
                            }
                            
                            return '';
                        },
                        stepSize: 10,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    console.log("Heatmap created successfully");
    
    // Update legend
    updateLegend(data.min, data.max);
}

// Prepare data for heatmap
function prepareHeatmapData() {
    const selectedParam = paramSelect.value;
    const dataPoints = [];
    let min = Infinity;
    let max = -Infinity;
    
    // Create a 2D array to store values by day and hour
    const valuesByDayAndHour = {};
    
    // Process data
    epwData.forEach(hourData => {
        const dayOfYear = getDayOfYear(hourData.year, hourData.month, hourData.day);
        const hour = hourData.hour - 1; // EPW hours are 1-24, we need 0-23
        
        // Skip if hour is out of range (some EPW files have hour 24)
        if (hour < 0 || hour > 23) return;
        
        const value = hourData[selectedParam];
        
        // Skip invalid values
        if (isNaN(value) || value === undefined) return;
        
        // Update min and max
        min = Math.min(min, value);
        max = Math.max(max, value);
        
        // Store value by day and hour
        const key = `${dayOfYear}-${hour}`;
        valuesByDayAndHour[key] = value;
    });
    
    // Create data points for each day and hour
    for (let day = 1; day <= 365; day++) {
        for (let hour = 0; hour <= 23; hour++) {
            const key = `${day}-${hour}`;
            if (valuesByDayAndHour[key] !== undefined) {
                dataPoints.push({
                    x: hour,
                    y: day,
                    v: valuesByDayAndHour[key]
                });
            }
        }
    }
    
    return {
        dataPoints,
        min,
        max
    };
}

// Update heatmap when parameter changes
function updateHeatmap() {
    if (epwData) {
        createHeatmap();
    }
}

// Update legend with min and max values
function updateLegend(min, max) {
    const legendMin = document.querySelector('.legend-min');
    const legendMax = document.querySelector('.legend-max');
    
    if (legendMin && legendMax) {
        const unit = getParameterUnit(paramSelect.value);
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

// Function to generate a color scale similar to the D3 example
function d3ColorScale(value) {
    // Similar to D3's schemeRdYlGn color scale
    const colors = [
        '#d73027', // dark red
        '#f46d43', // red-orange
        '#fdae61', // orange
        '#fee08b', // yellow
        '#d9ef8b', // light green
        '#a6d96a', // green
        '#66bd63', // medium green
        '#1a9850'  // dark green
    ];
    
    // Reverse the colors to match the D3 example (low values are green, high values are red)
    const reversedValue = 1 - value;
    
    // Map the value to a color index
    const index = Math.min(Math.floor(reversedValue * colors.length), colors.length - 1);
    
    return colors[index];
}













