// Server-side calculation service
const express = require('express');
const router = express.Router();

// Import calculation functions (moved from client-side)
const calculations = require('./calculations');

// Helper function to validate input data
function validateInputData(data) {
  const requiredFields = [
    'temperature', 
    'windSpeed', 
    'relativeHumidity', 
    'elevation', 
    'latitude', 
    'dayOfYear', 
    'sunshineDuration'
  ];
  
  // Check if all required fields exist
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
    
    // Check if values are numeric
    if (isNaN(parseFloat(data[field]))) {
      console.error(`Field is not a number: ${field} = ${data[field]}`);
      return false;
    }
  }
  
  return true;
}

// Endpoint for ET0 calculation
router.post('/calculate/et0', (req, res) => {
  try {
    console.log('Calculation service received request:', req.body);
    const inputData = req.body;
    
    // Validate input data
    if (!validateInputData(inputData)) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        details: 'All required fields must be present and numeric'
      });
    }
    
    // Perform calculations
    const result = calculations.calculateET0(inputData);
    console.log('Calculation result:', result);
    
    // Return the results with intermediate values
    res.json({
      et0: result.et0,
      timestamp: new Date().toISOString(),
      units: 'mm/day',
      intermediateValues: result.intermediateValues
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      error: 'Calculation failed: ' + error.message
    });
  }
});

module.exports = router;

