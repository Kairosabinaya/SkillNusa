/**
 * Script to update all users with NULL profilePhoto to use default profile image
 * Run this script to apply default profile photos to existing users
 */

import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { COLLECTIONS } from '../utils/constants.js';

// Default profile photo path
const DEFAULT_PROFILE_PHOTO = '/images/default-profile.jpg';

/**
 * Update users with NULL profilePhoto to use default image
 */
async function updateDefaultProfilePhotos() {
  console.log('🚀 Starting default profile photo update process...');
  
  try {
    // Get all users from the database
    const usersQuery = collection(db, COLLECTIONS.USERS);
    const usersSnapshot = await getDocs(usersQuery);
    
    console.log(`📊 Found ${usersSnapshot.size} total users in database`);
    
    // Filter users with NULL or empty profilePhoto
    const usersToUpdate = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.profilePhoto || userData.profilePhoto === null || userData.profilePhoto === '') {
        usersToUpdate.push({
          id: doc.id,
          displayName: userData.displayName || userData.email || 'Unknown User'
        });
      }
    });
    
    console.log(`🔍 Found ${usersToUpdate.length} users with NULL profilePhoto`);
    
    if (usersToUpdate.length === 0) {
      console.log('✅ No users need updating. All users already have profile photos.');
      return;
    }
    
    // Update in batches to avoid hitting Firestore limits
    const batchSize = 500; // Firestore batch limit
    const totalBatches = Math.ceil(usersToUpdate.length / batchSize);
    
    console.log(`📦 Processing in ${totalBatches} batch(es)...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = writeBatch(db);
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, usersToUpdate.length);
      const currentBatch = usersToUpdate.slice(startIndex, endIndex);
      
      console.log(`⏳ Processing batch ${i + 1}/${totalBatches} (${currentBatch.length} users)...`);
      
      // Add updates to batch
      currentBatch.forEach((user) => {
        const userRef = doc(db, COLLECTIONS.USERS, user.id);
        batch.update(userRef, {
          profilePhoto: DEFAULT_PROFILE_PHOTO,
          updatedAt: new Date()
        });
      });
      
      try {
        // Execute batch
        await batch.commit();
        updatedCount += currentBatch.length;
        console.log(`✅ Batch ${i + 1} completed successfully (${currentBatch.length} users updated)`);
        
        // Log some user names for verification
        if (currentBatch.length <= 5) {
          currentBatch.forEach(user => {
            console.log(`   📝 Updated: ${user.displayName} (${user.id})`);
          });
        } else {
          console.log(`   📝 Updated users including: ${currentBatch.slice(0, 3).map(u => u.displayName).join(', ')} and ${currentBatch.length - 3} others`);
        }
        
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error);
        errorCount += currentBatch.length;
      }
      
      // Add small delay between batches to avoid overwhelming Firestore
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);
    console.log(`📊 Total processed: ${usersToUpdate.length} users`);
    console.log(`🖼️ Default image path: ${DEFAULT_PROFILE_PHOTO}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Default profile photo update completed successfully!');
      console.log('💡 All users with NULL profilePhoto now have the default profile image.');
    }
    
  } catch (error) {
    console.error('💥 Error during default profile photo update:', error);
    throw error;
  }
}

/**
 * Verify the update by checking users
 */
async function verifyUpdate() {
  console.log('\n🔍 Verifying update...');
  
  try {
    const usersQuery = collection(db, COLLECTIONS.USERS);
    const usersSnapshot = await getDocs(usersQuery);
    
    let totalUsers = 0;
    let usersWithDefaultPhoto = 0;
    let usersWithCustomPhoto = 0;
    let usersWithNullPhoto = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      totalUsers++;
      
      if (!userData.profilePhoto || userData.profilePhoto === null || userData.profilePhoto === '') {
        usersWithNullPhoto++;
      } else if (userData.profilePhoto === DEFAULT_PROFILE_PHOTO) {
        usersWithDefaultPhoto++;
      } else {
        usersWithCustomPhoto++;
      }
    });
    
    console.log('\n📊 Verification Results:');
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`🖼️ Users with default photo: ${usersWithDefaultPhoto}`);
    console.log(`📷 Users with custom photo: ${usersWithCustomPhoto}`);
    console.log(`❌ Users with NULL photo: ${usersWithNullPhoto}`);
    
    if (usersWithNullPhoto === 0) {
      console.log('✅ Verification successful! No users have NULL profile photos.');
    } else {
      console.log(`⚠️ Warning: ${usersWithNullPhoto} users still have NULL profile photos.`);
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

/**
 * Main function to run the update
 */
export async function runDefaultProfilePhotoUpdate() {
  try {
    await updateDefaultProfilePhotos();
    await verifyUpdate();
  } catch (error) {
    console.error('Script execution failed:', error);
  }
}

// Export for use in other modules
export { updateDefaultProfilePhotos, verifyUpdate, DEFAULT_PROFILE_PHOTO };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDefaultProfilePhotoUpdate().then(() => {
    console.log('\n🏁 Script execution completed.');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Script execution failed:', error);
    process.exit(1);
  });
} 