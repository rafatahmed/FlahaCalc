/**
 * Authentication utilities for EVAPOTRAN
 */

// Base URL for API requests
const API_URL = 'http://localhost:3000/api';

// Storage keys
const TOKEN_KEY = 'flaha_auth_token';
const USER_KEY = 'flaha_user';

/**
 * Register a new user
 * @param {Object} userData - User registration data (email, password, name)
 * @returns {Promise} - Promise with user data and token
 */
async function registerUser(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Save token and user data
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login a user
 * @param {Object} credentials - User login credentials (email, password, rememberMe)
 * @returns {Promise} - Promise with user data and token
 */
async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Save token and user data
    if (credentials.rememberMe) {
      // Use localStorage for persistent storage
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } else {
      // Use sessionStorage for session-only storage
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout the current user
 */
function logoutUser() {
  // Clear both storage types
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  console.log('User logged out successfully');
  
  // Redirect to home page
  window.location.href = 'index.html';
}

/**
 * Get the current authenticated user
 * @returns {Object|null} - User data or null if not authenticated
 */
function getCurrentUser() {
  // Check sessionStorage first, then localStorage
  const userJson = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Check if a user is logged in
 * @returns {Boolean} - True if user is logged in
 */
function isLoggedIn() {
  // Check sessionStorage first, then localStorage
  return !!(sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY));
}

/**
 * Get the authentication token
 * @returns {String|null} - Auth token or null if not logged in
 */
function getAuthToken() {
  // Check sessionStorage first, then localStorage
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the current user from the server (verifies token)
 * @returns {Promise} - Promise with user data
 */
async function fetchCurrentUser() {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token');
    }
    
    const response = await fetch(`${API_URL}/auth/user`, {
      headers: {
        'x-auth-token': token
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      logoutUser();
      throw new Error(data.message || 'Authentication failed');
    }
    
    // Update stored user data
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Fetch user error:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {Object} userData - User data to update (name, currentPassword, newPassword)
 * @returns {Promise} - Promise with updated user data
 */
async function updateProfile(userData) {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    // Update stored user data
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Add a debug function to help troubleshoot
async function testLogin() {
  try {
    console.log('Testing login with admin credentials...');
    const result = await loginUser({
      email: 'admin@example.com',
      password: '123456'
    });
    console.log('Login successful:', result);
    return result;
  } catch (error) {
    console.error('Test login failed:', error);
    throw error;
  }
}

// You can call this function from the browser console for testing
window.testLogin = testLogin;




