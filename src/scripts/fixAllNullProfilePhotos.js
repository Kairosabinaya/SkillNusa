/**
 * Standalone script to fix all users with null profile photos
 * Run this script when you need to perform mass fix of profile photos
 * 
 * Usage: node src/scripts/fixAllNullProfilePhotos.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your main firebase config
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_PROFILE_PHOTO = '/images/default-profile.jpg';

/**
 * Check if profile photo URL is valid
 */
const isValidProfilePhoto = (profilePhoto) => {
  return profilePhoto && 
         profilePhoto !== null && 
         profilePhoto !== '' && 
         profilePhoto !== 'null' && 
         profilePhoto !== 'undefined';
};

/**
 * Fix all users with null profile photos
 */
async function fixAllNullProfilePhotos() {
  console.log('🚀 Starting mass fix for null profile photos...');
  
  try {
    // Get all users
    console.log('📋 Fetching all users from database...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    let totalUsers = 0;
    let usersToFix = [];
    
    // Identify users with null profile photos
    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      totalUsers++;
      
      if (!isValidProfilePhoto(userData.profilePhoto)) {
        usersToFix.push({
          id: userDoc.id,
          displayName: userData.displayName || userData.username || userData.email,
          currentPhoto: userData.profilePhoto
        });
      }
    });
    
    console.log(`📊 Analysis complete:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users needing fix: ${usersToFix.length}`);
    
    if (usersToFix.length === 0) {
      console.log('✅ All users already have valid profile photos!');
      return;
    }
    
    console.log(`🔧 Starting to fix ${usersToFix.length} users...`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    // Process users in batches to avoid overwhelming Firebase
    const batchSize = 10;
    for (let i = 0; i < usersToFix.length; i += batchSize) {
      const batch = usersToFix.slice(i, i + batchSize);
      
      console.log(`🔧 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(usersToFix.length/batchSize)} (${batch.length} users)`);
      
      // Process batch in parallel
      const promises = batch.map(async (user) => {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            profilePhoto: DEFAULT_PROFILE_PHOTO,
            updatedAt: serverTimestamp()
          });
          
          fixedCount++;
          console.log(`   ✅ Fixed: ${user.displayName} (${user.id})`);
          return true;
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Error fixing ${user.displayName} (${user.id}):`, error.message);
          return false;
        }
      });
      
      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < usersToFix.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('\n🏁 Mass fix completed!');
    console.log(`📊 Results:`);
    console.log(`   Successfully fixed: ${fixedCount}/${usersToFix.length} users`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Success rate: ${Math.round((fixedCount / usersToFix.length) * 100)}%`);
    
    if (fixedCount > 0) {
      console.log(`✅ ${fixedCount} users now have default profile photo: ${DEFAULT_PROFILE_PHOTO}`);
    }
    
  } catch (error) {
    console.error('❌ Critical error during mass fix:', error);
  }
}

// Run the script
if (require.main === module) {
  fixAllNullProfilePhotos()
    .then(() => {
      console.log('\n🎉 Script execution completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  fixAllNullProfilePhotos,
  isValidProfilePhoto,
  DEFAULT_PROFILE_PHOTO
}; 