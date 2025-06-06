import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

// Firebase config - you should replace this with your actual config
const firebaseConfig = {
  // Your Firebase config here
  // This would normally be imported from your config file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixNotificationIds() {
  try {
    console.log('🔧 Starting notification ID fix...');
    
    // Get all notifications from the database
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    let totalCount = 0;
    let fixedCount = 0;
    
    console.log(`📊 Found ${snapshot.size} notifications to check`);
    
    // Process each notification
    for (const docSnapshot of snapshot.docs) {
      totalCount++;
      const data = docSnapshot.data();
      
      // Check if the document has an 'id' field set to null
      if (data.hasOwnProperty('id') && data.id === null) {
        console.log(`🔧 Fixing notification ${docSnapshot.id} with null id field`);
        
        // Create a copy of the data without the 'id' field
        const { id, ...cleanData } = data;
        
        // Update the document to remove the 'id' field
        await updateDoc(doc(db, 'notifications', docSnapshot.id), cleanData);
        
        fixedCount++;
        console.log(`✅ Fixed notification ${docSnapshot.id}`);
      }
    }
    
    console.log(`✅ Notification ID fix completed!`);
    console.log(`📊 Total notifications checked: ${totalCount}`);
    console.log(`🔧 Notifications fixed: ${fixedCount}`);
    console.log(`✨ Notifications already clean: ${totalCount - fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing notification IDs:', error);
  }
}

// Run the fix if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixNotificationIds()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { fixNotificationIds }; 