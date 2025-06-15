import { auth } from '../firebase/config';
import orderService from '../services/orderService';
import notificationService from '../services/notificationService';

/**
 * Test script untuk memverifikasi sistem notifikasi
 * Jalankan di browser console: window.testNotifications()
 */
export const testNotifications = async () => {
  try {
    console.log('🧪 [TestNotifications] Starting notification system test...');
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ [TestNotifications] User not authenticated');
      return;
    }
    
    console.log('✅ [TestNotifications] User authenticated:', currentUser.uid);
    
    // Test 1: Create direct notification
    console.log('\n🧪 [TestNotifications] Test 1: Creating direct notification...');
    const directNotification = await notificationService.createNotification({
      userId: currentUser.uid,
      type: 'order_status',
      title: '🧪 Test Notification',
      message: 'This is a test notification to verify the system is working',
      priority: 'high',
      actionUrl: '/notifications'
    });
    
    if (directNotification) {
      console.log('✅ [TestNotifications] Direct notification created:', directNotification);
    } else {
      console.error('❌ [TestNotifications] Failed to create direct notification');
    }
    
    // Test 2: Create order status notification
    console.log('\n🧪 [TestNotifications] Test 2: Creating order status notification...');
    const orderNotification = await notificationService.createOrderStatusNotification(
      'TEST_ORDER_123',
      currentUser.uid,
      'client',
      'delivered',
      { test: true }
    );
    
    if (orderNotification) {
      console.log('✅ [TestNotifications] Order status notification created:', orderNotification);
    } else {
      console.error('❌ [TestNotifications] Failed to create order status notification');
    }
    
    // Test 3: Get notification count
    console.log('\n🧪 [TestNotifications] Test 3: Getting notification count...');
    const unreadCount = await notificationService.getUnreadCount(currentUser.uid);
    console.log('📊 [TestNotifications] Unread notification count:', unreadCount);
    
    // Test 4: Get notification counts by type
    console.log('\n🧪 [TestNotifications] Test 4: Getting notification counts by type...');
    const countsByType = await notificationService.getNotificationCountsByType(currentUser.uid);
    console.log('📊 [TestNotifications] Notification counts by type:', countsByType);
    
    // Test 5: Test orderService notification function
    console.log('\n🧪 [TestNotifications] Test 5: Testing orderService notification function...');
    const orderServiceTest = await orderService.testCreateNotification(currentUser.uid, 'client');
    
    if (orderServiceTest) {
      console.log('✅ [TestNotifications] OrderService notification test passed:', orderServiceTest);
    } else {
      console.error('❌ [TestNotifications] OrderService notification test failed');
    }
    
    console.log('\n✅ [TestNotifications] All tests completed! Check your notifications page to see the test notifications.');
    
    return {
      directNotification,
      orderNotification,
      unreadCount,
      countsByType,
      orderServiceTest
    };
    
  } catch (error) {
    console.error('❌ [TestNotifications] Test failed:', error);
    throw error;
  }
};

// Make function available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testNotifications = testNotifications;
}

export default testNotifications; 