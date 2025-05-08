/**
 * Calculation Worker for EVAPOTRAN
 * Handles heavy ET0 calculations in a separate thread
 */

self.onmessage = function(e) {
  const inputData = e.data;
  
  try {
    // Validate input data
    if (!validateInputData(inputData)) {
      throw new Error('Invalid input data');
    }
    
    // Calculate ET0
    const result = calculateET0(
      inputData.temperature,
      inputData.windSpeed,
      inputData.relativeHumidity,
      inputData.atmosphericPressure || calculateAtmosphericPressure(inputData.elevation),
      inputData.latitude,
      inputData.dayNumber,
      inputData.sunshineDuration
    );
    
    // Calculate intermediate values
    const intermediateValues = calculateIntermediateValues(
      inputData.temperature,
      inputData.windSpeed,
      inputData.relativeHumidity,
      inputData.atmosphericPressure || calculateAtmosphericPressure(inputData.elevation),
      inputData.latitude,
      inputData.dayNumber,
      inputData.sunshineDuration
    );
    
    // Send results back to main thread
    self.postMessage({
      et0: result,
      intermediateValues: intermediateValues
    });
  } catch (error) {
    self.postMessage({
      error: error.message
    });
  }
};

// Validation function
function validateInputData(data) {
  const requiredFields = [
    'temperature', 
    'windSpeed', 
    'relativeHumidity', 
    'latitude', 
    'dayNumber', 
    'sunshineDuration'
  ];
  
  // Check if all required fields exist and are numeric
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || isNaN(parseFloat(data[field]))) {
      console.error(`Invalid or missing field: ${field} = ${data[field]}`);
      return false;
    }
  }
  
  // Check if either elevation or atmospheric pressure is provided
  if ((data.elevation === undefined || isNaN(parseFloat(data.elevation))) && 
      (data.atmosphericPressure === undefined || isNaN(parseFloat(data.atmosphericPressure)))) {
    console.error('Either elevation or atmospheric pressure must be provided');
    return false;
  }
  
  return true;
}

// Calculate atmospheric pressure from elevation
function calculateAtmosphericPressure(elevation) {
  return 101.3 * Math.pow((293 - 0.0065 * elevation) / 293, 5.26);
}

// Calculate ET0 using FAO Penman-Monteith equation
function calculateET0(temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration) {
  // Convert inputs to numbers to ensure proper calculation
  temp = parseFloat(temp);
  windSpeed = parseFloat(windSpeed);
  rh = parseFloat(rh);
  pressure = parseFloat(pressure);
  lat = parseFloat(lat);
  dayOfYear = parseFloat(dayOfYear);
  sunshineDuration = parseFloat(sunshineDuration);
  
  // Calculate saturation vapor pressure
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  
  // Calculate actual vapor pressure
  const ea = (es * rh) / 100;
  
  // Calculate slope of vapor pressure curve
  const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
  
  // Calculate psychrometric constant
  const gamma = 0.000665 * pressure;
  
  // Calculate solar declination
  const solarDeclination = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
  
  // Calculate sunset hour angle
  const sunsetHourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(solarDeclination));
  
  // Calculate extraterrestrial radiation
  const dr = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
  const Ra = 24 * 60 / Math.PI * 0.082 * dr * (
    sunsetHourAngle * Math.sin(lat * Math.PI / 180) * Math.sin(solarDeclination) +
    Math.cos(lat * Math.PI / 180) * Math.cos(solarDeclination) * Math.sin(sunsetHourAngle)
  );
  
  // Calculate daylight hours
  const N = 24 * sunsetHourAngle / Math.PI;
  
  // Calculate solar radiation
  const Rs = (0.25 + 0.5 * sunshineDuration / N) * Ra;
  
  // Calculate clear-sky solar radiation
  const Rso = (0.75 + 2e-5 * 0) * Ra; // Assuming elevation = 0 for simplicity
  
  // Calculate net shortwave radiation
  const Rns = 0.77 * Rs;
  
  // Calculate net longwave radiation
  const sigma = 4.903e-9; // Stefan-Boltzmann constant
  const Rnl = sigma * Math.pow(temp + 273.16, 4) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Rso - 0.35);
  
  // Calculate net radiation
  const Rn = Rns - Rnl;
  
  // Calculate soil heat flux (assumed to be 0 for daily calculations)
  const G = 0;
  
  // Calculate ET0
  const numerator = 0.408 * delta * (Rn - G) + gamma * (900 / (temp + 273)) * windSpeed * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * windSpeed);
  const ET0 = numerator / denominator;
  
  return ET0;
}

// Calculate intermediate values for display
function calculateIntermediateValues(temp, windSpeed, rh, pressure, lat, dayOfYear, sunshineDuration) {
  // Convert inputs to numbers
  temp = parseFloat(temp);
  windSpeed = parseFloat(windSpeed);
  rh = parseFloat(rh);
  pressure = parseFloat(pressure);
  lat = parseFloat(lat);
  dayOfYear = parseFloat(dayOfYear);
  sunshineDuration = parseFloat(sunshineDuration);
  
  // Calculate saturation vapor pressure
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  
  // Calculate actual vapor pressure
  const ea = (es * rh) / 100;
  
  // Calculate slope of vapor pressure curve
  const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
  
  // Calculate psychrometric constant
  const gamma = 0.000665 * pressure;
  
  // Calculate solar declination
  const solarDeclination = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
  
  // Calculate sunset hour angle
  const sunsetHourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(solarDeclination));
  
  // Calculate extraterrestrial radiation
  const dr = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
  const Ra = 24 * 60 / Math.PI * 0.082 * dr * (
    sunsetHourAngle * Math.sin(lat * Math.PI / 180) * Math.sin(solarDeclination) +
    Math.cos(lat * Math.PI / 180) * Math.cos(solarDeclination) * Math.sin(sunsetHourAngle)
  );
  
  // Calculate daylight hours
  const N = 24 * sunsetHourAngle / Math.PI;
  
  // Calculate solar radiation
  const Rs = (0.25 + 0.5 * sunshineDuration / N) * Ra;
  
  // Calculate clear-sky solar radiation
  const Rso = (0.75 + 2e-5 * 0) * Ra; // Assuming elevation = 0 for simplicity
  
  // Calculate net shortwave radiation
  const Rns = 0.77 * Rs;
  
  // Calculate net longwave radiation
  const sigma = 4.903e-9; // Stefan-Boltzmann constant
  const Rnl = sigma * Math.pow(temp + 273.16, 4) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * Rs / Rso - 0.35);
  
  // Calculate net radiation
  const Rn = Rns - Rnl;
  
  return {
    es: es,
    ea: ea,
    delta: delta,
    gamma: gamma,
    Rn: Rn,
    Rs: Rs,
    Ra: Ra
  };
}
