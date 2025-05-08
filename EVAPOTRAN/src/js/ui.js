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