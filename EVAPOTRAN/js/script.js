/** @format */

/* 
### @Todo
###		: Well lots, I'm still trying to completely understand this (and I don't).
###     : A lot of this data really needs to be in a db schem
###     : More error handling (I'm patching along the way and it shows)

###########################################################################################################
##                                   Credits                                                             ##
###########################################################################################################
## 																										 ##	
## Evapotranspiration Calculation using Penman-Monteith Method											 ##
## Author: Rafat Al Khashan																				 ##
## Email: rafat.khashan82@gmail.com																		 ##
## Corp.: Flaha Agri Tech																				 ##
## Corp.: info@flaha.org																				 ##
## Date: August 8, 2023																					 ##
##																										 ##
###########################################################################################################

# -[ Functions ]----------------------------------------------------------------

# define safe functions for variable conversion, preventing errors with NaN and Null as string values*/

function calculateET() {
	// Perform the calculations based on the provided formulas
	const inverseRelativeDistance = calculateInverseRelativeDistance(dayNumber());

	const solarDeclination = calculateSolarDeclination(dayNumber());

	const sunsetHourAngle = calculateSunsetHourAngle(
		latitude(),
		solarDeclination
	);

	const extraterrestrialRadiation = calculateExtraterrestrialRadiation(
		inverseRelativeDistance,
		solarDeclination,
		sunsetHourAngle
	);

	const saturationVaporPressureAtTmin = calculateSaturationVaporPressureAtTmin(
		calculateMinTemperature()
	);
	const saturationVaporPressureAtTmax = calculateSaturationVaporPressureAtTmax(
		calculateMaxTemperature()
	);
	const saturationVaporPressure = calculateSaturationVaporPressure(
		saturationVaporPressureAtTmin,
		saturationVaporPressureAtTmax
	);
	const actualVaporPressure1 = calculateActualVaporPressure1(
		calculateDewPointTemperature()
	);
	const actualVaporPressure2 = calculateActualVaporPressure2(
		calculateMinRelativeHumidity(),
		calculateMaxRelativeHumidity(),
		saturationVaporPressureAtTmin,
		saturationVaporPressureAtTmax
	);
	const actualVaporPressure3 = calculateActualVaporPressure3(
		calculateMeanRelativeHumidity(),
		calculateMinTemperature(),
		calculateMaxTemperature()
	);
	const approximatedDewPointTemperature =
		calculateApproximatedDewPointTemperature(
			calculateMinTemperature(),
			calculateMaxTemperature()
		);
	const actualVaporPressure4 = calculateActualVaporPressure4(
		approximatedDewPointTemperature
	);
	const actualVaporPressure = calculateActualVaporPressure(
		actualVaporPressure1,
		actualVaporPressure2,
		actualVaporPressure3,
		actualVaporPressure4
	);
	const saturationVaporPressureDeficit =
		calculateSaturationVaporPressureDeficit(
			saturationVaporPressure,
			actualVaporPressure
		);
	const slopeVaporPressureCurve = calculateSlopeVaporPressureCurve(
		calculateMinTemperature(),
		calculateMaxTemperature()
	);
	const psychrometricConstant = calculatePsychrometricConstant(elevation());
	const windSpeedAt2m = calculateWindSpeedAt2m();
	const sunshineDuration = calculateactualDurationOfSunshine(sunsetHourAngle);

	//------------------------------------------------------------------------------
	// Implement Radiation into the calculation
	//------------------------------------------------------------------------------
	const solarRadiation = calculatesolarRadiation(
		extraterrestrialRadiation,
		sunshineDuration
	);
	const clearSkySolarRadiation = calculateclearSkySolarRadiation(
		extraterrestrialRadiation,
		elevation()
	);

	const netShortwaveRadiation = calculatenetShortwaveRadiation(solarRadiation);

	const netLongwaveRadiation = calculatenetLongwaveRadiation(
		extraterrestrialRadiation,
		saturationVaporPressureDeficit,
		solarRadiation,
		clearSkySolarRadiation,
		calculateMinTemperature(),
		calculateMaxTemperature()
	);

	const netRadiation = calculatenetRadiation(
		netShortwaveRadiation,
		netLongwaveRadiation
	);

	//------------------------------------------------------------------------------

	const referenceET = calculateReferenceET(
		saturationVaporPressure,
		slopeVaporPressureCurve,
		psychrometricConstant,
		saturationVaporPressureDeficit,
		windSpeedAt2m,
		netRadiation
	);

	document.getElementById(
		"result"
		//).innerText = `Reference ET: ${referenceET} mm/day`;
	).innerText = `Reference ET: ${referenceET.toFixed(2)} mm/day`;

	document.getElementById(
		"SlopVPC"
	).innerText = `Slope Vapour Pressure Curve: ${slopeVaporPressureCurve.toFixed(
		2
	)} kPa/°C`;

	/* document.getElementById(
		"WindSp"
	).innerText = `Wind Speed: ${windSpeedAt2m.toFixed(2)} m/s`; */

	document.getElementById(
		"PsychoC"
	).innerText = `Psychrometric Constant: ${psychrometricConstant.toFixed(
		2
	)} kPa/°C`;

	document.getElementById(
		"SaturVD"
	).innerText = `Saturation Vapour Pressure Deficit: ${saturationVaporPressureDeficit.toFixed(
		2
	)} kPa/°C`;

	document.getElementById(
		"NetRad"
	).innerText = `Net Radiation: ${netRadiation.toFixed(2)} MJ/m²day`;
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

function calculateActualVaporPressure4(dewPointTemperature) {
	if (dewPointTemperature === "nd") {
		return "nd";
	}
	return (
		0.6108 *
		Math.exp((17.27 * dewPointTemperature) / (237.3 + dewPointTemperature))
	);
}

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

function calculateSaturationVaporPressureDeficit(
	saturationVaporPressure,
	actualVaporPressure
) {
	if (saturationVaporPressure === "nd" || actualVaporPressure === "nd") {
		return "nd";
	}
	return saturationVaporPressure - actualVaporPressure;
}

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
