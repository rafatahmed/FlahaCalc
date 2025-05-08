import './styles/main.css';
import { initializeCalculator } from './js/calculator';
import { setupUI } from './js/ui';

document.addEventListener('DOMContentLoaded', () => {
  console.log('EVAPOTRAN application initialized');
  
  // Initialize the calculator
  initializeCalculator();
  
  // Setup the UI
  setupUI();
});

// Export public API
window.EVAPOTRAN = {
  version: '0.2.1',
  calculate: (params) => {
    console.log('Calculating with params:', params);
    // Placeholder for actual calculation
    return {
      et0: 5.2,
      etc: 4.7,
      timestamp: new Date().toISOString()
    };
  }
};