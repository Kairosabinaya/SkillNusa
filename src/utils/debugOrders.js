import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Debug utility to help troubleshoot order display issues
 */
export const debugFreelancerOrders = async () => {
  const currentUser = auth.currentUser;
  
  console.group('🔍 DEBUG: Freelancer Orders Investigation');
  
  // Check current user
  console.log('1. Current User Info:');
  console.log('   - User authenticated:', !!currentUser);
  console.log('   - User ID (currentUser.uid):', currentUser?.uid);
  console.log('   - User email:', currentUser?.email);
  console.log('   - User display name:', currentUser?.displayName);
  
  if (!currentUser) {
    console.log('❌ No authenticated user found. Please log in first.');
    console.groupEnd();
    return;
  }
  
  try {
    // Check all orders in the collection
    console.log('\n2. All Orders in Database:');
    const allOrdersQuery = query(collection(db, 'orders'));
    const allOrdersSnapshot = await getDocs(allOrdersQuery);
    
    console.log('   - Total orders in database:', allOrdersSnapshot.size);
    
    const allOrders = [];
    allOrdersSnapshot.forEach(doc => {
      const data = doc.data();
      allOrders.push({
        id: doc.id,
        freelancerId: data.freelancerId,
        clientId: data.clientId,
        title: data.title,
        status: data.status,
        orderNumber: data.orderNumber
      });
    });
    
    console.table(allOrders);
    
    // Check orders by freelancerId
    console.log('\n3. Orders by freelancerId field:');
    const freelancerOrdersQuery = query(
      collection(db, 'orders'),
      where('freelancerId', '==', currentUser.uid)
    );
    const freelancerOrdersSnapshot = await getDocs(freelancerOrdersQuery);
    
    console.log('   - Orders matching current user ID as freelancerId:', freelancerOrdersSnapshot.size);
    
    const freelancerOrders = [];
    freelancerOrdersSnapshot.forEach(doc => {
      const data = doc.data();
      freelancerOrders.push({
        id: doc.id,
        title: data.title,
        status: data.status,
        freelancerId: data.freelancerId,
        clientId: data.clientId
      });
    });
    
    if (freelancerOrders.length > 0) {
      console.table(freelancerOrders);
    } else {
      console.log('   - No orders found with freelancerId matching current user');
    }
    
    // Check if current user is listed as freelancer in any order
    console.log('\n4. Orders where current user appears as freelancerId:');
    const ordersWithCurrentUserAsFreelancer = allOrders.filter(order => 
      order.freelancerId === currentUser.uid
    );
    
    console.log('   - Orders with current user as freelancer:', ordersWithCurrentUserAsFreelancer.length);
    if (ordersWithCurrentUserAsFreelancer.length > 0) {
      console.table(ordersWithCurrentUserAsFreelancer);
    }
    
    // Check orders where user might be stored with a different field
    console.log('\n5. Checking for alternative field names:');
    const potentialMatches = allOrders.filter(order => 
      order.clientId === currentUser.uid || 
      order.freelancerId === currentUser.uid
    );
    
    console.log('   - Orders where current user appears (any field):', potentialMatches.length);
    if (potentialMatches.length > 0) {
      console.table(potentialMatches);
    }
    
    // User role check
    console.log('\n6. User Profile Check:');
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', currentUser.uid)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.size > 0) {
        const userData = userSnapshot.docs[0].data();
        console.log('   - User profile found:', !!userData);
        console.log('   - User roles:', userData.roles);
        console.log('   - Is freelancer:', userData.isFreelancer);
        console.log('   - Display name:', userData.displayName);
      } else {
        console.log('   - No user profile found in users collection');
      }
    } catch (error) {
      console.error('   - Error fetching user profile:', error);
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   - Current user ID: ${currentUser.uid}`);
    console.log(`   - Total orders in DB: ${allOrders.length}`);
    console.log(`   - Orders as freelancer: ${ordersWithCurrentUserAsFreelancer.length}`);
    console.log(`   - Orders as client or freelancer: ${potentialMatches.length}`);
    
    if (ordersWithCurrentUserAsFreelancer.length === 0 && potentialMatches.length > 0) {
      console.log('⚠️  POTENTIAL ISSUE: User appears in orders but not as freelancer');
      console.log('    Check if you are logged in with the correct account');
    }
    
    if (ordersWithCurrentUserAsFreelancer.length === 0 && potentialMatches.length === 0) {
      console.log('❌ ISSUE: Current user does not appear in any orders');
      console.log('    Either no orders exist for this user, or there is a data mismatch');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
  
  console.groupEnd();
};

// Helper to check specific order by ID
export const debugSpecificOrder = async (orderId) => {
  try {
    const orderDoc = await getDocs(query(
      collection(db, 'orders'),
      where('__name__', '==', orderId)
    ));
    
    if (orderDoc.size > 0) {
      const orderData = orderDoc.docs[0].data();
      console.log('📋 Order Details:', {
        id: orderId,
        freelancerId: orderData.freelancerId,
        clientId: orderData.clientId,
        title: orderData.title,
        status: orderData.status,
        createdAt: orderData.createdAt,
        currentUserMatches: {
          asFreelancer: orderData.freelancerId === auth.currentUser?.uid,
          asClient: orderData.clientId === auth.currentUser?.uid
        }
      });
    } else {
      console.log('❌ Order not found:', orderId);
    }
  } catch (error) {
    console.error('❌ Error fetching order:', error);
  }
};

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugFreelancerOrders = debugFreelancerOrders;
  window.debugSpecificOrder = debugSpecificOrder;
}

export default {
  debugFreelancerOrders,
  debugSpecificOrder
}; 