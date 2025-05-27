const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const userDeletionService = require('../services/userDeletionService');

// Initialize Firebase (use your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Run orphaned data cleanup
 */
async function runOrphanedDataCleanup() {
  console.log('🧹 Starting orphaned data cleanup...');
  console.log('=====================================');
  
  try {
    const result = await userDeletionService.default.cleanupOrphanedData();
    
    console.log('\n📊 Cleanup Results:');
    console.log('==================');
    
    if (result.success) {
      console.log('✅ Cleanup completed successfully!');
      
      if (result.deletedData.length > 0) {
        console.log(`\n🗑️  Deleted ${result.deletedData.length} orphaned documents:`);
        
        // Group by collection for better reporting
        const deletedByCollection = {};
        result.deletedData.forEach(item => {
          if (!deletedByCollection[item.collection]) {
            deletedByCollection[item.collection] = 0;
          }
          deletedByCollection[item.collection]++;
        });
        
        Object.entries(deletedByCollection).forEach(([collection, count]) => {
          console.log(`   - ${collection}: ${count} documents`);
        });
      } else {
        console.log('🎉 No orphaned data found! Database is clean.');
      }
      
      if (result.errors.length > 0) {
        console.log(`\n⚠️  ${result.errors.length} warnings/errors occurred:`);
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.operation}: ${error.error}`);
        });
      }
      
    } else {
      console.log('❌ Cleanup failed!');
      console.log('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('💥 Critical error during cleanup:', error);
    process.exit(1);
  }
  
  console.log('\n🏁 Cleanup process completed.');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  console.log('🔧 Environment check...');
  if (!process.env.REACT_APP_FIREBASE_PROJECT_ID) {
    console.error('❌ Firebase configuration missing! Please check your .env file.');
    process.exit(1);
  }
  
  runOrphanedDataCleanup();
}

module.exports = { runOrphanedDataCleanup }; 