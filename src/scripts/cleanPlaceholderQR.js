/**
 * Script to clean up orders with placeholder QR strings
 * This will allow the system to generate new valid payment data
 */

import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

const cleanPlaceholderQR = async () => {
  try {
    console.log('🧹 Starting cleanup of placeholder QR codes...');
    
    // Query orders with payment status that might have placeholder QR
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'payment'));
    
    const querySnapshot = await getDocs(q);
    let cleanedCount = 0;
    let totalChecked = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const order = { id: docSnapshot.id, ...docSnapshot.data() };
      totalChecked++;
      
      // Check if QR string is a placeholder
      if (order.qrString) {
        const isPlaceholder = order.qrString.length < 50 && 
                             (order.qrString.includes('SANDBOX') || 
                              order.qrString.includes('MODE') ||
                              !order.qrString.includes('<'));
        
        if (isPlaceholder) {
          console.log(`🔧 Cleaning placeholder QR for order: ${order.id}`);
          console.log(`   Current QR: "${order.qrString}"`);
          
          // Clear payment data to force new payment creation
          await updateDoc(doc(db, 'orders', order.id), {
            qrString: null,
            qrUrl: null,
            paymentUrl: null,
            paymentExpiredAt: null,
            merchantRef: null,
            reference: null,
            instructions: null
          });
          
          cleanedCount++;
          console.log(`✅ Cleaned order: ${order.id}`);
        }
      }
    }
    
    console.log(`🎉 Cleanup completed!`);
    console.log(`   Total orders checked: ${totalChecked}`);
    console.log(`   Orders cleaned: ${cleanedCount}`);
    console.log(`   Orders with valid QR: ${totalChecked - cleanedCount}`);
    
    if (cleanedCount > 0) {
      console.log('');
      console.log('📝 Next steps:');
      console.log('1. Refresh the transactions page');
      console.log('2. Click "Bayar" on any cleaned order');
      console.log('3. New payment data with valid QR will be generated');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Export for use in browser console or as module
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for console access
  window.cleanPlaceholderQR = cleanPlaceholderQR;
  console.log('🔧 Cleanup function available as: window.cleanPlaceholderQR()');
} else {
  // Node environment - run directly
  cleanPlaceholderQR();
}

export default cleanPlaceholderQR; 