import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Fix existing notifications that have null ID fields
 * This removes the unnecessary 'id' field from notification documents
 */
export async function fixNotificationIds() {
  try {
    console.log('🔧 [FixNotifications] Starting notification ID fix...');
    
    // Get all notifications from the database
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    let totalCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    console.log(`📊 [FixNotifications] Found ${snapshot.size} notifications to check`);
    
    // Process each notification
    for (const docSnapshot of snapshot.docs) {
      totalCount++;
      
      try {
        const data = docSnapshot.data();
        
        // Check if the document has an 'id' field (it shouldn't)
        if (data.hasOwnProperty('id')) {
          console.log(`🔧 [FixNotifications] Fixing notification ${docSnapshot.id} - removing 'id' field with value:`, data.id);
          
          // Create a copy of the data without the 'id' field
          const { id, ...cleanData } = data;
          
          // Update the document to remove the 'id' field
          await updateDoc(doc(db, 'notifications', docSnapshot.id), cleanData);
          
          fixedCount++;
          console.log(`✅ [FixNotifications] Fixed notification ${docSnapshot.id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ [FixNotifications] Error fixing notification ${docSnapshot.id}:`, error);
      }
      
      // Add a small delay to avoid overwhelming Firestore
      if (totalCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const results = {
      totalChecked: totalCount,
      fixed: fixedCount,
      errors: errorCount,
      alreadyClean: totalCount - fixedCount - errorCount
    };
    
    console.log(`✅ [FixNotifications] Fix completed!`, results);
    return results;
    
  } catch (error) {
    console.error('❌ [FixNotifications] Error during notification fix:', error);
    throw error;
  }
}

/**
 * Check for notifications with null ID fields without fixing them
 */
export async function checkNotificationIds() {
  try {
    console.log('🔍 [CheckNotifications] Checking notification IDs...');
    
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    let totalCount = 0;
    let nullIdCount = 0;
    const problematicIds = [];
    
    snapshot.forEach(docSnapshot => {
      totalCount++;
      const data = docSnapshot.data();
      
      if (data.hasOwnProperty('id')) {
        nullIdCount++;
        problematicIds.push({
          docId: docSnapshot.id,
          idFieldValue: data.id,
          title: data.title,
          userId: data.userId
        });
      }
    });
    
    const results = {
      totalNotifications: totalCount,
      notificationsWithIdField: nullIdCount,
      cleanNotifications: totalCount - nullIdCount,
      problematicNotifications: problematicIds
    };
    
    console.log('📊 [CheckNotifications] Check results:', results);
    return results;
    
  } catch (error) {
    console.error('❌ [CheckNotifications] Error checking notifications:', error);
    throw error;
  }
} 