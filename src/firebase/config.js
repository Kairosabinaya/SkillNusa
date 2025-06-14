import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase configuration object built from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  // appId is optional - include if available
  ...(process.env.REACT_APP_FIREBASE_APP_ID && {
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  }),
  // measurementId is optional - only include if Google Analytics is enabled
  ...(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  })
};

// Validate required configuration
const requiredConfigs = ['apiKey', 'authDomain', 'projectId'];
const missingConfigs = requiredConfigs.filter(field => !firebaseConfig[field]);

if (missingConfigs.length > 0) {
  console.error(`Missing required Firebase config: ${missingConfigs.join(', ')}`);
  console.error('Make sure you have the following environment variables set:');
  console.error('  REACT_APP_FIREBASE_API_KEY');
  console.error('  REACT_APP_FIREBASE_AUTH_DOMAIN'); 
  console.error('  REACT_APP_FIREBASE_PROJECT_ID');
  console.error('  REACT_APP_FIREBASE_STORAGE_BUCKET');
  console.error('  REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
  console.error('  REACT_APP_FIREBASE_APP_ID (optional but recommended)');
  throw new Error(`Firebase initialization failed due to missing config: ${missingConfigs.join(', ')}`);
}

let app;
let auth;
let db;
let storage;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('[Firebase] Initialized successfully!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw new Error("Firebase initialization failed. Check your configuration.");
}

export { auth, db, storage };