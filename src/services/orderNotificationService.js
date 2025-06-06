import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

class OrderNotificationService {
  constructor() {
    this.collectionName = 'orders';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Clear cache for a specific freelancer
  clearCache(freelancerId) {
    this.cache.delete(`pending_${freelancerId}`);
    this.cache.delete(`deadline_${freelancerId}`);
    this.cache.delete(`total_${freelancerId}`);
  }

  // Get cached result or execute function
  async getCachedResult(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const result = await fetchFunction();
      this.cache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      console.error(`Error in cached function for key ${key}:`, error);
      // Return cached data if available, even if expired
      return cached ? cached.data : 0;
    }
  }

  // Get pending orders count for freelancer
  async getPendingOrdersCount(freelancerId) {
    const cacheKey = `pending_${freelancerId}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId),
        where('status', 'in', ['pending', 'awaiting_confirmation'])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    });
  }

  // Get orders approaching deadline (within 1 day)
  async getDeadlineAlertsCount(freelancerId) {
    const cacheKey = `deadline_${freelancerId}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId),
        where('status', 'in', ['active', 'in_progress', 'in_revision'])
      );
      
      const snapshot = await getDocs(q);
      let alertCount = 0;
      
      snapshot.forEach(doc => {
        const orderData = doc.data();
        if (orderData.deadline) {
          const deadline = orderData.deadline.toDate ? orderData.deadline.toDate() : new Date(orderData.deadline);
          if (deadline <= tomorrow && deadline > now) {
            alertCount++;
          }
        }
      });
      
      return alertCount;
    });
  }

  // Get total notification count (pending + deadline alerts)
  async getTotalNotificationCount(freelancerId) {
    const cacheKey = `total_${freelancerId}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const [pendingCount, deadlineCount] = await Promise.all([
        this.getPendingOrdersCount(freelancerId),
        this.getDeadlineAlertsCount(freelancerId)
      ]);
      
      return pendingCount + deadlineCount;
    });
  }

  // Real-time subscription to order notifications
  subscribeToOrderNotifications(freelancerId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId)
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          let pendingCount = 0;
          let deadlineCount = 0;
          const now = new Date();
          const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
          
          snapshot.forEach(doc => {
            const orderData = doc.data();
            
            // Count pending orders
            if (['pending', 'awaiting_confirmation'].includes(orderData.status)) {
              pendingCount++;
            }
            
            // Count deadline alerts
            if (['active', 'in_progress', 'in_revision'].includes(orderData.status) && orderData.deadline) {
              const deadline = orderData.deadline.toDate ? orderData.deadline.toDate() : new Date(orderData.deadline);
              if (deadline <= tomorrow && deadline > now) {
                deadlineCount++;
              }
            }
          });
          
          const totalCount = pendingCount + deadlineCount;
          console.log('📊 [OrderNotificationService] Real-time notification update:', {
            freelancerId,
            pendingCount,
            deadlineCount,
            totalCount
          });
          
          // Clear cache when real-time update occurs
          this.clearCache(freelancerId);
          
          callback(totalCount);
        } catch (error) {
          console.error('Error processing order notifications:', error);
          callback(0);
        }
      }, (error) => {
        console.error('Error in order notifications subscription:', error);
        callback(0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up order notifications subscription:', error);
      callback(0);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Get detailed notification data
  async getNotificationDetails(freelancerId) {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      const q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId)
      );
      
      const snapshot = await getDocs(q);
      const notifications = {
        pending: [],
        deadlineAlerts: []
      };
      
      snapshot.forEach(doc => {
        const orderData = { id: doc.id, ...doc.data() };
        
        // Add pending orders
        if (['pending', 'awaiting_confirmation'].includes(orderData.status)) {
          notifications.pending.push({
            orderId: orderData.id,
            title: orderData.title,
            clientName: orderData.client?.displayName || 'Unknown Client',
            createdAt: orderData.createdAt
          });
        }
        
        // Add deadline alerts
        if (['active', 'in_progress', 'in_revision'].includes(orderData.status) && orderData.deadline) {
          const deadline = orderData.deadline.toDate ? orderData.deadline.toDate() : new Date(orderData.deadline);
          if (deadline <= tomorrow && deadline > now) {
            const timeRemaining = deadline.getTime() - now.getTime();
            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
            
            notifications.deadlineAlerts.push({
              orderId: orderData.id,
              title: orderData.title,
              deadline: deadline,
              hoursRemaining: hoursRemaining,
              clientName: orderData.client?.displayName || 'Unknown Client'
            });
          }
        }
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting notification details:', error);
      return { pending: [], deadlineAlerts: [] };
    }
  }
}

const orderNotificationService = new OrderNotificationService();
export default orderNotificationService; 