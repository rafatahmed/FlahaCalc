/**
 * IndexedDB Storage Module for EVAPOTRAN
 * Handles efficient storage of calculation results and EPW data
 */

const dbName = 'EVAPOTRAN_DB';
const dbVersion = 1;
const calculationStore = 'calculationResults';
const epwStore = 'epwFiles';

// Open database connection
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
    };
    
    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    
    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

// Store calculation result
async function storeCalculationResult(data) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([calculationStore], 'readwrite');
    const store = transaction.objectStore(calculationStore);
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    
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

// Get recent calculation results
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
    console.error('Error retrieving calculation results:', error);
    return Promise.reject(error);
  }
}

// Export functions
export {
  openDatabase,
  storeCalculationResult,
  getRecentCalculations,
  // Include existing EPW storage functions
};