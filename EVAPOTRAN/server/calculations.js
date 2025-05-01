/**
 * Core calculation module - PROPRIETARY
 * Contains the implementation of FAO Penman-Monteith equation
 */

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

// Main calculation function
function calculateET0(params) {
  const {
    temperature,
    windSpeed,
    relativeHumidity,
    elevation,
    latitude,
    dayOfYear,
    sunshineDuration
  } = params;
  
  // Calculate atmospheric pressure if not provided
  const pressure = params.pressure || calculateAtmosphericPressure(elevation);
  
  // Convert latitude to radians
  const latRad = (latitude * Math.PI) / 180;
  
  // Calculate saturation vapor pressure
  const es = saturationVaporPressure(temperature);
  
  // Calculate actual vapor pressure
  const ea = (es * relativeHumidity) / 100;
  
  // Calculate slope of vapor pressure curve
  const delta = slopeVaporPressureCurve(temperature);
  
  // Calculate psychrometric constant
  const gamma = psychrometricConstant(pressure);
  
  // Calculate extraterrestrial radiation
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * dayOfYear);
  const delta_solar = 0.409 * Math.sin((2 * Math.PI / 365) * dayOfYear - 1.39);
  
  // Calculate sunset hour angle
  const ws = Math.acos(-Math.tan(latRad) * Math.tan(delta_solar));
  
  // Calculate extraterrestrial radiation
  const Ra = (24 * 60 / Math.PI) * 0.082 * dr * (
    ws * Math.sin(latRad) * Math.sin(delta_solar) + 
    Math.cos(latRad) * Math.cos(delta_solar) * Math.sin(ws)
  );
  
  // Calculate day length
  const dayLength = (24 / Math.PI) * ws;
  
  // Calculate solar radiation
  const n_N = Math.min(sunshineDuration / dayLength, 1);
  const Rs = (0.25 + 0.5 * n_N) * Ra;
  
  // Calculate clear-sky solar radiation
  const Rso = (0.75 + 2e-5 * elevation) * Ra;
  
  // Calculate net shortwave radiation
  const Rns = 0.77 * Rs;
  
  // Calculate net longwave radiation
  const Rnl = 4.903e-9 * Math.pow((temperature + 273.16), 4) * 
              (0.34 - 0.14 * Math.sqrt(ea)) * 
              (1.35 * (Rs / Rso) - 0.35);
  
  // Calculate net radiation
  const Rn = Rns - Rnl;
  
  // Calculate soil heat flux (assumed to be 0 for daily calculations)
  const G = 0;
  
  // Calculate ET0
  const numerator = 0.408 * delta * (Rn - G) + 
                    gamma * (900 / (temperature + 273)) * windSpeed * (es - ea);
  const denominator = delta + gamma * (1 + 0.34 * windSpeed);
  
  if (Math.abs(denominator) < 0.0001) {
    throw new Error(`Division by near-zero in ET0 calculation: ${denominator}`);
  }
  
  const result = numerator / denominator;
  
  // Check for reasonable result
  if (isNaN(result)) {
    throw new Error('Calculation resulted in NaN');
  }
  
  if (!isFinite(result)) {
    throw new Error('Calculation resulted in Infinity');
  }
  
  if (result < -10 || result > 15) {
    throw new Error(`ET0 result outside reasonable range: ${result}`);
  }
  
  // Return the result
  return {
    et0: result,
    intermediateValues: {
      // Include intermediate values if needed for debugging
      es,
      ea,
      delta,
      gamma,
      Ra,
      Rs,
      Rn
    }
  };
}

module.exports = {
  calculateET0
};



