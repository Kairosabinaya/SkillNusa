import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Create a new notification with retry mechanism
   */
  async createNotification(notificationData, retryCount = 0) {
    const maxRetries = 2;
    const baseDelay = 1000; // 1 second
    
    try {
      // Check authentication status for debugging
      const currentUser = auth.currentUser;
      console.log('🔍 [NotificationService] Creating notification - Auth status:', {
        isAuthenticated: !!currentUser,
        currentUserId: currentUser?.uid || 'Not authenticated',
        targetUserId: notificationData.userId,
        notificationType: notificationData.type,
        attempt: retryCount + 1
      });

      // Validate required fields
      if (!notificationData.userId) {
        console.error('❌ [NotificationService] Missing userId in notification data');
        return null;
      }

      const notification = {
        type: notificationData.type || 'info',
        title: notificationData.title || '',
        message: notificationData.message || '',
        userId: notificationData.userId,
        actionUrl: notificationData.actionUrl || null,
        metadata: notificationData.metadata || {},
        createdAt: serverTimestamp(),
        read: false
      };

      // Validate notification data before creating
      if (!notification.userId || !notification.title) {
        console.error('❌ [NotificationService] Invalid notification data:', notification);
        return null;
      }

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      console.log('✅ [NotificationService] Notification created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [NotificationService] Error creating notification:', error);
      
      // Log additional context for debugging
      console.error('❌ [NotificationService] Notification data was:', {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title?.substring(0, 50) + '...'
      });
      
      // Log authentication context
      const currentUser = auth.currentUser;
      console.error('❌ [NotificationService] Auth context at error:', {
        isAuthenticated: !!currentUser,
        currentUserId: currentUser?.uid || 'Not authenticated',
        errorCode: error.code,
        errorMessage: error.message
      });
      
      // Check if this is a retryable error and we haven't exceeded max retries
      const isRetryableError = error.code === 'unauthenticated' ||
                               error.code === 'unavailable' ||
                               error.code === 'deadline-exceeded' ||
                               error.code === 'resource-exhausted';
      
      // Don't retry permission-denied errors as they likely indicate a configuration issue
      if (error.code === 'permission-denied') {
        console.error('❌ [NotificationService] Permission denied - check Firebase rules for notifications collection');
        console.error('❌ [NotificationService] Auth status:', {
          isAuthenticated: !!auth.currentUser,
          currentUserId: auth.currentUser?.uid,
          targetUserId: notificationData.userId
        });
        return null; // Return null instead of throwing for permission errors
      }
      
      if (isRetryableError && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 [NotificationService] Retrying notification creation in ${delay}ms (attempt ${retryCount + 2}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.createNotification(notificationData, retryCount + 1);
      }
      
      // Don't throw the error to prevent blocking the main operation
      // Just log it and return null
      console.error(`❌ [NotificationService] Failed to create notification after ${retryCount + 1} attempts`);
      return null;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId, type = null) {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('❌ [NotificationService] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notification count updates
   */
  subscribeToNotificationCount(userId, callback, type = null) {
    try {
      const subscriptionKey = `${userId}_${type || 'all'}_count`;
      
      // Clean up existing subscription if it exists
      if (this.subscriptions.has(subscriptionKey)) {
        console.log('🔄 [NotificationService] Cleaning up existing count subscription:', subscriptionKey);
        const existingUnsubscribe = this.subscriptions.get(subscriptionKey);
        existingUnsubscribe();
        this.subscriptions.delete(subscriptionKey);
      }

      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const count = snapshot.size;
          console.log(`📊 [NotificationService] Notification count update for ${userId} (${type || 'all'}):`, count);
          callback(count);
        },
        (error) => {
          console.error('❌ [NotificationService] Error in notification count subscription:', error);
          callback(0);
        }
      );

      this.subscriptions.set(subscriptionKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ [NotificationService] Error setting up notification count subscription:', error);
      callback(0);
      return () => {};
    }
  }

  /**
   * Subscribe to detailed notification updates
   */
  subscribeToNotifications(userId, callback, limitCount = 50) {
    try {
      const subscriptionKey = `${userId}_detailed`;
      
      // Clean up existing subscription if it exists
      if (this.subscriptions.has(subscriptionKey)) {
        console.log('🔄 [NotificationService] Cleaning up existing detailed subscription:', subscriptionKey);
        const existingUnsubscribe = this.subscriptions.get(subscriptionKey);
        existingUnsubscribe();
        this.subscriptions.delete(subscriptionKey);
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const notifications = [];
          snapshot.forEach(doc => {
            const docData = doc.data();
            // Always include notification if we have doc data, use Firestore doc.id
            if (docData) {
              notifications.push({
                id: doc.id, // Always use Firestore document ID
                ...docData,
                createdAt: docData.createdAt?.toDate() || new Date()
              });
            }
          });
          
          // Remove any potential duplicates based on ID
          const uniqueNotifications = notifications.reduce((acc, current) => {
            const exists = acc.find(item => item.id === current.id);
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          console.log(`📋 [NotificationService] Notifications update for ${userId}:`, uniqueNotifications.length);
          callback(uniqueNotifications);
        },
        (error) => {
          console.error('❌ [NotificationService] Error in detailed notifications subscription:', error);
          callback([]);
        }
      );

      this.subscriptions.set(subscriptionKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ [NotificationService] Error setting up detailed notifications subscription:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      // Validate notificationId
      if (!notificationId) {
        console.error('❌ [NotificationService] Invalid notificationId provided:', notificationId);
        throw new Error('Notification ID is required');
      }

      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      console.log('✅ [NotificationService] Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ [NotificationService] Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      // Validate userId
      if (!userId) {
        console.error('❌ [NotificationService] Invalid userId provided:', userId);
        throw new Error('User ID is required');
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = [];
      
      snapshot.forEach(doc => {
        batch.push(updateDoc(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        }));
      });

      await Promise.all(batch);
      console.log(`✅ [NotificationService] Marked ${batch.length} notifications as read for user:`, userId);
    } catch (error) {
      console.error('❌ [NotificationService] Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('✅ [NotificationService] Notification deleted:', notificationId);
    } catch (error) {
      console.error('❌ [NotificationService] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup(userId = null) {
    console.log(`🧹 [NotificationService] Starting cleanup for user: ${userId || 'all users'}`);
    
    if (userId) {
      // Clean up specific user subscriptions
      let cleanedCount = 0;
      for (const [key, unsubscribe] of this.subscriptions.entries()) {
        if (key && typeof key === 'string' && key.startsWith(userId)) {
          try {
            unsubscribe();
            this.subscriptions.delete(key);
            cleanedCount++;
            console.log(`🧹 [NotificationService] Cleaned up subscription: ${key}`);
          } catch (error) {
            console.error(`❌ [NotificationService] Error cleaning up subscription ${key}:`, error);
          }
        }
      }
      console.log(`✅ [NotificationService] Cleaned up ${cleanedCount} subscriptions for user ${userId}`);
    } else {
      // Clean up all subscriptions
      const totalCount = this.subscriptions.size;
      this.subscriptions.forEach((unsubscribe, key) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error(`❌ [NotificationService] Error cleaning up subscription ${key}:`, error);
        }
      });
      this.subscriptions.clear();
      console.log(`✅ [NotificationService] Cleaned up all ${totalCount} subscriptions`);
    }
  }

  /**
   * Create order status notification
   */
  async createOrderStatusNotification(orderId, userId, userType, status, additionalData = {}) {
    // Validate required parameters
    if (!orderId || !userId || !userType || !status) {
      console.error('❌ [NotificationService] Missing required parameters for order status notification:', {
        orderId: !!orderId,
        userId: !!userId,
        userType: !!userType,
        status: !!status
      });
      return null;
    }

    const statusMessages = {
      // For Clients
      client: {
        pending: 'Pesanan Anda sedang menunggu konfirmasi dari freelancer',
        active: 'Pesanan Anda telah dikonfirmasi dan sedang dikerjakan',
        in_progress: 'Freelancer sedang mengerjakan pesanan Anda',
        in_revision: 'Permintaan revisi telah dikirim ke freelancer',
        delivered: 'Pekerjaan telah diselesaikan, silakan review dan terima',
        completed: 'Pesanan telah diselesaikan',
        cancelled: 'Pesanan telah dibatalkan'
      },
      // For Freelancers
      freelancer: {
        pending: 'Pesanan baru masuk, silakan konfirmasi',
        active: 'Pesanan baru dikonfirmasi, mulai kerjakan',
        in_progress: 'Pesanan sedang dalam pengerjaan',
        in_revision: 'Client meminta revisi untuk pesanan ini',
        delivered: 'Pekerjaan telah dikirim, menunggu review client',
        completed: 'Client telah menerima pekerjaan Anda',
        cancelled: 'Pesanan telah dibatalkan oleh client'
      }
    };

    const statusIcons = {
      pending: '⏳',
      active: '🚀',
      in_progress: '⚒️',
      in_revision: '🔄',
      delivered: '📦',
      completed: '✅',
      cancelled: '❌'
    };

    const notification = {
      userId,
      type: 'order_status',
      orderId,
      status,
      title: `${statusIcons[status]} Update Pesanan #${orderId ? orderId.slice(-8).toUpperCase() : 'UNKNOWN'}`,
      message: statusMessages[userType]?.[status] || 'Status pesanan telah diperbarui',
      priority: ['pending', 'delivered', 'in_revision'].includes(status) ? 'high' : 'normal',
      actionUrl: orderId 
        ? (userType === 'client' 
          ? `/dashboard/client/transactions/${orderId}`
          : `/dashboard/freelancer/orders/${orderId}`)
        : (userType === 'client' 
          ? '/dashboard/client/transactions'
          : '/dashboard/freelancer/orders'),
      ...additionalData
    };

    return await this.createNotification(notification);
  }

  /**
   * Create message notification
   */
  async createMessageNotification(recipientId, senderId, senderName, conversationId, preview) {
    // Validate required parameters
    if (!recipientId || !senderId || !senderName || !conversationId) {
      console.error('❌ [NotificationService] Missing required parameters for message notification:', {
        recipientId: !!recipientId,
        senderId: !!senderId,
        senderName: !!senderName,
        conversationId: !!conversationId,
        preview: !!preview
      });
      return null;
    }

    const notification = {
      userId: recipientId,
      type: 'message',
      senderId,
      conversationId,
      title: `💬 Pesan baru dari ${senderName}`,
      message: preview,
      priority: 'normal',
      actionUrl: `/messages/${conversationId}`
    };

    return await this.createNotification(notification);
  }

  /**
   * Create review notification
   */
  async createReviewNotification(freelancerId, clientName, rating, orderId) {
    // Validate required parameters
    if (!freelancerId || !clientName || rating === undefined || rating === null) {
      console.error('❌ [NotificationService] Missing required parameters for review notification:', {
        freelancerId: !!freelancerId,
        clientName: !!clientName,
        rating: rating !== undefined && rating !== null,
        orderId: !!orderId
      });
      return null;
    }

    const notification = {
      userId: freelancerId,
      type: 'review',
      orderId,
      rating,
      title: `⭐ Review baru dari ${clientName}`,
      message: `Anda mendapat rating ${rating} bintang`,
      priority: 'normal',
      actionUrl: orderId ? `/dashboard/freelancer/orders/${orderId}` : '/dashboard/freelancer'
    };

    return await this.createNotification(notification);
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification(userId, amount, type, orderId = null) {
    // Validate required parameters
    if (!userId || amount === undefined || amount === null || !type) {
      console.error('❌ [NotificationService] Missing required parameters for payment notification:', {
        userId: !!userId,
        amount: amount !== undefined && amount !== null,
        type: !!type,
        orderId: !!orderId
      });
      return null;
    }

    const paymentMessages = {
      received: `Pembayaran sebesar ${amount} telah diterima`,
      pending: `Pembayaran sebesar ${amount} sedang diproses`,
      failed: `Pembayaran sebesar ${amount} gagal diproses`
    };

    const notification = {
      userId,
      type: 'payment',
      paymentType: type,
      amount,
      orderId,
      title: `💰 ${type === 'received' ? 'Pembayaran Diterima' : type === 'pending' ? 'Pembayaran Diproses' : 'Pembayaran Gagal'}`,
      message: paymentMessages[type],
      priority: type === 'failed' ? 'high' : 'normal',
      actionUrl: orderId ? `/dashboard/freelancer/orders/${orderId}` : '/dashboard/freelancer/wallet'
    };

    return await this.createNotification(notification);
  }

  /**
   * Get notification counts by type for dashboard
   */
  async getNotificationCountsByType(userId) {
    try {
      const types = ['order_status', 'message', 'review', 'payment'];
      const counts = {};

      for (const type of types) {
        counts[type] = await this.getUnreadCount(userId, type);
      }

      return counts;
    } catch (error) {
      console.error('❌ [NotificationService] Error getting notification counts by type:', error);
      return { order_status: 0, message: 0, review: 0, payment: 0 };
    }
  }
}

export default new NotificationService(); 