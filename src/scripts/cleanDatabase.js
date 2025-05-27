const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  writeBatch,
  query
} = require('firebase/firestore');

// Load environment variables for Node.js execution
const { config } = require('dotenv');
const { readFileSync, existsSync } = require('fs');

// Load environment variables from .env.local or .env
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
} else if (existsSync('.env')) {
  config({ path: '.env' });
}

// Initialize Firebase directly in the script
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate required configuration
const requiredConfigs = ['apiKey', 'authDomain', 'projectId'];
const missingConfigs = requiredConfigs.filter(field => !firebaseConfig[field]);

if (missingConfigs.length > 0) {
  console.error('❌ Missing required Firebase config. Make sure you have a .env file with:');
  console.error('   REACT_APP_FIREBASE_API_KEY');
  console.error('   REACT_APP_FIREBASE_AUTH_DOMAIN');
  console.error('   REACT_APP_FIREBASE_PROJECT_ID');
  console.error('   REACT_APP_FIREBASE_STORAGE_BUCKET');
  console.error('   REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
  console.error('   REACT_APP_FIREBASE_APP_ID');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully!');

/**
 * Database Cleanup and Consistency Fix Script
 * 
 * This script will:
 * 1. Clear all data from collections for fresh testing start
 * 2. Fix collection naming inconsistencies
 * 3. Migrate data from old naming conventions to new ones
 */

// All collection names that exist in your database (both old and new formats)
const ALL_COLLECTIONS = [
  // Current collections (from your database screenshot)
  'chats',
  'clientProfiles',
  'client_profiles',  // Duplicate with different naming
  'favorites',
  'freelancerProfiles',
  'freelancer_profiles',  // Duplicate with different naming
  'gigs',
  'orders',
  'reviews',
  'users',
  
  // Additional collections from your code
  'projects',
  'proposals',
  'messages',
  'conversations',
  'notifications'
];

// Mapping of old collection names to new standardized names
const COLLECTION_MIGRATION_MAP = {
  'client_profiles': 'clientProfiles',
  'freelancer_profiles': 'freelancerProfiles'
};

/**
 * Delete all documents from a collection
 */
async function clearCollection(collectionName) {
  console.log(`🧹 Clearing collection: ${collectionName}`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`   ✓ Collection ${collectionName} is already empty`);
      return 0;
    }

    const batch = writeBatch(db);
    let deleteCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();
    console.log(`   ✓ Deleted ${deleteCount} documents from ${collectionName}`);
    return deleteCount;
    
  } catch (error) {
    console.error(`   ❌ Error clearing collection ${collectionName}:`, error.message);
    return 0;
  }
}

/**
 * Migrate data from old collection naming to new naming
 */
async function migrateCollection(oldName, newName) {
  console.log(`🔄 Migrating data from ${oldName} to ${newName}`);
  
  try {
    const oldCollectionRef = collection(db, oldName);
    const snapshot = await getDocs(oldCollectionRef);
    
    if (snapshot.empty) {
      console.log(`   ✓ No data to migrate from ${oldName}`);
      return;
    }

    const batch = writeBatch(db);
    let migrateCount = 0;

    // Copy data to new collection
    snapshot.docs.forEach((docSnapshot) => {
      const newDocRef = doc(db, newName, docSnapshot.id);
      batch.set(newDocRef, docSnapshot.data());
      migrateCount++;
    });

    await batch.commit();
    console.log(`   ✓ Migrated ${migrateCount} documents from ${oldName} to ${newName}`);

    // Now clear the old collection
    await clearCollection(oldName);
    console.log(`   ✓ Cleaned up old collection ${oldName}`);
    
  } catch (error) {
    console.error(`   ❌ Error migrating from ${oldName} to ${newName}:`, error.message);
  }
}

/**
 * Check if collection exists and has documents
 */
async function collectionExists(collectionName) {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(query(collectionRef));
    return !snapshot.empty;
  } catch (error) {
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanDatabase(options = {}) {
  const {
    clearAllData = false,
    fixNamingOnly = false,
    preserveUsers = false
  } = options;

  console.log('🚀 Starting database cleanup and consistency fix...\n');

  let totalDeleted = 0;

  try {
    if (fixNamingOnly) {
      console.log('📋 MODE: Fixing naming inconsistencies only\n');
      
      // First, migrate data from old naming to new naming
      for (const [oldName, newName] of Object.entries(COLLECTION_MIGRATION_MAP)) {
        const oldExists = await collectionExists(oldName);
        if (oldExists) {
          await migrateCollection(oldName, newName);
        }
      }
      
    } else if (clearAllData) {
      console.log('🗑️  MODE: Clearing all data for fresh start\n');
      
      // Clear all collections
      for (const collectionName of ALL_COLLECTIONS) {
        if (preserveUsers && collectionName === 'users') {
          console.log(`⏭️  Skipping users collection (preserve mode)`);
          continue;
        }
        
        const deleted = await clearCollection(collectionName);
        totalDeleted += deleted;
      }
      
    } else {
      console.log('🔧 MODE: Fix naming and clear duplicates\n');
      
      // First migrate data, then clear old collections
      for (const [oldName, newName] of Object.entries(COLLECTION_MIGRATION_MAP)) {
        const oldExists = await collectionExists(oldName);
        const newExists = await collectionExists(newName);
        
        if (oldExists && newExists) {
          console.log(`⚠️  Both ${oldName} and ${newName} exist. Clearing ${oldName} (assuming ${newName} is primary)`);
          const deleted = await clearCollection(oldName);
          totalDeleted += deleted;
        } else if (oldExists && !newExists) {
          await migrateCollection(oldName, newName);
        }
      }
    }

    console.log('\n✅ Database cleanup completed successfully!');
    if (totalDeleted > 0) {
      console.log(`📊 Total documents deleted: ${totalDeleted}`);
    }
    console.log('\n📝 Recommended collection structure:');
    console.log('   • users (user accounts)');
    console.log('   • clientProfiles (client profile data)');
    console.log('   • freelancerProfiles (freelancer profile data)');
    console.log('   • projects, proposals, gigs, orders, reviews');
    console.log('   • chats, messages, conversations');
    console.log('   • favorites, notifications');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
}

/**
 * Quick clean - removes all data except users
 */
async function quickClean() {
  return cleanDatabase({ 
    clearAllData: true, 
    preserveUsers: true 
  });
}

/**
 * Full clean - removes all data including users  
 */
async function fullClean() {
  return cleanDatabase({ 
    clearAllData: true, 
    preserveUsers: false 
  });
}

/**
 * Fix naming only - migrates data and fixes inconsistencies
 */
async function fixNaming() {
  return cleanDatabase({ 
    fixNamingOnly: true 
  });
}

// Export all functions
module.exports = {
  cleanDatabase,
  quickClean,
  fullClean,
  fixNaming,
  clearCollection,
  migrateCollection,
  collectionExists
}; 