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

// # -[ Functions ]----------------------------------------------------------------

// # define safe functions for variable conversion, preventing errors with NaN and Null as string values*/

function calculateET() {
	// Get input values
	const temp = parseFloat(document.getElementById("temperature").value);
	const windSpeed = parseFloat(document.getElementById("windSpeed").value);
	const rh = parseFloat(document.getElementById("relativeHumidity").value);
	const pressure =
		parseFloat(document.getElementById("atmosphericPressure").value) ||
		calculateAtmosphericPressure();
	const elev = parseFloat(document.getElementById("elevation").value);
	const lat = parseFloat(document.getElementById("latitude").value);
	const dayOfYear = parseFloat(document.getElementById("dayNumber").value);
	const sunshineDuration = parseFloat(
		document.getElementById("sunshineDuration").value
	);

	// Convert latitude to radians
	const latRad = (lat * Math.PI) / 180;

	// Calculate extraterrestrial radiation
	const Ra = extraterrestrialRadiation(latRad, dayOfYear);

	// Calculate clear sky radiation
	const Rso = clearSkyRadiation(Ra, elev);

	// Calculate daylight hours (N)
	const solarDeclination =
		0.409 * Math.sin(((2 * Math.PI) / 365) * dayOfYear - 1.39);
	const omegaS = Math.acos(-Math.tan(latRad) * Math.tan(solarDeclination));
	const N = (24 * omegaS) / Math.PI;

	// Calculate relative sunshine duration (n/N)
	const n_N = sunshineDuration ? sunshineDuration / N : 0.5; // Use 0.5 as default if not provided

	// Estimate solar radiation (Rs) using Angstrom formula with actual sunshine data
	const Rs = (0.25 + 0.5 * n_N) * Ra;

	// Rest of the calculation remains the same
	const albedo = 0.23;
	const Rns = netShortwaveRadiation(Rs, albedo);
	const es = saturationVaporPressure(temp);
	const ea = (es * rh) / 100;
	const delta = slopeVaporPressureCurve(temp);
	const gamma = psychrometricConstant(pressure);
	const Rnl = netLongwaveRadiation(temp, temp, ea, Rs, Rso);
	const Rn = Rns - Rnl;
	const G = 0;

	const numerator =
		0.408 * delta * (Rn - G) +
		gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
	const denominator = delta + gamma * (1 + 0.34 * windSpeed);
	const ET0 = numerator / denominator;

	// Display results
	document.getElementById(
		"satVaporPressure"
	).textContent = `Saturation Vapor Pressure (es): ${es.toFixed(3)} kPa`;
	document.getElementById(
		"actVaporPressure"
	).textContent = `Actual Vapor Pressure (ea): ${ea.toFixed(3)} kPa`;
	document.getElementById(
		"slopeVPC"
	).textContent = `Slope of Vapour Pressure Curve (Δ): ${delta.toFixed(
		4
	)} kPa °C⁻¹`;
	document.getElementById(
		"psychoC"
	).textContent = `Psychrometric Constant (γ): ${gamma.toFixed(4)} kPa °C⁻¹`;
	document.getElementById(
		"netRad"
	).textContent = `Net Radiation (Rn): ${Rn.toFixed(2)} MJ m⁻² d⁻¹`;
	document.getElementById("result").textContent = `Reference ET₀: ${ET0.toFixed(
		2
	)} mm/day`;
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
