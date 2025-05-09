/* Main styles for EVAPOTRAN */

:root {
  --primary-color: #2c8c99;
  --secondary-color: #42a5b3;
  --accent-color: #f0c808;
  --text-color: #333;
  --background-color: #f9f9f9;
  --card-background: #fff;
  --border-color: #ddd;
  --success-color: #4caf50;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --info-color: #2196f3;
}

/* Dark mode variables */
.dark-mode {
  --primary-color: #42a5b3;
  --secondary-color: #2c8c99;
  --accent-color: #f0c808;
  --text-color: #f9f9f9;
  --background-color: #222;
  --card-background: #333;
  --border-color: #444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  transition: background-color 0.3s ease;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

header h1 {
  color: var(--primary-color);
  font-size: 2.5rem;
  margin-bottom: 10px;
}

header p {
  color: var(--secondary-color);
  font-size: 1.2rem;
}

main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

#calculator-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 76
// UI module for EVAPOTRAN

/**
 * Set up the user interface
 */
export function setupUI() {
  console.log('UI setup initialized');
  
  // Add event listeners
  setupEventListeners();
  
  // Initialize any UI components
  initializeUIComponents();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Example: Toggle dark mode
  const darkModeToggle = document.createElement('button');
  darkModeToggle.id = 'dark-mode-toggle';
  darkModeToggle.textContent = '🌙';
  darkModeToggle.className = 'dark-mode-toggle';
  darkModeToggle.title = 'Toggle dark mode';
  
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });
  
  // Add the button to the header
  const header = document.querySelector('header');
  if (header) {
    header.appendChild(darkModeToggle);
  }
}

/**
 * Initialize UI components
 */
function initializeUIComponents() {
  // Add a loading indicator
  const app = document.getElementById('app');
  if (app) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'loading-indicator hidden';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
    app.appendChild(loadingIndicator);
  }
  
  // Add a notification system
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'notification-container';
  notificationContainer.className = 'notification-container';
  document.body.appendChild(notificationContainer);
  
  // Example notification
  showNotification('EVAPOTRAN calculator loaded successfully', 'success');
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      container.removeChild(notification);
    }, 500);
  }, 5000);
}


