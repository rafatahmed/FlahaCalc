// Calculator module for EVAPOTRAN

/**
 * Initialize the calculator
 */
export function initializeCalculator() {
  console.log('Calculator initialized');
  
  // Set up form elements
  const form = document.getElementById('calculator-form');
  if (form) {
    createFormInputs(form);
    form.addEventListener('submit', handleFormSubmit);
  }
}

/**
 * Create form inputs
 * @param {HTMLFormElement} form - The form element
 */
function createFormInputs(form) {
  const inputs = [
    { id: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1', required: true },
    { id: 'humidity', label: 'Relative Humidity (%)', type: 'number', min: '0', max: '100', required: true },
    { id: 'wind-speed', label: 'Wind Speed (m/s)', type: 'number', step: '0.1', required: true },
    { id: 'solar-radiation', label: 'Solar Radiation (MJ/m²/day)', type: 'number', step: '0.1', required: true },
    { id: 'latitude', label: 'Latitude', type: 'number', step: '0.000001', required: true },
    { id: 'elevation', label: 'Elevation (m)', type: 'number', required: true },
    { id: 'crop-coefficient', label: 'Crop Coefficient (Kc)', type: 'number', step: '0.01', required: true },
  ];
  
  inputs.forEach(input => {
    const div = document.createElement('div');
    div.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = input.label;
    
    const inputElement = document.createElement('input');
    inputElement.id = input.id;
    inputElement.name = input.id;
    inputElement.type = input.type;
    if (input.step) inputElement.step = input.step;
    if (input.min) inputElement.min = input.min;
    if (input.max) inputElement.max = input.max;
    if (input.required) inputElement.required = true;
    
    div.appendChild(label);
    div.appendChild(inputElement);
    form.appendChild(div);
  });
  
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Calculate';
  submitButton.className = 'calculate-button';
  form.appendChild(submitButton);
}

/**
 * Handle form submission
 * @param {Event} event - The form submission event
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  
  // Convert string values to numbers
  Object.keys(data).forEach(key => {
    data[key] = parseFloat(data[key]);
  });
  
  // Calculate evapotranspiration
  const result = calculateEvapotranspiration(data);
  
  // Display results
  displayResults(result);
}

/**
 * Calculate evapotranspiration
 * @param {Object} data - The input data
 * @returns {Object} - The calculation results
 */
function calculateEvapotranspiration(data) {
  // Placeholder for actual calculation
  // This would be replaced with the actual FAO Penman-Monteith equation
  
  const et0 = 0.0023 * (data.temperature + 17.8) * Math.sqrt(data['solar-radiation']) * 0.408;
  const etc = et0 * data['crop-coefficient'];
  
  return {
    et0: et0.toFixed(2),
    etc: etc.toFixed(2),
    timestamp: new Date().toISOString()
  };
}

/**
 * Display calculation results
 * @param {Object} result - The calculation results
 */
function displayResults(result) {
  const resultsDisplay = document.getElementById('results-display');
  if (!resultsDisplay) return;
  
  resultsDisplay.innerHTML = `
    <div class="result-item">
      <span class="result-label">Reference ET (ET₀):</span>
      <span class="result-value">${result.et0} mm/day</span>
    </div>
    <div class="result-item">
      <span class="result-label">Crop ET (ETc):</span>
      <span class="result-value">${result.etc} mm/day</span>
    </div>
    <div class="result-timestamp">
      Calculated at: ${new Date(result.timestamp).toLocaleString()}
    </div>
  `;
}