/**
 * IndexedDB Storage Module
 * Handles persistent storage for the application
 */

// Database configuration
const dbName = 'evapotranDB';
const dbVersion = 1;
const calculationStore = 'calculations';
const epwStore = 'epwFiles';
const weatherStore = 'weatherData';
const locationHistoryStore = 'locationHistory';

// Open or create the database
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(calculationStore)) {
        db.createObjectStore(calculationStore, { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains(epwStore)) {
        db.createObjectStore(epwStore, { keyPath: 'fileName' });
      }
      
      if (!db.objectStoreNames.contains(weatherStore)) {
        db.createObjectStore(weatherStore, { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains(locationHistoryStore)) {
        const store = db.createObjectStore(locationHistoryStore, { keyPath: 'timestamp' });
        store.createIndex('name', 'name', { unique: false });
      }
    };
    
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    
    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

// Store weather data
async function storeWeatherData(data) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([weatherStore], 'readwrite');
    const store = transaction.objectStore(weatherStore);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error storing weather data:', error);
    return Promise.reject(error);
  }
}

// Get weather data
async function getWeatherData(key) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([weatherStore], 'readonly');
    const store = transaction.objectStore(weatherStore);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error retrieving weather data:', error);
    return Promise.reject(error);
  }
}

// Store calculation result
async function storeCalculationResult(data) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([calculationStore], 'readwrite');
    const store = transaction.objectStore(calculationStore);
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(true);
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error storing calculation result:', error);
    return Promise.reject(error);
  }
}

// Get recent calculations
async function getRecentCalculations(limit = 10) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([calculationStore], 'readonly');
    const store = transaction.objectStore(calculationStore);
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor(null, 'prev');
      const results = [];
      
      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = event => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error retrieving recent calculations:', error);
    return Promise.reject(error);
  }
}

// Export functions
export {
  openDatabase,
  storeCalculationResult,
  getRecentCalculations,
  storeWeatherData,
  getWeatherData
};

