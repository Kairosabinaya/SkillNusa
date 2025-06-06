import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import orderService from '../services/orderService';
import subscriptionRegistry from '../utils/subscriptionRegistry';
import subscriptionMonitor from '../utils/subscriptionMonitor';
import { calculateDeadline, calculateOrderStats } from '../utils/orderUtils';

/**
 * Custom hook for managing freelancer orders
 * @param {Object} currentUser - Current authenticated user
 * @param {string} orderId - Optional specific order ID to focus on
 * @returns {Object} Order management state and functions
 */
export const useOrderManagement = (currentUser, orderId = null) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch orders function (fallback for when subscription fails)
  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('🔍 [useOrderManagement] Fetching orders fallback for:', currentUser.uid);
      
      const ordersData = await orderService.getOrdersWithDetails(currentUser.uid, 'freelancer');
      
      console.log('📥 [useOrderManagement] Fallback orders received:', ordersData.length);

      // Calculate stats
      const calculatedStats = calculateOrderStats(ordersData);

      setOrders(ordersData);
      setStats(calculatedStats);
      
      console.log('✅ [useOrderManagement] Fallback orders loaded successfully');
    } catch (error) {
      console.error('💥 [useOrderManagement] Error fetching orders:', error);
      setError('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Handle real-time order updates
  const handleOrdersUpdate = useCallback((ordersData) => {
    console.log('📡 [useOrderManagement] Real-time orders update received:', ordersData.length, 'orders');

    // Track subscription update in monitor
    if (currentUser?.uid) {
      const subscriptionId = `${currentUser.uid}_freelancer_orders_management`;
      subscriptionMonitor.trackSubscriptionUpdate(subscriptionId, ordersData.length);
    }

    // Calculate stats
    const calculatedStats = calculateOrderStats(ordersData);

    setOrders(ordersData);
    setStats(calculatedStats);
    setLoading(false);
    
    console.log('✅ [useOrderManagement] Orders state updated:', ordersData.length, 'orders');
  }, [currentUser?.uid]);

  // Update order status with deadline calculation
  const updateOrderStatus = useCallback(async (orderId, newStatus, message = '') => {
    // Get current order to check status (before try block for error handling access)
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) {
      setError('Pesanan tidak ditemukan');
      return;
    }
    
    try {
      console.log('🔄 [useOrderManagement] updateOrderStatus called:', { 
        orderId, 
        newStatus, 
        message,
        currentUser: currentUser?.uid,
        timestamp: new Date().toISOString()
      });
      
      // Check if status change is needed
      if (currentOrder.status === newStatus) {
        console.log('⚠️ [useOrderManagement] Status sudah sama, skip update:', { currentStatus: currentOrder.status, newStatus });
        return; // Skip update if status is the same
      }

      // Immediately update local state for better UX (optimistic update)
      console.log('🔄 [useOrderManagement] Optimistically updating local state');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, statusMessage: message }
            : order
        )
      );

      // Update selected order if it's the current one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: newStatus, 
          statusMessage: message 
        }));
      }
      
      // If accepting order (pending → active), calculate and set deadline
      if (newStatus === 'active' && currentOrder.status === 'pending') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.gig && order.packageType) {
          const packageData = order.gig.packages[order.packageType];
          if (packageData && packageData.deliveryTime) {
            const confirmationDate = new Date();
            const deadline = calculateDeadline(confirmationDate, packageData.deliveryTime);
            
            console.log('⏰ [useOrderManagement] Setting deadline for order:', {
              orderId,
              deadline: deadline.toISOString(),
              deliveryDays: packageData.deliveryTime
            });
            
            // Use orderService with additional deadline data
            await orderService.updateOrderStatus(orderId, newStatus, currentUser.uid, {
              statusMessage: message,
              deadline: deadline,
              confirmedAt: serverTimestamp()
            });
            
            console.log('✅ [useOrderManagement] Order activated with deadline');
          } else {
            // Fallback to regular update if no package data
            await orderService.updateOrderStatus(orderId, newStatus, currentUser.uid, {
              statusMessage: message
            });
          }
        } else {
          // Fallback to regular update if no order/gig data
          await orderService.updateOrderStatus(orderId, newStatus, currentUser.uid, {
            statusMessage: message
          });
        }
      } else {
        // For all other status updates
        await orderService.updateOrderStatus(orderId, newStatus, currentUser.uid, {
          statusMessage: message
        });
      }
      
      console.log('✅ [useOrderManagement] Status update completed successfully');
      setSuccess('Status pesanan berhasil diupdate');
      
      // Note: No need to manually refresh orders - real-time subscription will handle updates
    } catch (error) {
      console.error('💥 [useOrderManagement] Error updating order status:', error);
      
      // Revert optimistic update on error
      console.log('🔄 [useOrderManagement] Reverting optimistic update due to error');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: currentOrder.status, statusMessage: currentOrder.statusMessage }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: currentOrder.status, 
          statusMessage: currentOrder.statusMessage 
        }));
      }
      
      setError('Gagal mengupdate status pesanan');
    }
  }, [orders, selectedOrder, currentUser]);

  // Deliver order function
  const deliverOrder = useCallback(async (orderId, deliveryMessage, attachedFiles = []) => {
    // Check if order exists and is in deliverable status (before try block for error handling access)
    const currentOrder = orders.find(order => order.id === orderId);
    if (!currentOrder) {
      setError('Pesanan tidak ditemukan');
      return;
    }
    
    if (!['active', 'in_revision'].includes(currentOrder.status)) {
      setError(`Pesanan tidak dapat dikirim. Status saat ini: ${currentOrder.status}`);
      return;
    }

    try {
      console.log('📦 [useOrderManagement] Delivering order:', { orderId, deliveryMessage });

      // Optimistically update local state immediately
      console.log('🔄 [useOrderManagement] Optimistically updating delivery state');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'delivered', deliveryMessage, deliveredAt: new Date() }
            : order
        )
      );

      // Update selected order if it's the current one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: 'delivered', 
          deliveryMessage,
          deliveredAt: new Date()
        }));
      }
      
      // Perform the actual delivery
      await orderService.deliverOrder(orderId, currentUser.uid, {
        message: deliveryMessage,
        files: attachedFiles
      });
      
      console.log('✅ [useOrderManagement] Order delivered successfully');
      setSuccess('Pesanan berhasil dikirim');
      
      // Note: No need to manually refresh orders - real-time subscription will handle updates
    } catch (error) {
      console.error('💥 [useOrderManagement] Error delivering order:', error);
      
      // Revert optimistic update on error
      console.log('🔄 [useOrderManagement] Reverting optimistic delivery update due to error');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: currentOrder.status, deliveryMessage: currentOrder.deliveryMessage, deliveredAt: currentOrder.deliveredAt }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ 
          ...prev, 
          status: currentOrder.status, 
          deliveryMessage: currentOrder.deliveryMessage,
          deliveredAt: currentOrder.deliveredAt
        }));
      }
      
      // Provide more specific error messages
      if (error.message.includes('Cannot deliver order')) {
        setError('Pesanan sudah dikirim atau tidak dalam status aktif');
      } else if (error.message.includes('Invalid status transition')) {
        setError('Status pesanan tidak valid untuk pengiriman');
      } else {
        setError(error.message || 'Gagal mengirim pesanan');
      }
    }
  }, [orders, selectedOrder, currentUser]);

  // Filter orders function
  const filterOrders = useCallback((searchQuery, filterStatus) => {
    return orders.filter(order => {
      const matchesSearch = !searchQuery || 
        order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.client?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Initialize orders with real-time subscription
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const subscriptionType = 'freelancer_orders_management';
    const subscriptionKey = `${currentUser.uid}_${subscriptionType}`;
    
    console.log('🔄 [useOrderManagement] Initializing subscription for:', currentUser.uid);
    
    // First, try to fetch data immediately to show something while subscription sets up
    let isSubscriptionSuccessful = false;
    
    // Set up real-time subscription
    const setupSubscription = async () => {
      try {
        // Track subscription start in monitor
        subscriptionMonitor.trackSubscriptionStart(subscriptionKey, subscriptionType, currentUser.uid);
        
        // Set up real-time subscription for orders
        const unsubscribe = orderService.subscribeToUserOrders(
          currentUser.uid,
          'freelancer',
          (ordersData) => {
            isSubscriptionSuccessful = true;
            handleOrdersUpdate(ordersData);
          }
        );

        // Register the subscription to prevent duplicates
        const subscriptionId = subscriptionRegistry.registerSubscription(
          currentUser.uid, 
          subscriptionType, 
          unsubscribe
        );

        if (subscriptionId) {
          console.log('✅ [useOrderManagement] Real-time subscription established');
          return subscriptionId;
        } else {
          console.log('⚠️ [useOrderManagement] Failed to register subscription');
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
          return null;
        }
      } catch (error) {
        console.error('💥 [useOrderManagement] Error setting up subscription:', error);
        return null;
      }
    };

         // Setup subscription and fallback
     const initializeData = async () => {
       // Check if subscription already exists
       if (subscriptionRegistry.hasSubscription(currentUser.uid, subscriptionType)) {
         console.log('⚠️ [useOrderManagement] Subscription already exists, cleaning up first');
         subscriptionRegistry.cleanupUserSubscriptions(currentUser.uid);
       }
       
       const subscriptionId = await setupSubscription();
       
       // If subscription failed or takes too long, use fallback
       const timeoutId = setTimeout(() => {
         if (!isSubscriptionSuccessful) {
           console.log('⚠️ [useOrderManagement] Subscription taking too long, using fallback fetch');
           fetchOrders();
         }
       }, 5000); // 5 second timeout
       
       return subscriptionId ? { subscriptionId, timeoutId } : null;
     };

    const subscriptionPromise = initializeData();

         // Cleanup subscription on unmount
     return () => {
       console.log('🧹 [useOrderManagement] Cleaning up subscription');
       
       subscriptionPromise.then((result) => {
         if (result) {
           const { subscriptionId, timeoutId } = result;
           
           // Clear timeout
           if (timeoutId) {
             clearTimeout(timeoutId);
           }
           
           // Clean up subscription
           if (subscriptionId) {
             // Track cleanup in monitor
             subscriptionMonitor.trackSubscriptionCleanup(subscriptionKey);
             subscriptionRegistry.unregisterSubscription(subscriptionId);
           }
         }
       });
     };
  }, [currentUser?.uid]); // Only depend on user ID to prevent excessive re-renders

  // Set selected order when orderId changes
  useEffect(() => {
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order);
    }
  }, [orderId, orders]);

  return {
    // State
    orders,
    selectedOrder,
    loading,
    stats,
    error,
    success,
    
    // Actions
    fetchOrders,
    updateOrderStatus,
    deliverOrder,
    filterOrders,
    clearMessages,
    
    // Setters for component-specific state
    setSelectedOrder,
    setError,
    setSuccess
  };
}; 