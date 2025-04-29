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
});

// Check if there's data from EPW import
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's data from EPW import
    const storedData = localStorage.getItem('etoCalcData');
    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            
            // Fill in the form fields
            document.getElementById('temperature').value = data.temperature;
            document.getElementById('windSpeed').value = data.windSpeed;
            document.getElementById('relativeHumidity').value = data.relativeHumidity;
            document.getElementById('atmosphericPressure').value = data.atmosphericPressure;
            document.getElementById('elevation').value = data.elevation;
            document.getElementById('latitude').value = data.latitude;
            document.getElementById('dayNumber').value = data.dayNumber;
            document.getElementById('sunshineDuration').value = data.sunshineDuration;
            
            // Clear the stored data
            localStorage.removeItem('etoCalcData');
            
            // Optionally, automatically calculate ET0
            calculateET();
        } catch (e) {
            console.error('Error loading EPW data:', e);
        }
    }
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

// Function to generate calculation sheet
function generateCalcSheet() {
    const calcSheetContent = document.getElementById('calcSheetContent');
    if (!calcSheetContent) return;
    
    // Get input values
    const temp = parseFloat(document.getElementById("temperature").value);
    const windSpeed = parseFloat(document.getElementById("windSpeed").value);
    const rh = parseFloat(document.getElementById("relativeHumidity").value);
    const elevation = parseFloat(document.getElementById("elevation").value);
    const pressure = parseFloat(document.getElementById("atmosphericPressure").value) || calculateAtmosphericPressure(elevation);
    const lat = parseFloat(document.getElementById("latitude").value);
    const dayOfYear = parseFloat(document.getElementById("dayNumber").value);
    const sunshineDuration = parseFloat(document.getElementById("sunshineDuration").value);
    
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
    
    // Calculate all parameters needed for the sheet
    const dr = inverseRelativeDistanceEarthSun(dayOfYear);
    const delta = solarDeclination(dayOfYear);
    const ws = sunsetHourAngle(lat, delta);
    const Ra = extraterrestrialRadiation(dr, ws, lat, delta);
    const N = dayLength(ws);
    const n = sunshineDuration;
    const Rs = solarRadiation(Ra, n, N);
    const Rso = clearSkySolarRadiation(Ra, elevation);
    const albedo = 0.23;
    const Rns = netShortwaveRadiation(Rs, albedo);
    const es = saturationVaporPressure(temp);
    const ea = (es * rh) / 100;
    const deltaVPC = slopeVaporPressureCurve(temp);
    const gamma = psychrometricConstant(pressure);
    const Rnl = netLongwaveRadiation(temp, temp, ea, Rs, Rso);
    const Rn = Rns - Rnl;
    const G = 0;
    
    // Calculate ETo
    const numerator = 0.408 * deltaVPC * (Rn - G) + gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
    const denominator = deltaVPC + gamma * (1 + 0.34 * windSpeed);
    const ET0 = numerator / denominator;
    
    // Generate HTML content
    calcSheetContent.innerHTML = `
        <div class="calc-sheet">
            <div class="calc-sheet-header">
                <h2>Reference Evapotranspiration (ETo) Calculation</h2>
                <p>FAO Penman-Monteith Method</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
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
                    <div class="param-name">Atmospheric Pressure</div>
                    <div class="param-formula">P = 101.3 × ((293 - 0.0065z) / 293)^5.26</div>
                    <div class="param-value">${pressure.toFixed(2)}</div>
                    <div class="param-unit">kPa</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Latitude</div>
                    <div class="param-formula">φ</div>
                    <div class="param-value">${lat.toFixed(2)}</div>
                    <div class="param-unit">degrees</div>
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
                    <div class="param-formula">dr = 1 + 0.033 × cos(2π × J / 365)</div>
                    <div class="param-value">${dr.toFixed(5)}</div>
                    <div class="param-unit">-</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Solar Declination</div>
                    <div class="param-formula">δ = 0.409 × sin(2π × J / 365 - 1.39)</div>
                    <div class="param-value">${delta.toFixed(5)}</div>
                    <div class="param-unit">radians</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Sunset Hour Angle</div>
                    <div class="param-formula">ωs = arccos(-tan(φ) × tan(δ))</div>
                    <div class="param-value">${ws.toFixed(5)}</div>
                    <div class="param-unit">radians</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Daylight Hours</div>
                    <div class="param-formula">N = 24 × ωs / π</div>
                    <div class="param-value">${N.toFixed(2)}</div>
                    <div class="param-unit">hours</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Extraterrestrial Radiation</div>
                    <div class="param-formula">Ra = (24 × 60 / π) × Gsc × dr × [ωs × sin(φ) × sin(δ) + cos(φ) × cos(δ) × sin(ωs)]</div>
                    <div class="param-value">${Ra.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Solar Radiation</div>
                    <div class="param-formula">Rs = (0.25 + 0.5 × n/N) × Ra</div>
                    <div class="param-value">${Rs.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Clear Sky Radiation</div>
                    <div class="param-formula">Rso = (0.75 + 2 × 10⁻⁵ × z) × Ra</div
                    <div class="param-value">${Rso.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
            </div>
            
            <div class="calc-sheet-section">
                <h3>Evapotranspiration Calculation</h3>
                <div class="calc-param">
                    <div class="param-name">Net Shortwave Radiation</div>
                    <div class="param-formula">Rns = (1 - albedo) × Rs</div>
                    <div class="param-value">${Rns.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Net Longwave Radiation</div>
                    <div class="param-formula">Rnl = 4.903 × 10⁻⁹ × 0.5 × (Tmax⁴ + Tmin⁴) × (0.34 - 0.14 × √ea) × (1.35 × Rs/Rso - 0.35)</div>
                    <div class="param-value">${Rnl.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Net Radiation</div>
                    <div class="param-formula">Rn = Rns - Rnl</div>
                    <div class="param-value">${Rn.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Soil Heat Flux Density</div>
                    <div class="param-formula">G = 0</div>
                    <div class="param-value">${G.toFixed(2)}</div>
                    <div class="param-unit">MJ m⁻² d⁻¹</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Saturation Vapor Pressure</div>
                    <div class="param-formula">es = 0.6108 × exp((17.27 × T) / (T + 237.3))</div>
                    <div class="param-value">${es.toFixed(3)}</div>
                    <div class="param-unit">kPa</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Actual Vapor Pressure</div>
                    <div class="param-formula">ea = (es × RH) / 100</div>
                    <div class="param-value">${ea.toFixed(3)}</div>
                    <div class="param-unit">kPa</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Slope of Vapor Pressure Curve</div>
                    <div class="param-formula">Δ = (4098 × es) / (T + 237.3)²</div>
                    <div class="param-value">${deltaVPC.toFixed(4)}</div>
                    <div class="param-unit">kPa/°C</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Psychrometric Constant</div>
                    <div class="param-formula">γ = 0.000665 × P</div>
                    <div class="param-value">${gamma.toFixed(4)}</div>
                    <div class="param-unit">kPa/°C</div>
                </div>
                <div class="calc-param">
                    <div class="param-name">Reference ET₀</div>
                    <div class="param-formula">ET₀ = (0.408 × Δ × (Rn - G) + γ × (900 / (T + 273)) × u₂ × (es - ea)) / (Δ + γ × (1 + 0.34 × u₂))</div>
                    <div class="param-value">${ET0.toFixed(2)}</div>
                    <div class="param-unit">mm/day</div>
                </div>
            </div>
        </div>
    `;
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
function calculateET() {
    // Get input values
    const temp = parseFloat(document.getElementById("temperature").value);
    const windSpeed = parseFloat(document.getElementById("windSpeed").value);
    const rh = parseFloat(document.getElementById("relativeHumidity").value);
    const elevation = parseFloat(document.getElementById("elevation").value);
    const pressure = parseFloat(document.getElementById("atmosphericPressure").value) || calculateAtmosphericPressure(elevation);
    const lat = parseFloat(document.getElementById("latitude").value);
    const dayOfYear = parseFloat(document.getElementById("dayNumber").value);
    const sunshineDuration = parseFloat(document.getElementById("sunshineDuration").value);
    
    // Validate inputs
    if (isNaN(temp) || isNaN(windSpeed) || isNaN(rh) || isNaN(elevation) || 
        isNaN(lat) || isNaN(dayOfYear) || isNaN(sunshineDuration)) {
        alert("Please fill in all required fields with valid numbers.");
        return;
    }
    
    // Calculate intermediate values
    const dr = inverseRelativeDistanceEarthSun(dayOfYear);
    const delta = solarDeclination(dayOfYear);
    const ws = sunsetHourAngle(lat, delta);
    const Ra = extraterrestrialRadiation(dr, ws, lat, delta);
    const N = dayLength(ws);
    const Rs = solarRadiation(Ra, sunshineDuration, N);
    const Rso = clearSkySolarRadiation(Ra, elevation);
    const albedo = 0.23;
    const Rns = netShortwaveRadiation(Rs, albedo);
    const es = saturationVaporPressure(temp);
    const ea = (es * rh) / 100;
    const deltaVPC = slopeVaporPressureCurve(temp);
    const gamma = psychrometricConstant(pressure);
    const Rnl = netLongwaveRadiation(temp, temp, ea, Rs, Rso);
    const Rn = Rns - Rnl;
    const G = 0;
    
    // Calculate ET0
    const numerator = 0.408 * deltaVPC * (Rn - G) + gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
    const denominator = deltaVPC + gamma * (1 + 0.34 * windSpeed);
    const ET0 = numerator / denominator;
    
    // Display results
    document.getElementById("satVaporPressure").textContent = `Saturation Vapor Pressure (es): ${es.toFixed(3)} kPa`;
    document.getElementById("actVaporPressure").textContent = `Actual Vapor Pressure (ea): ${ea.toFixed(3)} kPa`;
    document.getElementById("slopeVPC").textContent = `Slope of Vapour Pressure Curve (Δ): ${deltaVPC.toFixed(4)} kPa °C⁻¹`;
    document.getElementById("psychoC").textContent = `Psychrometric Constant (γ): ${gamma.toFixed(4)} kPa °C⁻¹`;
    document.getElementById("netRad").textContent = `Net Radiation (Rn): ${Rn.toFixed(2)} MJ m⁻² d⁻¹`;
    document.getElementById("result").textContent = `Reference ET₀: ${ET0.toFixed(2)} mm/day`;
    
    // Enable calculation sheet buttons
    document.getElementById("showCalcSheet").disabled = false;
    document.getElementById("printCalcSheet").disabled = false;
}

// Add these missing helper functions
function inverseRelativeDistanceEarthSun(dayOfYear) {
    return 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
}

function solarDeclination(dayOfYear) {
    return 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
}

function sunsetHourAngle(latitude, delta) {
    const latRad = latitude * Math.PI / 180;
    return Math.acos(-Math.tan(latRad) * Math.tan(delta));
}

function extraterrestrialRadiation(dr, ws, latitude, delta) {
    const latRad = latitude * Math.PI / 180;
    const Gsc = 0.0820; // Solar constant [MJ m-2 min-1]
    return (24 * 60 / Math.PI) * Gsc * dr * (ws * Math.sin(latRad) * Math.sin(delta) + 
            Math.cos(latRad) * Math.cos(delta) * Math.sin(ws));
}

function dayLength(ws) {
    return (24 / Math.PI) * ws;
}

function solarRadiation(Ra, n, N) {
    return (0.25 + 0.5 * n / N) * Ra;
}

function clearSkySolarRadiation(Ra, elevation) {
    return (0.75 + 2e-5 * elevation) * Ra;
}

function netShortwaveRadiation(Rs, albedo) {
    return (1 - albedo) * Rs;
}

function netLongwaveRadiation(Tmax, Tmin, ea, Rs, Rso) {
    const Tmaxk = Tmax + 273.16;
    const Tmink = Tmin + 273.16;
    const sigma = 4.903e-9; // Stefan-Boltzmann constant [MJ K-4 m-2 day-1]
    
    return sigma * ((Math.pow(Tmaxk, 4) + Math.pow(Tmink, 4)) / 2) * 
           (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Rso - 0.35);
}

// Function to print calculation sheet
function printCalcSheet() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>ETo Calculation Sheet</title>');
    printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
    printWindow.document.write('</head><body>');
    printWindow.document.write(document.getElementById('calcSheetContent').innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}
