/**
 * GameHub - Firebase Configuration
 * Initializes Firebase application with authentication and Firestore
 * All Firebase SDKs must be loaded from CDN before this script executes
 * 
 * Required CDN scripts (must be in HTML before this file):
 * - firebase-app-compat.js
 * - firebase-auth-compat.js
 * - firebase-firestore-compat.js
 */

'use strict';

// ===== PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO =====
if (typeof window.firebaseConfigLoaded !== 'undefined') {
  console.warn('⚠️ firebase-config.js já foi carregado. Ignorando duplicata.');
} else {
  
// Check if Firebase is available
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase SDK not loaded! Check if CDN scripts are included in HTML.');
}

/**
 * Firebase Configuration Object
 * Replace with your actual Firebase project credentials
 * Get these values from Firebase Console: https://console.firebase.google.com/
 */
window.firebaseConfigLoaded = true;
const firebaseConfig = {
  apiKey: 'AIzaSyA7UzLE9eO-Zas3n5fgEv8sQmHOuclwg3Q',
  authDomain: 'gamehub-web-8c78c.firebaseapp.com',
  projectId: 'gamehub-web-8c78c',
  storageBucket: 'gamehub-web-8c78c.firebasestorage.app',
  messagingSenderId: '72140954640',
  appId: '1:72140954640:web:29c9662a447659cbf73e95',
  measurementId: 'G-237ZJ8KN79',
};

/**
 * Initialize Firebase Application
 */
let firebaseApp;
try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

/**
 * Get Firebase Authentication Instance
 */
const firebaseAuth = firebase.auth();

/**
 * Get Firestore Database Instance
 */
const firebaseDb = firebase.firestore();

/**
 * Configure Firestore Settings (optional but recommended)
 */
try {
  firebaseDb.settings({
    persistence: firebase.firestore.enableIndexedDbPersistence,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });
  console.log('✅ Firestore persistence enabled');
} catch (error) {
  if (error.code === 'failed-precondition') {
    console.warn('⚠️ Firestore: Multiple tabs open, persistence disabled');
  } else if (error.code === 'unimplemented') {
    console.warn('⚠️ Firestore: Browser does not support persistence');
  } else {
    console.warn('⚠️ Firestore persistence warning:', error.message);
  }
}

/**
 * Export Firebase instances for use in other modules
 */
window.firebaseApp = firebaseApp;
window.firebaseAuth = firebaseAuth;
window.firebaseDb = firebaseDb;

/**
 * Firebase Authentication State Observer
 * Runs when user login/logout status changes
 */
firebaseAuth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ User authenticated:', user.email);
    // Dispatch custom event for other scripts to listen to
    window.dispatchEvent(new CustomEvent('firebase-user-logged-in', { detail: user }));
  } else {
    console.log('ℹ️ No user authenticated');
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('firebase-user-logged-out'));
  }
});

/**
 * Firestore Connection State Observer
 */
// Note: Firestore connection state is monitored via auth state changes
// Direct onSnapshot listeners will be added per-collection as needed

/**
 * Helper Functions for Firebase Operations
 */

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
window.firebaseLogin = async (email, password) => {
  try {
    const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
    console.log('✅ Login successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
};

/**
 * Register new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
window.firebaseRegister = async (email, password) => {
  try {
    const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    console.log('✅ Registration successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    throw error;
  }
};

/**
 * Logout current user
 * @returns {Promise<void>}
 */
window.firebaseLogout = async () => {
  try {
    await firebaseAuth.signOut();
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    throw error;
  }
};

/**
 * Get currently authenticated user
 * @returns {firebase.User|null}
 */
window.getCurrentUser = () => {
  return firebaseAuth.currentUser;
};

/**
 * Get current user ID token
 * @returns {Promise<string>}
 */
window.getUserToken = async () => {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return await user.getIdToken();
};

/**
 * Set user presence status
 * @param {string} status - 'online' or 'offline'
 */
window.setUserPresence = async (status) => {
  const user = firebaseAuth.currentUser;
  if (!user) return;

  try {
    const userRef = firebaseDb.collection('users').doc(user.uid);
    await userRef.set(
      {
        presence: status,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ User presence set to: ${status}`);
  } catch (error) {
    console.error('❌ Error setting presence:', error.message);
  }
};

/**
 * Get data from Firestore collection
 * @param {string} collectionName - Collection name
 * @returns {Promise<Array>}
 */
window.getFirestoreCollection = async (collectionName) => {
  try {
    const snapshot = await firebaseDb.collection(collectionName).get();
    const data = [];
    snapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Add document to Firestore collection
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @returns {Promise<string>} - Document ID
 */
window.addFirestoreDocument = async (collectionName, data) => {
  try {
    const docRef = await firebaseDb.collection(collectionName).add(data);
    console.log(`✅ Document added to ${collectionName}:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error adding document to ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Update document in Firestore collection
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Update data
 * @returns {Promise<void>}
 */
window.updateFirestoreDocument = async (collectionName, docId, data) => {
  try {
    await firebaseDb.collection(collectionName).doc(docId).update(data);
    console.log(`✅ Document updated in ${collectionName}:`, docId);
  } catch (error) {
    console.error(`❌ Error updating document in ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Delete document from Firestore collection
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
window.deleteFirestoreDocument = async (collectionName, docId) => {
  try {
    await firebaseDb.collection(collectionName).doc(docId).delete();
    console.log(`✅ Document deleted from ${collectionName}:`, docId);
  } catch (error) {
    console.error(`❌ Error deleting document from ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Listen to real-time updates from Firestore collection
 * @param {string} collectionName - Collection name
 * @param {Function} onSnapshot - Callback function
 * @returns {Function} - Unsubscribe function
 */
window.onFirestoreCollectionChange = (collectionName, onSnapshot) => {
  return firebaseDb.collection(collectionName).onSnapshot(
    (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      onSnapshot(data);
    },
    (error) => {
      console.error(`❌ Error listening to ${collectionName}:`, error.message);
    }
  );
};

console.log('✅ Firebase Config loaded - All functions available');

} // Fim da proteção contra carregamento duplicado
