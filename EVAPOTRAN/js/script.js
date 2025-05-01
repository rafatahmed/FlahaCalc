/** @format */

/* 
###########################################################################################################
##                                   Credits                                                             ##
###########################################################################################################
##                                                                                                       ##
## Evapotranspiration Calculation using Penman-Monteith Method                                           ##
## Author: Rafat Al Khashan                                                                              ##
## Email: rafat.khashan82@gmail.com                                                                      ##
## Corp.: Flaha Agri Tech                                                                                ##
## Corp.: info@flaha.org                                                                                 ##
## Date: August 8, 2023                                                                                  ##
##                                                                                                       ##
###########################################################################################################

### @Todo
###		: Well lots, I'm still trying to completely understand this (and I don't).
###     : A lot of this data really needs to be in a db schem
###     : More error handling (I'm patching along the way and it shows)
*/

// Enhanced form validation
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with a form
    const form = document.querySelector('form');
    if (!form) return;
    
    // Get all form inputs that need validation
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"], select');
    
    // Add validation event listeners to each input
    inputs.forEach(input => {
        // Set custom validation messages
        if (input.hasAttribute('data-validate')) {
            input.addEventListener('invalid', function(event) {
                event.target.setCustomValidity(input.getAttribute('data-validate'));
            });
            input.addEventListener('input', function(event) {
                event.target.setCustomValidity('');
            });
        }
    });
    
    // Add calculate button event listener if it exists
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateET);
    }
});

// Add this function to debug localStorage on page load
function debugLocalStorage() {
    console.log("=== DEBUG: localStorage Content on Calculator Page ===");
    try {
        const etoCalcData = localStorage.getItem("etoCalcData");
        console.log("etoCalcData raw:", etoCalcData);
        
        if (etoCalcData) {
            const parsed = JSON.parse(etoCalcData);
            console.log("etoCalcData parsed:", parsed);
            
            // Check each required field
            const requiredFields = [
                'temperature', 'windSpeed', 'relativeHumidity', 
                'latitude', 'dayNumber', 'sunshineDuration'
            ];
            
            console.log("Field validation:");
            for (const field of requiredFields) {
                const value = parsed[field];
                console.log(`${field}: ${value} (${typeof value}) - Valid: ${value !== undefined && value !== null && !isNaN(parseFloat(value))}`);
            }
        } else {
            console.log("etoCalcData is null or empty");
        }
    } catch (e) {
        console.error("Error in debugLocalStorage:", e);
    }
    console.log("=== END DEBUG ===");
}

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Calculator page loaded");
    
    // Check if we're coming from the weather page
    const fromWeatherPage = localStorage.getItem("fromWeatherPage");
    
    if (fromWeatherPage === "true") {
        console.log("Loading data from weather page");
        
        // Get individual values from localStorage
        const temperature = localStorage.getItem("calc_temperature");
        const windSpeed = localStorage.getItem("calc_windSpeed");
        const relativeHumidity = localStorage.getItem("calc_relativeHumidity");
        const atmosphericPressure = localStorage.getItem("calc_atmosphericPressure");
        const elevation = localStorage.getItem("calc_elevation");
        const latitude = localStorage.getItem("calc_latitude");
        const dayNumber = localStorage.getItem("calc_dayNumber");
        const sunshineDuration = localStorage.getItem("calc_sunshineDuration");
        const location = localStorage.getItem("calc_location");
        
        // Fill in the form fields
        if (temperature) document.getElementById('temperature').value = temperature;
        if (windSpeed) document.getElementById('windSpeed').value = windSpeed;
        if (relativeHumidity) document.getElementById('relativeHumidity').value = relativeHumidity;
        if (atmosphericPressure) document.getElementById('atmosphericPressure').value = atmosphericPressure;
        if (elevation) document.getElementById('elevation').value = elevation;
        if (latitude) document.getElementById('latitude').value = latitude;
        if (dayNumber) document.getElementById('dayNumber').value = dayNumber;
        if (sunshineDuration) document.getElementById('sunshineDuration').value = sunshineDuration;
        if (location) document.getElementById('location').value = location;
        
        // Clear the flag
        localStorage.removeItem("fromWeatherPage");
    }
    // Also try the original method as a fallback
    else {
        // Check if we have data from the weather page
        const etoCalcData = localStorage.getItem("etoCalcData");
        if (etoCalcData && etoCalcData !== "{}") {
            try {
                console.log("Found calculator data in localStorage");
                const data = JSON.parse(etoCalcData);
                
                // Fill in the form fields
                if (data.temperature) document.getElementById('temperature').value = data.temperature;
                if (data.windSpeed) document.getElementById('windSpeed').value = data.windSpeed;
                if (data.relativeHumidity) document.getElementById('relativeHumidity').value = data.relativeHumidity;
                if (data.atmosphericPressure) document.getElementById('atmosphericPressure').value = data.atmosphericPressure;
                if (data.elevation) document.getElementById('elevation').value = data.elevation;
                if (data.latitude) document.getElementById('latitude').value = data.latitude;
                if (data.dayNumber) document.getElementById('dayNumber').value = data.dayNumber;
                if (data.sunshineDuration) document.getElementById('sunshineDuration').value = data.sunshineDuration;
                if (data.location) document.getElementById('location').value = data.location;
            } catch (error) {
                console.error("Error loading calculator data:", error);
            }
        }
    }
    
    // Test server connection
    const serverAvailable = await testServerConnection();
    if (!serverAvailable) {
        // Show warning about server connection
        const warningEl = document.createElement("div");
        warningEl.className = "server-warning";
        warningEl.innerHTML = `
            <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at http://localhost:3000.</p>
            <p>Check the server setup instructions in the README file.</p>
        `;
        document.querySelector(".container").prepend(warningEl);
    }
    
    // Rest of your initialization code...
});

// Add Font Awesome for icons in the head section
document.addEventListener('DOMContentLoaded', function() {
    // Add Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Set up modal functionality
    const modal = document.getElementById('calcSheetModal');
    const showCalcSheetBtn = document.getElementById('showCalcSheet');
    const printCalcSheetBtn = document.getElementById('printCalcSheet');
    const printFromModalBtn = document.getElementById('printFromModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeButton = document.querySelector('.close-button');
    
    if (showCalcSheetBtn) {
        showCalcSheetBtn.addEventListener('click', function() {
            generateCalcSheet();
            modal.style.display = 'block';
        });
    }
    
    if (printCalcSheetBtn) {
        printCalcSheetBtn.addEventListener('click', function() {
            generateCalcSheet();
            printCalcSheet();
        });
    }
    
    if (printFromModalBtn) {
        printFromModalBtn.addEventListener('click', printCalcSheet);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Helper functions for calculation sheet - DEFINE THESE FIRST
function inverseRelativeDistanceEarthSun(dayOfYear) {
    return 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
}

function solarDeclination(dayOfYear) {
    return 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
}

function sunsetHourAngle(latitude, solarDeclination) {
    const latRad = (latitude * Math.PI) / 180;
    return Math.acos(-Math.tan(latRad) * Math.tan(solarDeclination));
}

function extraterrestrialRadiation(dr, ws, latitude, delta) {
    const latRad = (latitude * Math.PI) / 180;
    return (24 * 60 / Math.PI) * 0.082 * dr * (
        ws * Math.sin(latRad) * Math.sin(delta) + 
        Math.cos(latRad) * Math.cos(delta) * Math.sin(ws)
    );
}

function dayLength(ws) {
    return (24 / Math.PI) * ws;
}

function solarRadiation(Ra, n, N) {
    return Ra * (0.25 + 0.5 * (n / N));
}

function clearSkySolarRadiation(Ra, elevation) {
    return (0.75 + 2e-5 * elevation) * Ra;
}

function netShortwaveRadiation(Rs, albedo) {
    return (1 - albedo) * Rs;
}

function saturationVaporPressure(temp) {
    return 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
}

function slopeVaporPressureCurve(temp) {
    return (4098 * 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3))) / Math.pow(temp + 237.3, 2);
}

function psychrometricConstant(pressure) {
    return 0.000665 * pressure;
}

function calculateAtmosphericPressure(elevation) {
    return 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
}

function netLongwaveRadiation(tmin, tmax, ea, Rs, Rso) {
    const tminK = tmin + 273.16;
    const tmaxK = tmax + 273.16;
    const stefan = 4.903e-9; // Stefan-Boltzmann constant
    
    return stefan * 0.5 * (Math.pow(tminK, 4) + Math.pow(tmaxK, 4)) * 
           (0.34 - 0.14 * Math.sqrt(ea)) * 
           (1.35 * (Rs / Rso) - 0.35);
}

// Function to generate calculation sheet
function generateCalcSheet() {
    const calcSheetContent = document.getElementById('calcSheetContent');
    if (!calcSheetContent) {
        console.error('Calculation sheet content element not found');
        return;
    }
    
    // Check if calculation has been performed
    const etoResult = document.getElementById("result").textContent;
    if (etoResult === "Reference ET₀: -- mm/day") {
        calcSheetContent.innerHTML = `
            <div class="calc-sheet">
                <div class="calc-sheet-header">
                    <h2>No Calculation Available</h2>
                    <p>Please calculate ETo first by entering all required data and clicking the "Calculate ETo" button.</p>
                </div>
            </div>
        `;
        return;
    }
    
    try {
        // Get input values - retrieve them from the form rather than recalculating
        const temp = parseFloat(document.getElementById("temperature").value);
        const windSpeed = parseFloat(document.getElementById("windSpeed").value);
        const rh = parseFloat(document.getElementById("relativeHumidity").value);
        const elevation = parseFloat(document.getElementById("elevation").value);
        const pressure = parseFloat(document.getElementById("atmosphericPressure").value) || 
                        (101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26));
        const lat = parseFloat(document.getElementById("latitude").value);
        const dayOfYear = parseFloat(document.getElementById("dayNumber").value);
        const sunshineDuration = parseFloat(document.getElementById("sunshineDuration").value);
        
        // Use a secure calculation module that obfuscates the actual calculations
        const calculationResults = secureCalculate(temp, windSpeed, rh, elevation, pressure, lat, dayOfYear, sunshineDuration);
        
        // Generate HTML content using the results from the secure calculation
        calcSheetContent.innerHTML = `
            <div class="calc-sheet">
                <div class="calc-sheet-header">
                    <h2>Reference Evapotranspiration (ETo) Calculation</h2>
                    <p>FAO Penman-Monteith Method</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p><small>© ${new Date().getFullYear()} Flaha Agri Tech. All rights reserved.</small></p>
                </div>
                
                <div class="calc-sheet-section">
                    <h3>Input Parameters</h3>
                    <div class="calc-param">
                        <div class="param-name">Mean Temperature</div>
                        <div class="param-formula">T</div>
                        <div class="param-value">${temp.toFixed(2)}</div>
                        <div class="param-unit">°C</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Wind Speed</div>
                        <div class="param-formula">u₂</div>
                        <div class="param-value">${windSpeed.toFixed(2)}</div>
                        <div class="param-unit">m/s</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Relative Humidity</div>
                        <div class="param-formula">RH</div>
                        <div class="param-value">${rh.toFixed(0)}</div>
                        <div class="param-unit">%</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Elevation</div>
                        <div class="param-formula">z</div>
                        <div class="param-value">${elevation.toFixed(0)}</div>
                        <div class="param-unit">m</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Latitude</div>
                        <div class="param-formula">φ</div>
                        <div class="param-value">${lat.toFixed(2)}</div>
                        <div class="param-unit">°</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Day of Year</div>
                        <div class="param-formula">J</div>
                        <div class="param-value">${dayOfYear}</div>
                        <div class="param-unit">day</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Sunshine Duration</div>
                        <div class="param-formula">n</div>
                        <div class="param-value">${sunshineDuration.toFixed(1)}</div>
                        <div class="param-unit">hours</div>
                    </div>
                </div>
                
                <div class="calc-sheet-section">
                    <h3>Radiation Parameters</h3>
                    <div class="calc-param">
                        <div class="param-name">Inverse Relative Distance</div>
                        <div class="param-formula">dr</div>
                        <div class="param-value">${calculationResults.dr.toFixed(5)}</div>
                        <div class="param-unit">-</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Solar Declination</div>
                        <div class="param-formula">δ</div>
                        <div class="param-value">${calculationResults.delta.toFixed(5)}</div>
                        <div class="param-unit">radians</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Sunset Hour Angle</div>
                        <div class="param-formula">ωs</div>
                        <div class="param-value">${calculationResults.ws.toFixed(5)}</div>
                        <div class="param-unit">radians</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Extraterrestrial Radiation</div>
                        <div class="param-formula">Ra</div>
                        <div class="param-value">${calculationResults.Ra.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Daylight Hours</div>
                        <div class="param-formula">N</div>
                        <div class="param-value">${calculationResults.N.toFixed(2)}</div>
                        <div class="param-unit">hours</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Solar Radiation</div>
                        <div class="param-formula">Rs</div>
                        <div class="param-value">${calculationResults.Rs.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Clear Sky Solar Radiation</div>
                        <div class="param-formula">Rso</div>
                        <div class="param-value">${calculationResults.Rso.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                </div>
                
                <div class="calc-sheet-section">
                    <h3>Evapotranspiration Calculation</h3>
                    <div class="calc-param">
                        <div class="param-name">Net Shortwave Radiation</div>
                        <div class="param-formula">Rns</div>
                        <div class="param-value">${calculationResults.Rns.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Net Longwave Radiation</div>
                        <div class="param-formula">Rnl</div>
                        <div class="param-value">${calculationResults.Rnl.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Net Radiation</div>
                        <div class="param-formula">Rn</div>
                        <div class="param-value">${calculationResults.Rn.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Soil Heat Flux</div>
                        <div class="param-formula">G</div>
                        <div class="param-value">${calculationResults.G.toFixed(2)}</div>
                        <div class="param-unit">MJ m⁻² d⁻¹</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Saturation Vapor Pressure</div>
                        <div class="param-formula">es</div>
                        <div class="param-value">${calculationResults.es.toFixed(3)}</div>
                        <div class="param-unit">kPa</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Actual Vapor Pressure</div>
                        <div class="param-formula">ea</div>
                        <div class="param-value">${calculationResults.ea.toFixed(3)}</div>
                        <div class="param-unit">kPa</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Slope of Vapor Pressure Curve</div>
                        <div class="param-formula">Δ</div>
                        <div class="param-value">${calculationResults.deltaVPC.toFixed(4)}</div>
                        <div class="param-unit">kPa/°C</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Psychrometric Constant</div>
                        <div class="param-formula">γ</div>
                        <div class="param-value">${calculationResults.gamma.toFixed(4)}</div>
                        <div class="param-unit">kPa/°C</div>
                    </div>
                    <div class="calc-param">
                        <div class="param-name">Reference ET₀</div>
                        <div class="param-formula">ET₀</div>
                        <div class="param-value">${calculationResults.ET0.toFixed(2)}</div>
                        <div class="param-unit">mm/day</div>
                    </div>
                </div>
                
                <div class="calc-sheet-section">
                    <h3>Final Result</h3>
                    <div class="calc-param result-highlight">
                        <div class="param-name">Reference Evapotranspiration</div>
                        <div class="param-formula">ET₀</div>
                        <div class="param-value">${calculationResults.ET0.toFixed(2)}</div>
                        <div class="param-unit">mm/day</div>
                    </div>
                </div>
                
                <div class="calc-sheet-footer">
                    <p>This calculation sheet is generated by Flaha Calc - ETo Calculator</p>
                    <p>Calculation based on FAO Penman-Monteith method as described in FAO Irrigation and Drainage Paper No. 56</p>
                    <p>© ${new Date().getFullYear()} Flaha Agri Tech. All rights reserved.</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error generating calculation sheet:', error);
        calcSheetContent.innerHTML = `
            <div class="calc-sheet">
                <div class="calc-sheet-header">
                    <h2>Error Generating Calculation Sheet</h2>
                    <p>An error occurred while generating the calculation sheet: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

function calculateETB() {
	return;
}

function calculateInverseRelativeDistance(dayNumber) {
	return dayNumber < 1 || dayNumber > 366
		? "nd"
		: 1 + 0.033 * Math.cos((2 * Math.PI * dayNumber) / 365);
}

function calculateSolarDeclination(dayNumber) {
	return dayNumber < 1 || dayNumber > 366
		? "nd"
		: 0.409 * Math.sin((2 * Math.PI * dayNumber) / 365 - 1.39);
}

function calculateSunsetHourAngle(latitude, solarDeclination) {
	if (
		dayNumber < 1 ||
		dayNumber > 366 ||
		isNaN(latitude) ||
		Math.abs(latitude) > 90
	) {
		return "nd";
	}
	return Math.acos(
		-Math.tan((latitude * Math.PI) / 180) * Math.tan(solarDeclination)
	);
}

function calculateExtraterrestrialRadiation(
	inverseRelativeDistance,
	solarDeclination,
	sunsetHourAngle
) {
	if (
		inverseRelativeDistance === "nd" ||
		solarDeclination === "nd" ||
		sunsetHourAngle === "nd"
	) {
		return "nd";
	}
	return (
		((24 * 60 * 0.082) / Math.PI) *
		inverseRelativeDistance *
		(sunsetHourAngle *
			Math.sin((latitude() * Math.PI) / 180) *
			Math.sin(solarDeclination) +
			Math.cos((latitude() * Math.PI) / 180) *
				Math.cos(solarDeclination) *
				Math.sin(sunsetHourAngle))
	);
}

function calculateSaturationVaporPressure(
	saturationVaporPressureAtTmin,
	saturationVaporPressureAtTmax
) {
	return saturationVaporPressureAtTmin >= saturationVaporPressureAtTmax
		? "nd"
		: (saturationVaporPressureAtTmin + saturationVaporPressureAtTmax) / 2;
}

function calculateSaturationVaporPressureAtTmin(minTemperature) {
	if (isNaN(minTemperature)) {
		return "nd";
	}
	return 0.6108 * Math.exp((17.27 * minTemperature) / (237.3 + minTemperature));
}

function calculateSaturationVaporPressureAtTmax(maxTemperature) {
	if (isNaN(maxTemperature)) {
		return "nd";
	}
	return 0.6108 * Math.exp((17.27 * maxTemperature) / (237.3 + maxTemperature));
}

function calculateActualVaporPressure1(dewPointTemperature) {
	if (isNaN(dewPointTemperature)) {
		return "nd";
	}
	return (
		0.6108 *
		Math.exp((17.27 * dewPointTemperature) / (237.3 + dewPointTemperature))
	);
}

function calculateActualVaporPressure2(
	minRelativeHumidity,
	maxRelativeHumidity,
	saturationVaporPressureAtTmin,
	saturationVaporPressureAtTmax
) {
	if (
		isNaN(minRelativeHumidity) ||
		isNaN(maxRelativeHumidity) ||
		minRelativeHumidity >= maxRelativeHumidity ||
		minRelativeHumidity < 1 ||
		maxRelativeHumidity > 100 ||
		saturationVaporPressureAtTmin === "nd" ||
		saturationVaporPressureAtTmax === "nd"
	) {
		return "nd";
	}
	return (
		0.005 *
		(saturationVaporPressureAtTmin * maxRelativeHumidity +
			saturationVaporPressureAtTmax * minRelativeHumidity)
	);
}
//actual vapor pressure 3
function calculateActualVaporPressure3(
	meanRelativeHumidity,
	minTemperature,
	maxTemperature
) {
	if (
		isNaN(meanRelativeHumidity) ||
		meanRelativeHumidity < 0 ||
		meanRelativeHumidity > 100 ||
		isNaN(minTemperature) ||
		isNaN(maxTemperature)
	) {
		return "nd";
	}
	return (
		(meanRelativeHumidity *
			0.6108 *
			Math.exp(
				(17.27 * 0.5 * (minTemperature + maxTemperature)) /
					(237.3 + 0.5 * (minTemperature + maxTemperature))
			)) /
		100
	);
}
//Approximated dew point temperature
function calculateApproximatedDewPointTemperature(
	minTemperature,
	maxTemperature
) {
	if (isNaN(minTemperature) || isNaN(maxTemperature)) {
		return "nd";
	}
	return (
		0.52 * minTemperature +
		0.6 * maxTemperature -
		0.009 * maxTemperature * maxTemperature -
		2
	);
}
//actual vapor pressure 4
function calculateActualVaporPressure4(dewPointTemperature) {
	if (dewPointTemperature === "nd") {
		return "nd";
	}
	return (
		0.6108 *
		Math.exp((17.27 * dewPointTemperature) / (237.3 + dewPointTemperature))
	);
}
//Actual vapor pressure
function calculateActualVaporPressure(
	actualVaporPressure1,
	actualVaporPressure2,
	actualVaporPressure3,
	actualVaporPressure4
) {
	return actualVaporPressure1 !== "nd"
		? actualVaporPressure1
		: actualVaporPressure2 !== "nd"
		? actualVaporPressure2
		: actualVaporPressure3 !== "nd"
		? actualVaporPressure3
		: actualVaporPressure4;
}
//saturation vapor pressure deficit
function calculateSaturationVaporPressureDeficit(
	saturationVaporPressure,
	actualVaporPressure
) {
	if (saturationVaporPressure === "nd" || actualVaporPressure === "nd") {
		return "nd";
	}
	return saturationVaporPressure - actualVaporPressure;
}
//slope vapor pressure curve
function calculateSlopeVaporPressureCurve(minTemperature, maxTemperature) {
	if (
		isNaN(minTemperature) ||
		isNaN(maxTemperature) ||
		minTemperature >= maxTemperature
	) {
		return "nd";
	}
	return (
		(4098 *
			0.6108 *
			Math.exp(
				(17.27 * 0.5 * (minTemperature + maxTemperature)) /
					(237.3 + 0.5 * (minTemperature + maxTemperature))
			)) /
		Math.pow(0.5 * (minTemperature + maxTemperature) + 237.3, 2)
	);
}

//Psychrometric Constant
function calculatePsychrometricConstant(elevation) {
	if (isNaN(elevation)) {
		return "nd";
	}
	return 0.000665 * 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
}

function latitude() {
	const latitude = parseFloat(document.getElementById("latitude").value);
	return isNaN(latitude) ? "nd" : latitude;
}

function elevation() {
	const elevation = parseFloat(document.getElementById("elevation").value);
	return isNaN(elevation) ? "nd" : elevation;
}

function calculateWindSpeedAt2m() {
	const windSpeed = parseFloat(document.getElementById("windSpeed").value);
	return isNaN(windSpeed) || windSpeed < 0 ? "nd" : windSpeed;
}
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//day lenth as per Excel also Actual Duration of Sunshine
function calculateactualDurationOfSunshine(sunsetHourAngle) {
	if (sunsetHourAngle === "nd") {
		return "nd";
	}
	return (sunsetHourAngle * 24) / Math.PI;
}

function calculatesolarRadiation(extraterrestrialRadiation, sunshineDuration) {
	if (extraterrestrialRadiation === "nd" || sunshineDuration === "nd") {
		return "nd";
	}
	return (
		extraterrestrialRadiation *
		(0.25 + (0.5 * sunshineDuration) / sunshineDuration)
	);
}

// Clear-sky Solar Radiation
function calculateclearSkySolarRadiation(extraterrestrialRadiation, elevation) {
	if (extraterrestrialRadiation === "nd") {
		return "nd";
	}
	return extraterrestrialRadiation * (0.75 + 0.00002 * elevation);
}

// Net Shortwave Radiation
function calculatenetShortwaveRadiation(solarRadiation) {
	if (solarRadiation === "nd") {
		return "nd";
	}
	return 0.77 * solarRadiation;
}

// Net Longwave Radiation
function calculatenetLongwaveRadiation(
	extraterrestrialRadiation,
	saturationVapourPressureDeficit,
	solarRadiation,
	clearSkySolarRadiation,
	minTemperature,
	maxTemperature
) {
	if (
		extraterrestrialRadiation === "nd" ||
		saturationVapourPressureDeficit === "nd" ||
		solarRadiation === "nd"
	) {
		return "nd";
	}

	const netLongwaveRadiation =
		4.903 *
		Math.pow(10, -9) *
		0.5 *
		(Math.pow(minTemperature + 273.16, 4) +
			Math.pow(maxTemperature + 273.16, 4)) *
		(0.34 - 0.14 * Math.sqrt(saturationVapourPressureDeficit)) *
		((1.35 * solarRadiation) / clearSkySolarRadiation - 0.35);

	return netLongwaveRadiation;
}

// Net Radiation
function calculatenetRadiation(netShortwaveRadiation, netLongwaveRadiation) {
	if (netShortwaveRadiation === "nd" || netLongwaveRadiation === "nd") {
		return "nd";
	}

	return netShortwaveRadiation - netLongwaveRadiation;
}

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function calculateMinTemperature() {
	const minTemperature = parseFloat(
		document.getElementById("minTemperature").value
	);
	return isNaN(minTemperature) ? "nd" : minTemperature;
}

function dayNumber() {
	const dayNumber = parseFloat(document.getElementById("dayNumber").value);
	return isNaN(dayNumber) ? "nd" : dayNumber;
}

function calculateMaxTemperature() {
	const maxTemperature = parseFloat(
		document.getElementById("maxTemperature").value
	);
	return isNaN(maxTemperature) ? "nd" : maxTemperature;
}

function calculateMeanRelativeHumidity() {
	const meanRelativeHumidity = parseFloat(
		document.getElementById("meanRelativeHumidity").value
	);
	return isNaN(meanRelativeHumidity) ||
		meanRelativeHumidity < 0 ||
		meanRelativeHumidity > 100
		? "nd"
		: meanRelativeHumidity;
}

function calculateMinRelativeHumidity() {
	const minRelativeHumidity = parseFloat(
		document.getElementById("minRelativeHumidity").value
	);
	return isNaN(minRelativeHumidity) ||
		minRelativeHumidity < 0 ||
		minRelativeHumidity > 100
		? "nd"
		: minRelativeHumidity;
}

function calculateMaxRelativeHumidity() {
	const maxRelativeHumidity = parseFloat(
		document.getElementById("maxRelativeHumidity").value
	);
	return isNaN(maxRelativeHumidity) ||
		maxRelativeHumidity < 0 ||
		maxRelativeHumidity > 100
		? "nd"
		: maxRelativeHumidity;
}

function calculateDewPointTemperature() {
	const dewPointTemperature = parseFloat(
		document.getElementById("dewPointTemperature").value
	);
	return isNaN(dewPointTemperature) ? "nd" : dewPointTemperature;
}

function calculateReferenceET(
	saturationVaporPressure,
	slopeVaporPressureCurve,
	psychrometricConstant,
	saturationVaporPressureDeficit,
	windSpeedAt2m,
	netRadiation
) {
	if (
		saturationVaporPressure === "nd" ||
		slopeVaporPressureCurve === "nd" ||
		psychrometricConstant === "nd" ||
		netRadiation === "nd" ||
		windSpeedAt2m === "nd"
	) {
		return "nd";
	}
	const meanTemperature =
		(calculateMinTemperature() + calculateMaxTemperature()) / 2;
	return (
		(0.408 * slopeVaporPressureCurve * netRadiation +
			(psychrometricConstant *
				900 *
				windSpeedAt2m *
				saturationVaporPressureDeficit) /
				(0.5 * (calculateMinTemperature() + calculateMaxTemperature()) + 273)) /
		(slopeVaporPressureCurve +
			psychrometricConstant * (1 + 0.34 * windSpeedAt2m))
	);
}

//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Helper functions
function saturationVaporPressure(tempC) {
	return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

function slopeVaporPressureCurve(tempC) {
	const svp = saturationVaporPressure(tempC);
	return (4098 * svp) / Math.pow(tempC + 237.3, 2);
}

function psychrometricConstant(pressureKpa) {
	return 0.000665 * pressureKpa;
}

function calculateAtmosphericPressure(elevationM = 0) {
	return 101.3 * Math.pow((293.0 - 0.0065 * elevationM) / 293.0, 5.26);
}

function extraterrestrialRadiation(latRad, doy) {
	const dr = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * doy);
	const delta = 0.409 * Math.sin(((2 * Math.PI) / 365) * doy - 1.39);
	const omegaS = Math.acos(-Math.tan(latRad) * Math.tan(delta));
	const gsc = 0.082; // MJ m⁻² min⁻¹

	return (
		((24 * 60) / Math.PI) *
		gsc *
		dr *
		(omegaS * Math.sin(latRad) * Math.sin(delta) +
			Math.cos(latRad) * Math.cos(delta) * Math.sin(omegaS))
	);
}

function clearSkyRadiation(ra, elevationM) {
	return (0.75 + 2e-5 * elevationM) * ra;
}

function netShortwaveRadiation(rs, albedo = 0.23) {
	return (1 - albedo) * rs;
}

function netLongwaveRadiation(tMaxC, tMinC, ea, rs, rso) {
	// Using mean temperature for simplicity
	const tMeanK = (tMaxC + tMinC) / 2 + 273.16;
	const stefanBoltzmann = 4.903e-9; // MJ K⁻⁴ m⁻² day⁻¹

	// Simplified version using mean temperature
	return (
		stefanBoltzmann *
		Math.pow(tMeanK, 4) *
		(0.34 - 0.14 * Math.sqrt(ea)) *
		(1.35 * (rs / rso) - 0.35)
	);
}

// Function to calculate ET0
async function calculateET() {
    // Get input values
    const temperature = parseFloat(document.getElementById('temperature').value);
    const windSpeed = parseFloat(document.getElementById('windSpeed').value);
    const relativeHumidity = parseFloat(document.getElementById('relativeHumidity').value);
    const atmosphericPressure = parseFloat(document.getElementById('atmosphericPressure').value) || null;
    const elevation = parseFloat(document.getElementById('elevation').value);
    const latitude = parseFloat(document.getElementById('latitude').value);
    const dayNumber = parseInt(document.getElementById('dayNumber').value);
    const sunshineDuration = parseFloat(document.getElementById('sunshineDuration').value);

    // Validate inputs
    if (isNaN(temperature) || isNaN(windSpeed) || isNaN(relativeHumidity) || 
        isNaN(elevation) || isNaN(latitude) || isNaN(dayNumber) || isNaN(sunshineDuration)) {
        alert('Please fill in all required fields with valid numbers.');
        return;
    }

    // Prepare data for server
    const data = {
        temperature,
        windSpeed,
        relativeHumidity,
        elevation,
        pressure: atmosphericPressure,
        latitude,
        dayOfYear: dayNumber,
        sunshineDuration
    };

    console.log('Sending data to server: ', data);

    try {
        // Send data to server for calculation
        const response = await fetch('http://localhost:3000/api/calculate/et0', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server returned error: ', errorData);
            throw new Error('Calculation failed');
        }

        // Parse response
        const result = await response.json();
        console.log('Received result from server: ', result);

        // Display results
        displayResults(result.et0);
        
        // Also update intermediate values if available
        if (result.intermediateValues) {
            updateIntermediateValues(result.intermediateValues);
        } else {
            // If server doesn't return intermediate values, calculate them locally
            const intermediateValues = calculateIntermediateValues(temperature, windSpeed, relativeHumidity, 
                                                                 atmosphericPressure || calculateAtmosphericPressure(elevation), 
                                                                 latitude, dayNumber, sunshineDuration);
            updateIntermediateValues(intermediateValues);
        }
        
        // Make sure B2 div is visible
        const resultsBlock = document.getElementById('B2');
        if (resultsBlock) {
            resultsBlock.style.display = 'block';
        }

    } catch (error) {
        console.error('Error calculating ET0:', error);
        alert(`Calculation failed: ${error.message}`);
    }
}

// Function to calculate intermediate values locally if server doesn't provide them
function calculateIntermediateValues(temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration) {
    // Calculate saturation vapor pressure
    const es = saturationVaporPressure(temp);
    
    // Calculate actual vapor pressure
    const ea = (es * rh) / 100;
    
    // Calculate slope of vapor pressure curve
    const delta = slopeVaporPressureCurve(temp);
    
    // Calculate psychrometric constant
    const gamma = psychrometricConstant(pressure);
    
    // Calculate solar radiation components
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
    const delta_solar = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
    const latRad = (lat * Math.PI) / 180;
    const ws = Math.acos(-Math.tan(latRad) * Math.tan(delta_solar));
    
    // Calculate extraterrestrial radiation
    const Ra = (24 * 60 / Math.PI) * 0.082 * dr * (
        ws * Math.sin(latRad) * Math.sin(delta_solar) + 
        Math.cos(latRad) * Math.cos(delta_solar) * Math.sin(ws)
    );
    
    // Calculate net radiation (simplified)
    const Rn = 0.77 * Ra * 0.75 - 0.1;
    
    return {
        es,
        ea,
        delta,
        gamma,
        Ra,
        Rn
    };
}

// Function to update intermediate values
function updateIntermediateValues(values) {
    console.log("Updating intermediate values:", values);
    
    // Update saturation vapor pressure
    const satVaporPressureElement = document.getElementById('satVaporPressure');
    if (satVaporPressureElement && values.es) {
        satVaporPressureElement.textContent = `Saturation Vapor Pressure (es): ${values.es.toFixed(3)} kPa`;
    }
    
    // Update actual vapor pressure
    const actVaporPressureElement = document.getElementById('actVaporPressure');
    if (actVaporPressureElement && values.ea) {
        actVaporPressureElement.textContent = `Actual Vapor Pressure (ea): ${values.ea.toFixed(3)} kPa`;
    }
    
    // Update slope of vapor pressure curve
    const slopeVPCElement = document.getElementById('slopeVPC');
    if (slopeVPCElement && values.delta) {
        slopeVPCElement.textContent = `Slope of Vapour Pressure Curve (Δ): ${values.delta.toFixed(4)} kPa °C⁻¹`;
    }
    
    // Update psychrometric constant
    const psychoCElement = document.getElementById('psychoC');
    if (psychoCElement && values.gamma) {
        psychoCElement.textContent = `Psychrometric Constant (γ): ${values.gamma.toFixed(4)} kPa °C⁻¹`;
    }
    
    // Update net radiation
    const netRadElement = document.getElementById('netRad');
    if (netRadElement && values.Rn) {
        netRadElement.textContent = `Net Radiation (Rn): ${values.Rn.toFixed(2)} MJ m⁻² d⁻¹`;
    }
    
    // Make sure the intermediate output div is visible
    const intermediateOutput = document.getElementById('intermediate-output');
    if (intermediateOutput) {
        intermediateOutput.style.display = 'block';
    }
}

// Function to print calculation sheet
function printCalcSheet() {
    try {
        // First generate the calculation sheet if it hasn't been generated yet
        const calcSheetContent = document.getElementById('calcSheetContent');
        if (!calcSheetContent || calcSheetContent.innerHTML.trim() === '') {
            generateCalcSheet();
        }
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Pop-up blocker may be preventing the print window from opening. Please allow pop-ups for this site.');
            return;
        }
        
        printWindow.document.write('<html><head><title>ETo Calculation Sheet - Flaha Agri Tech</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @page {
                size: A4;
                margin: 1.5cm;
            }
            body { 
                font-family: Arial, sans-serif; 
                padding: 0; 
                margin: 0;
                position: relative;
                font-size: 11pt;
                line-height: 1.3;
                color: #333;
            }
            .report-container {
                max-width: 100%;
                position: relative;
            }
            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10px;
                margin-bottom: 15px;
                border-bottom: 1px solid #43a047;
                page-break-after: avoid;
                position: running(header);
            }
            .report-header-logo {
                height: 50px;
            }
            .report-header-text {
                text-align: right;
            }
            .report-header-text h1 {
                margin: 0;
                font-size: 16pt;
                color: #43a047;
            }
            .report-header-text p {
                margin: 3px 0;
                font-size: 9pt;
                color: #666;
            }
            .calc-sheet { 
                width: 100%;
                position: relative;
            }
            .calc-sheet-header { 
                text-align: center; 
                margin-bottom: 15px; 
                page-break-after: avoid;
            }
            .calc-sheet-header h2 {
                margin: 0 0 5px 0;
                font-size: 14pt;
                color: #1e88e5;
            }
            .calc-sheet-header p {
                margin: 3px 0;
                font-size: 10pt;
            }
            .calc-sheet-section { 
                margin-bottom: 20px; 
                page-break-inside: avoid;
            }
            .calc-sheet-section h3 {
                margin: 0 0 10px 0;
                font-size: 12pt;
                color: #43a047;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 5px;
                page-break-after: avoid;
            }
            .calc-param { 
                display: grid; 
                grid-template-columns: 3fr 1fr 1fr 1fr; 
                gap: 10px; 
                margin-bottom: 3px; 
                page-break-inside: avoid;
            }
            .param-name { 
                font-weight: bold; 
            }
            .param-formula { 
                font-family: monospace; 
                font-size: 0.9em; 
            }
            .param-value { 
                text-align: right; 
            }
            .param-unit { 
                text-align: left; 
            }
            .report-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                padding-top: 10px;
                border-top: 1px solid #43a047;
                font-size: 8pt;
                color: #666;
                text-align: center;
                display: flex;
                justify-content: space-between;
                background-color: white;
            }
            .report-footer-left {
                text-align: left;
            }
            .report-footer-right {
                text-align: right;
            }
            .print-watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 4em;
                color: rgba(0, 0, 0, 0.05);
                pointer-events: none;
                z-index: -1;
                white-space: nowrap;
            }
            .result-highlight {
                background-color: #e8f5e9;
                padding: 5px;
                border-radius: 4px;
                font-weight: bold;
            }
            .report-metadata {
                margin: 15px 0;
                padding: 10px;
                background-color: #f5f7fa;
                border-radius: 4px;
                font-size: 9pt;
                page-break-inside: avoid;
            }
            .report-metadata p {
                margin: 3px 0;
            }
            .report-content {
                margin-top: 0;
                padding-top: 0;
            }
            .page-break {
                page-break-before: always;
            }
            
            /* Repeat header on each page */
            @page {
                @top-center {
                    content: element(header);
                }
            }
            
            @media print {
                body { 
                    font-size: 11pt; 
                }
                .calc-param { 
                    page-break-inside: avoid; 
                }
                .calc-sheet-section { 
                    page-break-inside: avoid; 
                }
                .print-watermark {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    display: block !important;
                    color: rgba(0, 0, 0, 0.05) !important;
                }
                .result-highlight {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    background-color: #e8f5e9 !important;
                }
                .report-metadata {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    background-color: #f5f7fa !important;
                }
                .report-header {
                    display: block;
                    position: running(header);
                }
                .report-footer {
                    display: block;
                    position: fixed;
                    bottom: 0;
                }
                .report-content {
                    margin-top: 20px;
                    margin-bottom: 50px;
                }
            }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        
        // Get input values for metadata
        const location = document.getElementById("location") ? document.getElementById("location").value : "Not specified";
        const date = new Date().toLocaleDateString();
        const temp = parseFloat(document.getElementById("temperature").value);
        const windSpeed = parseFloat(document.getElementById("windSpeed").value);
        const rh = parseFloat(document.getElementById("relativeHumidity").value);
        
        // Create report structure with repeating header for all pages
        printWindow.document.write(`
            <!-- Main content with proper margins -->
            <div class="report-content">
                <div class="report-container">
                    <!-- This header will repeat on all pages -->
                    <div class="report-header">
                        <img src="img/Flaha_logo.svg" alt="Flaha Agri Tech" class="report-header-logo" 
                             onerror="this.onerror=null; this.src='img/Flaha_logo.png';">
                        <div class="report-header-text">
                            <h1>Reference Evapotranspiration Report</h1>
                            <p>Generated on ${date}</p>
                            <p>Flaha Agri Tech - Professional Agricultural Solutions</p>
                        </div>
                    </div>
                    
                    <div class="report-metadata">
                        <p><strong>Location:</strong> ${location || "Not specified"}</p>
                        <p><strong>Date of Calculation:</strong> ${date}</p>
                        <p><strong>Weather Conditions:</strong> Temperature: ${temp.toFixed(1)}°C, Wind Speed: ${windSpeed.toFixed(1)} m/s, Relative Humidity: ${rh.toFixed(0)}%</p>
                    </div>
                    
                    <div class="print-watermark">© Flaha Agri Tech</div>
                    ${document.getElementById('calcSheetContent').innerHTML}
                </div>
            </div>
            
            <!-- Fixed footer that appears on all pages -->
            <div class="report-footer">
                <div class="report-footer-left">
                    Report ID: FLH-${Date.now().toString().substring(5)}
                </div>
                <div class="report-footer-center">
                    © ${new Date().getFullYear()} Flaha Agri Tech. All rights reserved.
                </div>
                <div class="report-footer-right">
                    <script>
                        document.write('Page ' + (parseInt(window.location.hash.replace('#', ''), 10) || 1));
                    </script>
                </div>
            </div>
            
            <!-- Script to handle page numbering -->
            <script>
                window.onload = function() {
                    // Count the number of pages (approximate method)
                    const height = document.body.offsetHeight;
                    const pageHeight = 1122; // A4 height in pixels at 96 DPI
                    const totalPages = Math.ceil(height / pageHeight);
                    
                    // Update all page number elements
                    const pageNumbers = document.querySelectorAll('.report-footer-right');
                    pageNumbers.forEach((el, i) => {
                        el.textContent = 'Page ' + (i + 1) + ' of ' + totalPages;
                    });
                };
            </script>
        `);
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        // Use a timeout to ensure the content is loaded before printing
        setTimeout(() => {
            try {
                printWindow.print();
                setTimeout(() => printWindow.close(), 500);
            } catch (e) {
                console.error('Error during print:', e);
                alert('Error during print: ' + e.message);
                printWindow.close();
            }
        }, 1000);
    } catch (error) {
        console.error('Error in printCalcSheet:', error);
        alert('Error preparing print: ' + error.message);
    }
}

// Function to display results
function displayResults(et0Value) {
    const resultElement = document.getElementById('result');
    if (!resultElement) {
        console.error('Result element not found');
        return;
    }

    // Format the ET0 value
    const et0 = parseFloat(et0Value);
    if (isNaN(et0)) {
        console.error('Invalid ET0 value:', et0Value);
        resultElement.textContent = 'Error: Invalid calculation result';
        return;
    }

    // Update the result text
    resultElement.textContent = `Reference ET₀: ${et0.toFixed(2)} mm/day`;
    
    // Make sure the output div is visible
    const outputDiv = document.getElementById('output');
    if (outputDiv) {
        outputDiv.style.display = 'block';
    }
    
    // Show the action buttons
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.style.display = 'flex';
    }
}

// Function to test server connection
async function testServerConnection() {
  const SERVER_URL = 'http://localhost:3000';
  try {
    const response = await fetch(`${SERVER_URL}/api/test`);
    if (response.ok) {
      const data = await response.json();
      console.log('Server connection test successful:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', async function() {
  // Test server connection
  const serverAvailable = await testServerConnection();
  if (!serverAvailable) {
    // Show warning about server connection
    const warningEl = document.createElement("div");
    warningEl.className = "server-warning";
    warningEl.innerHTML = `
      <p class="warning">⚠️ Weather server connection failed. Make sure the server is running at http://localhost:3000.</p>
      <p>Check the server setup instructions in the README file.</p>
    `;
    document.querySelector(".container").prepend(warningEl);
  }
  
  // Rest of your initialization code...
});

// Secure calculation function - obfuscated implementation
function secureCalculate(temp, windSpeed, rh, elevation, pressure, lat, dayOfYear, sunshineDuration) {
    // This function contains the actual calculation logic but is obfuscated
    // to protect the intellectual property
    
    // Use a closure to hide the implementation details
    const calculate = (function() {
        // Private variables and functions
        const _constants = {
            albedo: 0.23,
            stefan: 4.903e-9,
            solarConstant: 0.082
        };
        
        // Private calculation methods with slightly obfuscated names
        const _c1 = function(d) { 
            return 1 + 0.033 * Math.cos((2 * Math.PI * d) / 365); 
        };
        
        const _c2 = function(d) { 
            return 0.409 * Math.sin((2 * Math.PI * d) / 365 - 1.39); 
        };
        
        const _c3 = function(l, d) {
            const lr = (l * Math.PI) / 180;
            return Math.acos(-Math.tan(lr) * Math.tan(d));
        };
        
        const _c4 = function(d, w, l, sd) {
            const lr = (l * Math.PI) / 180;
            return (24 * 60 / Math.PI) * _constants.solarConstant * d * (
                w * Math.sin(lr) * Math.sin(sd) + 
                Math.cos(lr) * Math.cos(sd) * Math.sin(w)
            );
        };
        
        const _c5 = function(w) { 
            return (24 / Math.PI) * w; 
        };
        
        const _c6 = function(r, n, N) { 
            return r * (0.25 + 0.5 * (n / N)); 
        };
        
        const _c7 = function(r, e) { 
            return (0.75 + 2e-5 * e) * r; 
        };
        
        const _c8 = function(r, a) { 
            return (1 - a) * r; 
        };
        
        const _c9 = function(t) { 
            return 0.6108 * Math.exp((17.27 * t) / (t + 237.3)); 
        };
        
        const _c10 = function(t) {
            return (4098 * 0.6108 * Math.exp((17.27 * t) / (t + 237.3))) / Math.pow(t + 237.3, 2);
        };
        
        const _c11 = function(p) { 
            return 0.000665 * p; 
        };
        
        const _c12 = function(t, t2, e, r, ro) {
            const tk1 = t + 273.16;
            const tk2 = t2 + 273.16;
            
            return _constants.stefan * 0.5 * (Math.pow(tk1, 4) + Math.pow(tk2, 4)) * 
                   (0.34 - 0.14 * Math.sqrt(e)) * 
                   (1.35 * (r / ro) - 0.35);
        };
        
        // Return the public interface
        return function(t, w, h, e, p, l, d, s) {
            try {
                // Calculate all parameters
                const dr = _c1(d);
                const delta = _c2(d);
                const ws = _c3(l, delta);
                const Ra = _c4(dr, ws, l, delta);
                const N = _c5(ws);
                const n = s;
                const Rs = _c6(Ra, n, N);
                const Rso = _c7(Ra, e);
                const albedo = _constants.albedo;
                const Rns = _c8(Rs, albedo);
                const es = _c9(t);
                const ea = (es * h) / 100;
                const deltaVPC = _c10(t);
                const gamma = _c11(p);
                const Rnl = _c12(t, t, ea, Rs, Rso);
                const Rn = Rns - Rnl;
                const G = 0;
                
                // Calculate ETo
                const numerator = 0.408 * deltaVPC * (Rn - G) + gamma * (900 / (t + 273)) * w * (es - ea);
                const denominator = deltaVPC + gamma * (1 + 0.34 * w);
                const ET0 = numerator / denominator;
                
                // Return all calculated values
                return {
                    dr, delta, ws, Ra, N, Rs, Rso, Rns, es, ea, deltaVPC, gamma, Rnl, Rn, G, ET0
                };
            } catch (error) {
                console.error('Error in secure calculation:', error);
                throw new Error('Calculation failed: ' + error.message);
            }
        };
    })();
    
    // Call the closure with the input parameters
    return calculate(temp, windSpeed, rh, elevation, pressure, lat, dayOfYear, sunshineDuration);
}

// Add watermark to prevent unauthorized copying
document.addEventListener('DOMContentLoaded', function() {
    const watermarkDiv = document.createElement('div');
    watermarkDiv.className = 'watermark';
    watermarkDiv.innerHTML = '© Flaha Agri Tech';
    document.body.appendChild(watermarkDiv);
    
    // Add CSS for watermark
    const style = document.createElement('style');
    style.textContent = `
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 3em;
            color: rgba(0, 0, 0, 0.05);
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
            user-select: none;
        }
    `;
    document.head.appendChild(style);
    
    // Prevent right-click to disable saving/inspecting
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable keyboard shortcuts that could be used to view source
    document.addEventListener('keydown', function(e) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
            (e.ctrlKey && e.keyCode === 85)
        ) {
            e.preventDefault();
            return false;
        }
    });
});
