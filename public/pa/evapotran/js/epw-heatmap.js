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
let selectedFile = null;
let epwData = [];

// Function to check if D3.js is loaded
function checkD3Loaded() {
    if (typeof d3 === 'undefined') {
        const heatmapContainer = document.getElementById("heatmapContainer");
        if (heatmapContainer) {
            heatmapContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error: D3.js Library Not Loaded</h3>
                    <p>The D3.js visualization library could not be loaded. This is required for creating the weather heatmaps.</p>
                    <p>Please check your internet connection and try refreshing the page.</p>
                </div>
            `;
            heatmapContainer.style.display = "block";
        }
        return false;
    }
    return true;
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
	console.log("EPW Heatmap page loaded, checking for stored EPW data...");

	// Initialize tooltip element
	initTooltip();

	// Get DOM elements
	const fileUploadSection = document.getElementById("SBlock1A");
	const processEpwBtn = document.getElementById("processEpwBtn");
	const dataSourceInfo = document.getElementById("dataSourceInfo");
	const noDataMessage = document.getElementById("noDataMessage");
	const heatmapContainer = document.getElementById("heatmapContainer");
	const epwFileInput = document.getElementById("epwFile");

	// Add event listeners
	if (epwFileInput) {
		epwFileInput.addEventListener("change", handleFileSelect);
	}

	if (processEpwBtn) {
		processEpwBtn.addEventListener("click", processEpwFile);
	}

	// Check for stored EPW data or session flag
	const storedEpwContent = localStorage.getItem("epwFileContent");
	const storedEpwData = localStorage.getItem("epwData");
	const dataLoadedFlag = sessionStorage.getItem("epwDataLoaded");

	console.log(
		"EPW content found in localStorage:",
		storedEpwContent ? "Yes, length: " + storedEpwContent.length : "No"
	);
	console.log(
		"EPW data found in localStorage:",
		storedEpwData ? "Yes" : "No"
	);
	console.log(
		"EPW data loaded flag in sessionStorage:",
		dataLoadedFlag || "No"
	);

	// Debug localStorage content
	debugLocalStorage();

	// If we have data in localStorage OR the flag is set (meaning data was already processed)
	if (storedEpwContent || storedEpwData || dataLoadedFlag === "true") {
		console.log("EPW data available, hiding file upload section");
		
		// Hide the file upload section
		if (fileUploadSection) {
			fileUploadSection.style.display = "none";
		}
		
		// Hide the process button
		if (processEpwBtn) {
			processEpwBtn.style.display = "none";
		}
		
		// Show success message
		if (dataSourceInfo) {
			dataSourceInfo.style.display = "block";
		}
		
		// Hide no data message
		if (noDataMessage) {
			noDataMessage.style.display = "none";
		}
		
		// Show heatmap container
		if (heatmapContainer) {
			heatmapContainer.style.display = "block";
			console.log("Heatmap container shown in DOMContentLoaded");
		}
		
		// Parse data if available
		let dataProcessed = false;
		
		if (storedEpwContent) {
			console.log("Calling parseEpwFile with stored content");
			parseEpwFile(storedEpwContent);
			dataProcessed = true;
		} else if (storedEpwData) {
			console.log("Using stored EPW data from epw-import page");
			try {
				const parsedData = JSON.parse(storedEpwData);
				console.log("Parsed data structure:", parsedData);
				
				// Use our detailed inspection function
				const isValidData = inspectDataStructure(parsedData);
				
				if (isValidData) {
					// If data is in the expected format (object with data array)
					if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
						console.log(`Successfully parsed ${parsedData.data.length} data points from localStorage`);
						
						// Display location info if available
						if (parsedData.header) {
							displayLocationInfo(parsedData.header);
						}
						
						// Use the data array for heatmaps
						epwData = parsedData.data;
						generateAllHeatmaps(epwData);
						dataProcessed = true;
					} 
					// If data is directly an array (old format)
					else if (Array.isArray(parsedData)) {
						epwData = parsedData;
						console.log(`Successfully parsed ${epwData.length} data points from localStorage (array format)`);
						generateAllHeatmaps(epwData);
						dataProcessed = true;
					} 
					else {
						throw new Error("The stored weather data is in an invalid format");
					}
				} else {
					throw new Error("The weather data is missing required properties");
				}
			} catch (error) {
				console.error("Error parsing EPW data from localStorage:", error);
				
				// Show error message
				if (dataSourceInfo) {
					dataSourceInfo.innerHTML = `<p class="error">Error: ${error.message}. Please upload a new EPW file.</p>`;
				}
				
				// Show file upload section again
				if (fileUploadSection) {
					fileUploadSection.style.display = "block";
				}
				
				// Show process button
				if (processEpwBtn) {
					processEpwBtn.style.display = "block";
					processEpwBtn.disabled = true;
				}
				
				// Clear invalid data
				localStorage.removeItem("epwData");
				sessionStorage.removeItem("epwDataLoaded");
			}
		}
		
		// If no data was successfully processed but the flag was set
		if (!dataProcessed && dataLoadedFlag === "true") {
			console.error("Data loaded flag was set but no valid data was found");
			
			// Show error message
			if (dataSourceInfo) {
				dataSourceInfo.innerHTML = `<p class="error">Error: No valid weather data found. Please upload a new EPW file.</p>`;
			}
			
			// Show file upload section again
			if (fileUploadSection) {
				fileUploadSection.style.display = "block";
			}
			
			// Show process button
			if (processEpwBtn) {
				processEpwBtn.style.display = "block";
				processEpwBtn.disabled = true;
			}
			
			// Clear invalid flag
			sessionStorage.removeItem("epwDataLoaded");
		}
	} else {
		console.log("No EPW data found, showing file upload section");
		if (fileUploadSection) {
			fileUploadSection.style.display = "block";
		}
	}
});

// Handle file selection
function handleFileSelect(event) {
	const file = event.target.files[0];
	if (!file) return;

	// Enable the process button when a file is selected
	document.getElementById("processEpwBtn").disabled = false;

	// Store the file for later processing
	selectedFile = file;
}

// Process the selected EPW file
function processEpwFile() {
	// Make sure we have a valid file
	if (!selectedFile) {
		console.error("No file selected");
		return;
	}

	const reader = new FileReader();
	reader.onload = function (e) {
		// Process the file content
		const content = e.target.result;
		parseEpwFile(content);
	};

	// Pass the selectedFile (which should be a valid File object)
	reader.readAsText(selectedFile);
}

// Parse EPW file content
function parseEpwFile(content) {
	// Clear any existing data
	epwData = [];
	
	console.log("Parsing EPW file content...");

	// Split the content into lines
	const lines = content.split("\n");
	
	// Extract header information (first 8 lines)
	const headerLines = lines.slice(0, 8);
	const header = {
		location: headerLines[0] || "",
		city: headerLines[0].split(",")[1] || "",
		state: headerLines[0].split(",")[2] || "",
		country: headerLines[0].split(",")[3] || "",
		latitude: parseFloat(headerLines[0].split(",")[6] || 0),
		longitude: parseFloat(headerLines[0].split(",")[7] || 0),
		timeZone: parseFloat(headerLines[0].split(",")[8] || 0),
		elevation: parseFloat(headerLines[0].split(",")[9] || 0)
	};
	
	console.log("Extracted header:", header);

	// Skip header lines (first 8 lines in EPW format)
	const dataLines = lines.slice(8);
	
	console.log(`Processing ${dataLines.length} data lines...`);

	// Process each data line
	dataLines.forEach((line) => {
		if (line.trim() === "") return; // Skip empty lines

		const values = line.split(",");
		if (values.length < 6) return; // Skip invalid lines

		// Extract data from the line
		const year = parseInt(values[0]);
		const month = parseInt(values[1]);
		const day = parseInt(values[2]);
		const hour = parseInt(values[3]);
		const dryBulbTemp = parseFloat(values[6]);
		const relativeHumidity = parseFloat(values[8]);
		const atmosphericPressure = parseFloat(values[9]);
		const windSpeed = parseFloat(values[21]);
		const globalHorizontalRadiation = parseFloat(values[13]);
		const directNormalRadiation = parseFloat(values[14]);
		const diffuseHorizontalRadiation = parseFloat(values[15]);

		// Add data point to array
		epwData.push({
			year,
			month,
			day,
			hour,
			dryBulbTemp,
			relativeHumidity,
			atmosphericPressure,
			windSpeed,
			globalHorizontalRadiation,
			directNormalRadiation,
			diffuseHorizontalRadiation,
		});
	});

	// Store flag in sessionStorage
	sessionStorage.setItem("epwDataLoaded", "true");

	// Hide file upload section
	document.getElementById("SBlock1A").style.display = "none";
	document.getElementById("processEpwBtn").style.display = "none";

	// Show success message
	document.getElementById("dataSourceInfo").style.display = "block";

	// Generate heatmaps
	generateAllHeatmaps(epwData);
}

// Generate all heatmaps
function generateAllHeatmaps(data) {
	// Check if D3.js is loaded
	if (!checkD3Loaded()) {
		return;
	}
	
	// Validate data with more detailed logging
	if (!data) {
		console.error("Data is null or undefined");
		showErrorMessage("Data is missing");
		return;
	}
	
	if (!Array.isArray(data)) {
		console.error("Data is not an array:", typeof data, data);
		
		// Check if it's the object format with a data property
		if (typeof data === 'object' && data.data && Array.isArray(data.data)) {
			console.log("Found data array inside object, using that instead");
			data = data.data;
		} else {
			showErrorMessage("Data format is invalid");
			return;
		}
	}
	
	if (data.length === 0) {
		console.error("Data array is empty");
		showErrorMessage("No weather data points found");
		return;
	}
	
	// Check if first item has required properties
	const firstItem = data[0];
	console.log("First data item for heatmap:", firstItem);
	console.log("First data item keys:", Object.keys(firstItem));
	
	// Check for required properties in the first data item
	const requiredProps = ["dryBulbTemp", "relativeHumidity", "windSpeed", "globalHorizontalRadiation"];
	const missingProps = requiredProps.filter(prop => {
		const hasProperty = firstItem[prop] !== undefined;
		console.log(`Property ${prop}: ${hasProperty ? "Present" : "Missing"}`);
		return !hasProperty;
	});
	
	if (missingProps.length > 0) {
		console.error(`Data items missing required properties: ${missingProps.join(', ')}`, firstItem);
		showErrorMessage(`Weather data missing required properties: ${missingProps.join(', ')}`);
		return;
	}

	console.log(`Generating heatmaps with ${data.length} data points`);
	console.log("Sample data:", data.slice(0, 3)); // Log first 3 items for debugging

	// Make sure the heatmap container is visible
	const heatmapContainer = document.getElementById("heatmapContainer");
	if (heatmapContainer) {
		heatmapContainer.style.display = "block";
	}

	// Define parameters to visualize
	const parameters = [
		"dryBulbTemp",
		"relativeHumidity",
		"windSpeed",
		"globalHorizontalRadiation",
		"directNormalRadiation",
		"diffuseHorizontalRadiation"
	];

	// Generate heatmaps for each parameter
	parameters.forEach((parameter) => {
		// Check if container exists before generating
		if (document.getElementById(`${parameter}-wrapper`)) {
			generateHeatmap(data, parameter);
		} else {
			console.warn(`Container for ${parameter} not found, skipping`);
		}
	});
}

// Generate a single heatmap
function generateHeatmap(data, parameter) {
	const containerId = `${parameter}-wrapper`;
	const container = document.getElementById(containerId);

	if (!container) {
		console.error(`Heatmap container for ${parameter} not found`);
		return;
	}

	// Calculate statistics for this parameter
	const stats = calculateStats(data, parameter);
	
	// Update the statistics display
	updateStats(parameter, stats);
	
	// Create the heatmap
	createHeatmap(data, parameter, containerId);
}

// Create a heatmap visualization
function createHeatmap(data, parameter, containerId) {
	// Get container and check if it exists
	const container = document.getElementById(containerId);
	if (!container) {
		console.error(`Container with ID "${containerId}" not found`);
		return;
	}

	// Validate data is an array
	if (!Array.isArray(data)) {
		console.error(`Data for ${parameter} is not an array:`, data);
		return;
	}

	// Check if data is empty
	if (data.length === 0) {
		console.error(`Data array for ${parameter} is empty`);
		container.innerHTML = "<p>No data available for visualization</p>";
		return;
	}
	
	console.log(`Creating heatmap for ${parameter} with ${data.length} data points`);
	
	// Clear previous content
	container.innerHTML = "";
	
	try {
		// Check if d3 is available
		if (typeof d3 === 'undefined') {
			console.error('D3.js library is not loaded. Please include the D3.js script in your HTML.');
			container.innerHTML = "<p class='error-message'>Error: D3.js library is not loaded. Cannot create visualization.</p>";
			return;
		}
		
		// Define color scales based on parameter
		let colorScale;
		
		if (parameter === "dryBulbTemp") {
			colorScale = d3.scaleSequential(d3.interpolateRdBu)
				.domain([40, -10]); // Reversed for temperature (blue cold, red hot)
		} else if (parameter === "relativeHumidity") {
			colorScale = d3.scaleSequential(d3.interpolateBlues)
				.domain([0, 100]);
		} else if (parameter === "windSpeed") {
			colorScale = d3.scaleSequential(d3.interpolateGreens)
				.domain([0, 20]);
		} else if (parameter.includes("Radiation")) {
			colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
				.domain([0, 1000]);
		} else {
			// Default color scale
			colorScale = d3.scaleSequential(d3.interpolateViridis)
				.domain([d3.min(data, d => d[parameter]), d3.max(data, d => d[parameter])]);
		}
		
		// Create legend for this parameter
		createLegend(parameter, colorScale);
		
		// Calculate appropriate cell size based on container width
		const totalDays = 365;
		const containerWidth = container.clientWidth;
		const availableWidth = Math.max(containerWidth, 900); // Ensure minimum width
		const cellSize = Math.max(2, Math.min(10, Math.floor(availableWidth / totalDays)));
		const cellHeight = cellSize;

		// Create SVG element with responsive dimensions
		container.style.overflowX = "auto"; // Make container scrollable
		
		const svg = d3
			.select(container)
			.append("svg")
			.attr("width", totalDays * cellSize + 50) // Fixed width for all days + margin for labels
			.attr("height", cellHeight * 24 + 30); // 24 hours + space for labels

		// Add month labels
		const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		// Calculate positions for month labels
		let dayOffset = 0;
		monthLabels.forEach((month, i) => {
			const monthWidth = daysPerMonth[i] * cellSize;
			svg.append("text")
				.attr("x", dayOffset * cellSize + monthWidth / 2)
				.attr("y", 15)
				.attr("text-anchor", "middle")
				.style("font-size", "12px")
				.text(month);
			dayOffset += daysPerMonth[i];
		});

		// Create cells for each hour of each day
		data.forEach(d => {
			// Calculate day of year (0-based)
			const dayOfYear = getDayOfYear(d.month, d.day) - 1;
			
			// Calculate x position based on day of year
			const x = dayOfYear * cellSize;
			
			// Calculate y position based on hour (0-23)
			const y = (d.hour - 1) * cellHeight + 20; // +20 for month labels
			
			// Get value for this cell
			const value = d[parameter];
			
			// Skip if value is undefined or null
			if (value === undefined || value === null) return;
			
			// Get unit for this parameter
			const unit = getParameterUnit(parameter);
			
			// Add cell rectangle
			svg.append("rect")
				.attr("x", x)
				.attr("y", y)
				.attr("width", cellSize)
				.attr("height", cellHeight)
				.attr("fill", colorScale(value))
				.attr("stroke", "#ccc")
				.attr("stroke-width", 0.5)
				.on("mouseover", function(event) {
					// Show tooltip
					showTooltip(event, `${d.month}/${d.day} ${d.hour}:00 - ${parameter}: ${value.toFixed(1)} ${unit}`);
				})
				.on("mouseout", hideTooltip);
		});

		// Add hour labels on the left side
		for (let hour = 0; hour < 24; hour++) {
			svg.append("text")
				.attr("x", -15)
				.attr("y", hour * cellHeight + cellHeight / 2 + 20) // +20 for month labels
				.attr("text-anchor", "end")
				.attr("dominant-baseline", "middle")
				.style("font-size", "10px")
				.text(hour + 1);
		}
	} catch (error) {
		console.error(`Error creating heatmap for ${parameter}:`, error);
		container.innerHTML = `<p class='error-message'>Error creating visualization: ${error.message}</p>`;
	}
}

// Helper function to get day of year
function getDayOfYear(month, day) {
	const daysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	let dayOfYear = day;
	for (let i = 1; i < month; i++) {
		dayOfYear += daysPerMonth[i];
	}
	return dayOfYear;
}

// Initialize tooltip element
function initTooltip() {
	// Create tooltip element if it doesn't exist
	if (!document.getElementById("heatmap-tooltip")) {
		const tooltip = document.createElement("div");
		tooltip.id = "heatmap-tooltip";
		tooltip.style.position = "absolute";
		tooltip.style.padding = "5px";
		tooltip.style.background = "rgba(0, 0, 0, 0.7)";
		tooltip.style.color = "white";
		tooltip.style.borderRadius = "3px";
		tooltip.style.pointerEvents = "none";
		tooltip.style.opacity = "0";
		tooltip.style.transition = "opacity 0.2s";
		tooltip.style.zIndex = "1000";
		document.body.appendChild(tooltip);
	}
}

// Show tooltip
function showTooltip(event, text) {
	const tooltip = document.getElementById("heatmap-tooltip");
	if (tooltip) {
		tooltip.innerHTML = text;
		tooltip.style.left = (event.pageX + 10) + "px";
		tooltip.style.top = (event.pageY + 10) + "px";
		tooltip.style.opacity = "1";
	}
}

// Hide tooltip
function hideTooltip() {
	const tooltip = document.getElementById("heatmap-tooltip");
	if (tooltip) {
		tooltip.style.opacity = "0";
	}
}

// Helper function to get parameter unit
function getParameterUnit(parameter) {
	switch (parameter) {
		case "dryBulbTemp":
			return "°C";
		case "relativeHumidity":
			return "%";
		case "atmosphericPressure":
			return "hPa";
		case "windSpeed":
			return "m/s";
		case "globalHorizontalRadiation":
		case "directNormalRadiation":
		case "diffuseHorizontalRadiation":
			return "Wh/m²";
		default:
			return "";
	}
}

// Add this function to create a legend
function createLegend(parameter, colorScale) {
	const legendId = `${parameter}-legend`;
	const legendContainer = document.getElementById(legendId);
	
	if (!legendContainer) {
		console.error(`Legend container for ${parameter} not found`);
		return;
	}
	
	// Clear previous content
	legendContainer.innerHTML = "";
	
	// Create gradient for legend
	const width = 200;
	const height = 20;
	
	const svg = d3.select(`#${legendId}`)
		.append("svg")
		.attr("width", width + 50)
		.attr("height", height + 30);
	
	// Create gradient
	const defs = svg.append("defs");
	const gradient = defs.append("linearGradient")
		.attr("id", `${parameter}-gradient`)
		.attr("x1", "0%")
		.attr("x2", "100%")
		.attr("y1", "0%")
		.attr("y2", "0%");
	
	// Add color stops based on the domain
	const domain = colorScale.domain();
	const min = domain[0];
	const max = domain[1];
	
	// Add color stops
	for (let i = 0; i <= 10; i++) {
		const offset = i * 10;
		const value = min + (i / 10) * (max - min);
		gradient.append("stop")
			.attr("offset", `${offset}%`)
			.attr("stop-color", colorScale(value));
	}
	
	// Add rectangle with gradient
	svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height)
		.style("fill", `url(#${parameter}-gradient)`);
	
	// Add axis
	const scale = d3.scaleLinear()
		.domain([min, max])
		.range([0, width]);
	
	const axis = d3.axisBottom(scale)
		.ticks(5);
	
	svg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.call(axis);
}

// Function to display location information
function displayLocationInfo(header) {
	const locationInfo = document.getElementById("locationInfo");
	if (!locationInfo) return;
	
	// Make the location info visible
	locationInfo.style.display = "block";
	
	// Update location details
	const locationName = document.getElementById("locationName");
	const locationLat = document.getElementById("locationLat");
	const locationLon = document.getElementById("locationLon");
	const locationElev = document.getElementById("locationElev");
	
	if (locationName) locationName.textContent = `Location: ${header.city || '--'}, ${header.country || '--'}`;
	if (locationLat) locationLat.textContent = `Latitude: ${header.latitude || '--'} degrees`;
	if (locationLon) locationLon.textContent = `Longitude: ${header.longitude || '--'} degrees`;
	if (locationElev) locationElev.textContent = `Elevation: ${header.elevation || '--'} m`;
	
	console.log("Location information displayed:", header);
}

// Add this at the end of your file to force hide the upload section if EPW data exists
window.addEventListener("load", function () {
	// Check both localStorage and sessionStorage
	if (
		localStorage.getItem("epwFileContent") ||
		sessionStorage.getItem("epwDataLoaded") === "true"
	) {
		const fileUploadSection = document.getElementById("SBlock1A");
		if (fileUploadSection) {
			fileUploadSection.style.display = "none";
			console.log("File upload section forcibly hidden on window load");
		}

		// Show success message
		const dataSourceInfo = document.getElementById("dataSourceInfo");
		if (dataSourceInfo) {
			dataSourceInfo.style.display = "block";
		}

		// Show heatmap container
		const heatmapContainer = document.getElementById("heatmapContainer");
		if (heatmapContainer) {
			heatmapContainer.style.display = "block";
			console.log("Heatmap container shown in window.load");
		}

		// Hide no data message
		const noDataMessage = document.getElementById("noDataMessage");
		if (noDataMessage) {
			noDataMessage.style.display = "none";
		}
	}
});

// Add this function to help debug localStorage content
function debugLocalStorage() {
    console.log("--- DEBUG: localStorage Content ---");
    console.log("epwData:", localStorage.getItem("epwData"));
    
    try {
        const rawData = localStorage.getItem("epwData");
        if (rawData) {
            console.log("epwData length:", rawData.length);
            console.log("First 100 chars:", rawData.substring(0, 100));
            
            // Try to parse it
            const parsed = JSON.parse(rawData);
            console.log("Successfully parsed. Type:", typeof parsed);
            console.log("Is array:", Array.isArray(parsed));
            if (Array.isArray(parsed)) {
                console.log("Array length:", parsed.length);
                if (parsed.length > 0) {
                    console.log("First item sample:", parsed[0]);
                }
            }
        } else {
            console.log("epwData is null or empty");
        }
    } catch (e) {
        console.error("Error parsing epwData:", e);
    }
    console.log("--- END DEBUG ---");
}

// Helper function to show error message
function showErrorMessage(message) {
	const heatmapContainer = document.getElementById("heatmapContainer");
	if (heatmapContainer) {
		heatmapContainer.innerHTML = `<div class="error-message">Error: ${message}</div>`;
		heatmapContainer.style.display = "block";
	}
	
	// Also update the data source info
	const dataSourceInfo = document.getElementById("dataSourceInfo");
	if (dataSourceInfo) {
		dataSourceInfo.innerHTML = `<p class="error">Error: ${message}. Please upload a new EPW file.</p>`;
		dataSourceInfo.style.display = "block";
	}
	
	// Show file upload section again
	const fileUploadSection = document.getElementById("SBlock1A");
	if (fileUploadSection) {
		fileUploadSection.style.display = "block";
	}
	
	// Show process button
	const processEpwBtn = document.getElementById("processEpwBtn");
	if (processEpwBtn) {
		processEpwBtn.style.display = "block";
		processEpwBtn.disabled = true;
	}
}

// Add this function to deeply inspect the data structure
function inspectDataStructure(data) {
    console.log("--- DETAILED DATA INSPECTION ---");
    
    if (!data) {
        console.error("Data is null or undefined");
        return false;
    }
    
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    
    if (typeof data === 'object' && !Array.isArray(data)) {
        console.log("Object keys:", Object.keys(data));
        
        if (data.data && Array.isArray(data.data)) {
            console.log("Data has data array with length:", data.data.length);
            
            if (data.data.length > 0) {
                console.log("First data item:", data.data[0]);
                console.log("First data item keys:", Object.keys(data.data[0]));
                
                // Check for required properties
                const requiredProps = ["dryBulbTemp", "relativeHumidity", "windSpeed", "globalHorizontalRadiation"];
                const missingProps = requiredProps.filter(prop => data.data[0][prop] === undefined);
                
                if (missingProps.length > 0) {
                    console.error("Missing required properties:", missingProps);
                    return false;
                }
                
                return true;
            }
        }
    } else if (Array.isArray(data)) {
        console.log("Array length:", data.length);
        
        if (data.length > 0) {
            console.log("First array item:", data[0]);
            console.log("First array item keys:", Object.keys(data[0]));
            
            // Check for required properties
            const requiredProps = ["dryBulbTemp", "relativeHumidity", "windSpeed", "globalHorizontalRadiation"];
            const missingProps = requiredProps.filter(prop => data[0][prop] === undefined);
            
            if (missingProps.length > 0) {
                console.error("Missing required properties:", missingProps);
                return false;
            }
            
            return true;
        }
    }
    
    console.log("--- END DETAILED INSPECTION ---");
    return false;
}

// Modify the DOMContentLoaded event listener to use this function
document.addEventListener("DOMContentLoaded", function () {
    console.log("EPW Heatmap page loaded, checking for stored EPW data...");

    // Initialize tooltip element
    initTooltip();

    // Get DOM elements
    const fileUploadSection = document.getElementById("SBlock1A");
    const processEpwBtn = document.getElementById("processEpwBtn");
    const dataSourceInfo = document.getElementById("dataSourceInfo");
    const noDataMessage = document.getElementById("noDataMessage");
    const heatmapContainer = document.getElementById("heatmapContainer");
    const epwFileInput = document.getElementById("epwFile");

    // Add event listeners
    if (epwFileInput) {
        epwFileInput.addEventListener("change", handleFileSelect);
    }

    if (processEpwBtn) {
        processEpwBtn.addEventListener("click", processEpwFile);
    }

    // Check for stored EPW data or session flag
    const storedEpwContent = localStorage.getItem("epwFileContent");
    const storedEpwData = localStorage.getItem("epwData");
    const dataLoadedFlag = sessionStorage.getItem("epwDataLoaded");

    console.log(
        "EPW content found in localStorage:",
        storedEpwContent ? "Yes, length: " + storedEpwContent.length : "No"
    );
    console.log(
        "EPW data found in localStorage:",
        storedEpwData ? "Yes" : "No"
    );
    console.log(
        "EPW data loaded flag in sessionStorage:",
        dataLoadedFlag || "No"
    );

    // Debug localStorage content
    debugLocalStorage();

    // If we have data in localStorage OR the flag is set (meaning data was already processed)
    if (storedEpwContent || storedEpwData || dataLoadedFlag === "true") {
        console.log("EPW data available, hiding file upload section");
        
        // Hide the file upload section
        if (fileUploadSection) {
            fileUploadSection.style.display = "none";
        }
        
        // Hide the process button
        if (processEpwBtn) {
            processEpwBtn.style.display = "none";
        }
        
        // Show success message
        if (dataSourceInfo) {
            dataSourceInfo.style.display = "block";
        }
        
        // Hide no data message
        if (noDataMessage) {
            noDataMessage.style.display = "none";
        }
        
        // Show heatmap container
        if (heatmapContainer) {
            heatmapContainer.style.display = "block";
            console.log("Heatmap container shown in DOMContentLoaded");
        }
        
        // Parse data if available
        let dataProcessed = false;
        
        if (storedEpwContent) {
            console.log("Calling parseEpwFile with stored content");
            parseEpwFile(storedEpwContent);
            dataProcessed = true;
        } else if (storedEpwData) {
            console.log("Using stored EPW data from epw-import page");
            try {
                const parsedData = JSON.parse(storedEpwData);
                console.log("Parsed data structure:", parsedData);
                
                // Use our detailed inspection function
                const isValidData = inspectDataStructure(parsedData);
                
                if (isValidData) {
                    // If data is in the expected format (object with data array)
                    if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
                        console.log(`Successfully parsed ${parsedData.data.length} data points from localStorage`);
                        
                        // Display location info if available
                        if (parsedData.header) {
                            displayLocationInfo(parsedData.header);
                        }
                        
                        // Use the data array for heatmaps
                        epwData = parsedData.data;
                        generateAllHeatmaps(epwData);
                        dataProcessed = true;
                    } 
                    // If data is directly an array (old format)
                    else if (Array.isArray(parsedData)) {
                        epwData = parsedData;
                        console.log(`Successfully parsed ${epwData.length} data points from localStorage (array format)`);
                        generateAllHeatmaps(epwData);
                        dataProcessed = true;
                    } 
                    else {
                        throw new Error("The stored weather data is in an invalid format");
                    }
                } else {
                    throw new Error("The weather data is missing required properties");
                }
            } catch (error) {
                console.error("Error parsing EPW data from localStorage:", error);
                
                // Show error message
                if (dataSourceInfo) {
                    dataSourceInfo.innerHTML = `<p class="error">Error: ${error.message}. Please upload a new EPW file.</p>`;
                }
                
                // Show file upload section again
                if (fileUploadSection) {
                    fileUploadSection.style.display = "block";
                }
                
                // Show process button
                if (processEpwBtn) {
                    processEpwBtn.style.display = "block";
                    processEpwBtn.disabled = true;
                }
                
                // Clear invalid data
                localStorage.removeItem("epwData");
                sessionStorage.removeItem("epwDataLoaded");
            }
        }
        
        // If no data was successfully processed but the flag was set
        if (!dataProcessed && dataLoadedFlag === "true") {
            console.error("Data loaded flag was set but no valid data was found");
            
            // Show error message
            if (dataSourceInfo) {
                dataSourceInfo.innerHTML = `<p class="error">Error: No valid weather data found. Please upload a new EPW file.</p>`;
            }
            
            // Show file upload section again
            if (fileUploadSection) {
                fileUploadSection.style.display = "block";
            }
            
            // Show process button
            if (processEpwBtn) {
                processEpwBtn.style.display = "block";
                processEpwBtn.disabled = true;
            }
            
            // Clear invalid flag
            sessionStorage.removeItem("epwDataLoaded");
        }
    }
});

// Function to calculate statistics for a parameter
function calculateStats(data, parameter) {
    // Filter out undefined or null values
    const validValues = data
        .map(d => d[parameter])
        .filter(value => value !== undefined && value !== null && !isNaN(value));
    
    if (validValues.length === 0) {
        return { min: '-', max: '-', avg: '-' };
    }
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / validValues.length;
    
    return {
        min: min.toFixed(1),
        max: max.toFixed(1),
        avg: avg.toFixed(1)
    };
}

// Function to update statistics display
function updateStats(parameter, stats) {
    const minElement = document.getElementById(`${parameter}-stat-min`);
    const maxElement = document.getElementById(`${parameter}-stat-max`);
    const avgElement = document.getElementById(`${parameter}-stat-avg`);
    
    if (minElement) minElement.textContent = stats.min;
    if (maxElement) maxElement.textContent = stats.max;
    if (avgElement) avgElement.textContent = stats.avg;
}

// Add units to the stats display
function getParameterUnit(parameter) {
    switch (parameter) {
        case 'dryBulbTemp':
            return '°C';
        case 'relativeHumidity':
            return '%';
        case 'windSpeed':
            return 'm/s';
        case 'globalHorizontalRadiation':
        case 'directNormalRadiation':
        case 'diffuseHorizontalRadiation':
            return 'Wh/m²';
        default:
            return '';
    }
}

// Update the updateStats function to include units
function updateStats(parameter, stats) {
    const unit = getParameterUnit(parameter);
    const minElement = document.getElementById(`${parameter}-stat-min`);
    const maxElement = document.getElementById(`${parameter}-stat-max`);
    const avgElement = document.getElementById(`${parameter}-stat-avg`);
    
    if (minElement) minElement.textContent = stats.min !== '-' ? `${stats.min} ${unit}` : '-';
    if (maxElement) maxElement.textContent = stats.max !== '-' ? `${stats.max} ${unit}` : '-';
    if (avgElement) avgElement.textContent = stats.avg !== '-' ? `${stats.avg} ${unit}` : '-';
}








