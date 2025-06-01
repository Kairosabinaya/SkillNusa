/**
 * Order Service - Handles all order-related database operations
 * Updated to use new database structure with consistent field naming
 */

import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { Order } from '../models/Order';
import { COLLECTIONS, ORDER_STATUSES, PAYMENT_STATUSES } from '../utils/constants';
import chatService from './chatService';
import { recalculateFreelancerRating } from './userProfileService';

class OrderService {
  constructor() {
    this.collectionName = COLLECTIONS.ORDERS;
  }

  // Generate order number
  generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `ORD-${year}${month}${day}-${time}`;
  }

  // Create new order with enhanced workflow
  async createOrder(orderData) {
    try {
      // Generate order number
      const orderNumber = this.generateOrderNumber();
      
      // Calculate due date based on delivery time
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (orderData.deliveryTime || 7));

      // Calculate platform fee (10%)
      const totalAmount = orderData.price || 0;
      const platformFee = Math.round(totalAmount * 0.1);
      const freelancerEarning = totalAmount - platformFee;

      const order = {
        ...orderData,
        orderNumber,
        status: ORDER_STATUSES.PENDING,
        paymentStatus: PAYMENT_STATUSES.PENDING,
        
        // Timeline tracking
        timeline: {
          ordered: serverTimestamp(),
          confirmed: null,
          completed: null,
          cancelled: null
        },
        
        // Progress tracking
        progress: {
          percentage: 0,
          currentPhase: 'pending',
          phases: [
            { name: 'Menunggu Konfirmasi', completed: false, date: null },
            { name: 'Sedang Dikerjakan', completed: false, date: null },
            { name: 'Review Client', completed: false, date: null },
            { name: 'Selesai', completed: false, date: null }
          ]
        },
        
        // Delivery and revisions
        deliveries: [],
        revisionCount: 0,
        maxRevisions: orderData.revisions || 3,
        
        // Financial
        totalAmount,
        platformFee,
        freelancerEarning,
        
        // Dates
        dueDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Validate order data
      const errors = this.validateOrderData(order);
      if (Object.keys(errors).length > 0) {
        throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
      }

      const docRef = await addDoc(collection(db, this.collectionName), order);
      const createdOrder = { id: docRef.id, ...order };

      // Create or get chat and send notification
      try {
        const chat = await chatService.createOrGetChat(
          orderData.clientId, 
          orderData.freelancerId, 
          orderData.gigId,
          docRef.id
        );

        // Send order notification to freelancer
        await chatService.sendOrderNotificationMessage(
          chat.id,
          orderData.clientId, // Client is sending the notification
          docRef.id,
          {
            gigTitle: orderData.title,
            packageType: orderData.packageType,
            price: orderData.price,
            clientRequirements: orderData.requirements
          }
        );
      } catch (chatError) {
        console.error('Error creating chat notification:', chatError);
        // Don't fail the order creation if chat fails
      }

      return createdOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Validate order data
  validateOrderData(orderData) {
    const errors = {};
    
    if (!orderData.clientId) {
      errors.clientId = 'Client ID is required';
    }
    
    if (!orderData.freelancerId) {
      errors.freelancerId = 'Freelancer ID is required';
    }
    
    if (!orderData.gigId) {
      errors.gigId = 'Gig ID is required';
    }
    
    if (!orderData.title) {
      errors.title = 'Order title is required';
    }
    
    if (!orderData.price || orderData.price <= 0) {
      errors.price = 'Valid price is required';
    }

    // Validate freelancer can't order from themselves
    if (orderData.clientId === orderData.freelancerId) {
      errors.ownership = 'Cannot order your own gig';
    }

    return errors;
  }

  // Get order by ID with enhanced details
  async getOrder(orderId) {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      const orderDoc = await getDoc(docRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = { id: orderDoc.id, ...orderDoc.data() };
      
      // Get additional details using standardized field names
      const [gigDoc, clientDoc, freelancerDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.GIGS, orderData.gigId)),
        getDoc(doc(db, COLLECTIONS.USERS, orderData.clientId)),
        getDoc(doc(db, COLLECTIONS.USERS, orderData.freelancerId))
      ]);

      if (gigDoc.exists()) {
        orderData.gig = { id: gigDoc.id, ...gigDoc.data() };
      }

      if (clientDoc.exists()) {
        orderData.client = { id: clientDoc.id, ...clientDoc.data() };
      }

      if (freelancerDoc.exists()) {
        orderData.freelancer = { id: freelancerDoc.id, ...freelancerDoc.data() };
      }
      
      return orderData;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  // Update order status with enhanced workflow and automatic notifications
  async updateOrderStatus(orderId, newStatus, userId, additionalData = {}) {
    try {
      const order = await this.getOrder(orderId);
      
      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(order.status);
      if (!validTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      // Update timeline
      const timeline = { ...order.timeline };
      if (newStatus === ORDER_STATUSES.IN_PROGRESS) {
        timeline.confirmed = serverTimestamp();
      } else if (newStatus === ORDER_STATUSES.COMPLETED) {
        timeline.completed = serverTimestamp();
        updateData.completedAt = serverTimestamp();
      } else if (newStatus === ORDER_STATUSES.CANCELLED) {
        timeline.cancelled = serverTimestamp();
      }
      updateData.timeline = timeline;

      // Update progress
      const progress = { ...order.progress };
      switch (newStatus) {
        case ORDER_STATUSES.IN_PROGRESS:
          progress.percentage = 25;
          progress.currentPhase = 'in_progress';
          progress.phases[0].completed = true;
          progress.phases[0].date = new Date();
          progress.phases[1].completed = true;
          progress.phases[1].date = new Date();
          break;
        case ORDER_STATUSES.DELIVERED:
          progress.percentage = 85;
          progress.currentPhase = 'delivered';
          progress.phases[2].completed = true;
          progress.phases[2].date = new Date();
          break;
        case ORDER_STATUSES.IN_REVISION:
          progress.percentage = 50;
          progress.currentPhase = 'in_revision';
          break;
        case ORDER_STATUSES.COMPLETED:
          progress.percentage = 100;
          progress.currentPhase = 'completed';
          progress.phases[3].completed = true;
          progress.phases[3].date = new Date();
          break;
        case ORDER_STATUSES.CANCELLED:
          progress.currentPhase = 'cancelled';
          break;
      }
      updateData.progress = progress;

      // Update order in database
      await updateDoc(doc(db, this.collectionName, orderId), updateData);

      // Send automatic status update notification
      try {
        // Create or get chat if it doesn't exist
        let chat = await chatService.findChatBetweenUsers(order.clientId, order.freelancerId);
        if (!chat) {
          chat = await chatService.createOrGetChat(
            order.clientId, 
            order.freelancerId, 
            order.gigId, 
            orderId
          );
        }

        if (chat) {
          // Determine who should send the message based on status change
          let messageSenderId;
          let notificationStatus = newStatus;

          // Logic untuk menentukan siapa yang mengirim pesan
          switch (newStatus) {
            case ORDER_STATUSES.IN_PROGRESS:
              // Freelancer konfirmasi pesanan -> pesan dari freelancer ke client
              messageSenderId = order.freelancerId;
              notificationStatus = 'confirmed';
              break;
              
            case ORDER_STATUSES.DELIVERED:
              // Freelancer submit hasil -> pesan dari freelancer ke client  
              messageSenderId = order.freelancerId;
              break;
              
            case ORDER_STATUSES.IN_REVISION:
              // Client minta revisi -> pesan dari freelancer
              messageSenderId = order.freelancerId;
              break;
              
            case ORDER_STATUSES.COMPLETED:
              // Client terima pekerjaan -> pesan dari client ke freelancer
              messageSenderId = order.clientId;
              break;
              
            case ORDER_STATUSES.CANCELLED:
              // Pembatalan bisa dari siapa saja -> gunakan userId yang melakukan aksi
              messageSenderId = userId;
              break;
              
            default:
              // Default: gunakan userId yang melakukan perubahan
              messageSenderId = userId;
          }

          // Prepare order data for message template
          const orderDataForMessage = {
            title: order.title || order.gig?.title || 'Pesanan',
            deliveryTime: order.deliveryTime || order.gig?.packages?.basic?.deliveryTime || '3-7 hari',
            packageType: order.packageType,
            price: order.price
          };

          // Send the notification
          await chatService.sendOrderStatusMessage(
            chat.id,
            messageSenderId,
            orderId,
            notificationStatus,
            additionalData.statusMessage || '',
            orderDataForMessage
          );

          console.log(`✅ Auto notification sent: ${notificationStatus} (${order.status} -> ${newStatus}) by ${messageSenderId}`);
        }
      } catch (chatError) {
        console.error('Error sending automatic status notification:', chatError);
        // Don't fail the status update if notification fails
      }

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get valid status transitions
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.IN_PROGRESS]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.IN_REVISION, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.IN_REVISION]: [ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.COMPLETED]: [], // Final state
      [ORDER_STATUSES.CANCELLED]: [] // Final state
    };

    return transitions[currentStatus] || [];
  }

  // Add delivery to order
  async addDelivery(orderId, userId, deliveryData) {
    try {
      const order = await this.getOrder(orderId);
      
      // Validate user is the freelancer
      if (order.freelancerId !== userId) {
        throw new Error('Only the freelancer can add deliveries');
      }

      const delivery = {
        id: Date.now().toString(),
        message: deliveryData.message,
        attachments: deliveryData.attachments || [],
        deliveredAt: serverTimestamp(),
        isRevision: deliveryData.isRevision || false
      };

      const deliveries = [...(order.deliveries || []), delivery];

      await updateDoc(doc(db, this.collectionName, orderId), {
        deliveries,
        status: ORDER_STATUSES.DELIVERED,
        deliveredAt: serverTimestamp(),
        hasAttachments: deliveryData.attachments && deliveryData.attachments.length > 0,
        deliveryMessage: deliveryData.message,
        updatedAt: serverTimestamp()
      });

      // Update order status to delivered
      await this.updateOrderStatus(orderId, ORDER_STATUSES.DELIVERED, userId, {
        statusMessage: `Pekerjaan telah diserahkan dengan ${deliveryData.attachments?.length || 0} file lampiran`
      });

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error adding delivery:', error);
      throw error;
    }
  }

  // Request revision
  async requestRevision(orderId, userId, revisionData) {
    try {
      const order = await this.getOrder(orderId);
      
      // Validate user is the client
      if (order.clientId !== userId) {
        throw new Error('Only the client can request revisions');
      }

      // Check revision limit
      if (order.revisionCount >= order.maxRevisions) {
        throw new Error('Maximum revisions exceeded');
      }

      const newRevisionCount = (order.revisionCount || 0) + 1;

      await updateDoc(doc(db, this.collectionName, orderId), {
        revisionCount: newRevisionCount,
        updatedAt: serverTimestamp()
      });

      // Update status to in_revision
      await this.updateOrderStatus(orderId, ORDER_STATUSES.IN_REVISION, userId, {
        statusMessage: `Revisi diminta (${newRevisionCount}/${order.maxRevisions}): ${revisionData.message}`
      });

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error requesting revision:', error);
      throw error;
    }
  }

  // Get client orders
  async getClientOrders(clientId, options = {}) {
    try {
      const {
        status,
        limit: queryLimit = 20,
        orderBy: orderField = 'createdAt',
        orderDirection = 'desc',
        startAfterDoc = null
      } = options;

      let constraints = [
        where('clientId', '==', clientId)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      constraints.push(orderBy(orderField, orderDirection));
      constraints.push(limit(queryLimit));

      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const ordersQuery = query(
        collection(db, this.collectionName),
        ...constraints
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = { id: doc.id, ...doc.data() };
          
          // Get gig and freelancer data
          const [gigDoc, freelancerDoc] = await Promise.all([
            getDoc(doc(db, COLLECTIONS.GIGS, orderData.gigId)),
            getDoc(doc(db, COLLECTIONS.USERS, orderData.freelancerId))
          ]);

          if (gigDoc.exists()) {
            orderData.gig = { id: gigDoc.id, ...gigDoc.data() };
          }

          if (freelancerDoc.exists()) {
            orderData.freelancer = { id: freelancerDoc.id, ...freelancerDoc.data() };
          }

          return orderData;
        })
      );

      return orders;
    } catch (error) {
      console.error('Error getting client orders:', error);
      throw error;
    }
  }

  // Get freelancer orders
  async getFreelancerOrders(freelancerId, options = {}) {
    try {
      const {
        status,
        limit: queryLimit = 20,
        orderBy: orderField = 'createdAt',
        orderDirection = 'desc',
        startAfterDoc = null
      } = options;

      let constraints = [
        where('freelancerId', '==', freelancerId)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      constraints.push(orderBy(orderField, orderDirection));
      constraints.push(limit(queryLimit));

      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const ordersQuery = query(
        collection(db, this.collectionName),
        ...constraints
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = { id: doc.id, ...doc.data() };
          
          // Get gig and client data
          const [gigDoc, clientDoc] = await Promise.all([
            getDoc(doc(db, COLLECTIONS.GIGS, orderData.gigId)),
            getDoc(doc(db, COLLECTIONS.USERS, orderData.clientId))
          ]);

          if (gigDoc.exists()) {
            orderData.gig = { id: gigDoc.id, ...gigDoc.data() };
          }

          if (clientDoc.exists()) {
            orderData.client = { id: clientDoc.id, ...clientDoc.data() };
          }

          return orderData;
        })
      );

      return orders;
    } catch (error) {
      console.error('Error getting freelancer orders:', error);
      throw error;
    }
  }

  // Get orders with details (for both client and freelancer)
  async getOrdersWithDetails(userId, userType = 'client') {
    try {
      const fieldName = userType === 'client' ? 'clientId' : 'freelancerId';
      
      const ordersQuery = query(
        collection(db, this.collectionName),
        where(fieldName, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = { id: doc.id, ...doc.data() };
          
          // Get related data
          const [gigDoc, otherUserDoc] = await Promise.all([
            getDoc(doc(db, COLLECTIONS.GIGS, orderData.gigId)),
            getDoc(doc(db, COLLECTIONS.USERS, userType === 'client' ? orderData.freelancerId : orderData.clientId))
          ]);

          if (gigDoc.exists()) {
            orderData.gig = { id: gigDoc.id, ...gigDoc.data() };
          }

          if (otherUserDoc.exists()) {
            const otherUserData = otherUserDoc.data();
            if (userType === 'client') {
              orderData.freelancer = { id: otherUserDoc.id, ...otherUserData };
            } else {
              orderData.client = { id: otherUserDoc.id, ...otherUserData };
            }
          }

          return orderData;
        })
      );

      return orders;
    } catch (error) {
      console.error('Error getting orders with details:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(clientId) {
    try {
      const ordersQuery = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data());

      const stats = {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === ORDER_STATUSES.COMPLETED).length,
        activeOrders: orders.filter(o => [ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DELIVERED].includes(o.status)).length,
        cancelledOrders: orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length,
        totalSpent: orders.filter(o => o.status === ORDER_STATUSES.COMPLETED).reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting client stats:', error);
      return {
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0
      };
    }
  }

  // Get freelancer statistics
  async getFreelancerStats(freelancerId) {
    try {
      const ordersQuery = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data());

      const stats = {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === ORDER_STATUSES.COMPLETED).length,
        activeOrders: orders.filter(o => [ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.DELIVERED].includes(o.status)).length,
        cancelledOrders: orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length,
        totalEarnings: orders.filter(o => o.status === ORDER_STATUSES.COMPLETED).reduce((sum, o) => sum + (o.freelancerEarning || 0), 0),
        averageOrderValue: 0
      };

      if (stats.completedOrders > 0) {
        stats.averageOrderValue = stats.totalEarnings / stats.completedOrders;
      }

      return stats;
    } catch (error) {
      console.error('Error getting freelancer stats:', error);
      return {
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        totalEarnings: 0,
        averageOrderValue: 0
      };
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      await updateDoc(doc(db, this.collectionName, orderId), {
        paymentStatus,
        updatedAt: serverTimestamp()
      });

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await this.getOrder(orderId);
      
      // Validate user can cancel (client or freelancer)
      if (order.clientId !== userId && order.freelancerId !== userId) {
        throw new Error('Only client or freelancer can cancel the order');
      }

      await this.updateOrderStatus(orderId, ORDER_STATUSES.CANCELLED, userId, {
        statusMessage: `Pesanan dibatalkan: ${reason}`,
        cancellationReason: reason,
        cancelledBy: userId
      });

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
}

export default new OrderService();

/**
 * Complete an order and auto-update freelancer statistics
 * @param {string} orderId - Order ID
 * @param {Object} completionData - Completion data (deliveries, message, etc.)
 * @returns {Promise<boolean>} Success status
 */
export const completeOrder = async (orderId, completionData = {}) => {
  try {
    console.log('✅ Completing order and updating freelancer stats...');
    
    // Get current order data
    const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    
    // Update order status to completed
    const updateData = {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...completionData
    };
    
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updateData);
    console.log('✅ Order marked as completed');
    
    // Auto-recalculate freelancer statistics (totalOrders count)
    if (orderData.freelancerId) {
      console.log('🔄 Auto-updating freelancer order statistics...');
      await recalculateFreelancerRating(orderData.freelancerId);
      console.log('✅ Freelancer statistics updated automatically');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error completing order:', error);
    throw error;
  }
};

/**
 * Cancel an order and auto-update freelancer statistics
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<boolean>} Success status
 */
export const cancelOrder = async (orderId, reason = '') => {
  try {
    console.log('❌ Cancelling order and updating freelancer stats...');
    
    // Get current order data
    const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    
    // Update order status to cancelled
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: {
        ...orderData.timeline,
        cancelled: serverTimestamp()
      }
    });
    
    console.log('✅ Order cancelled');
    
    // Auto-recalculate freelancer statistics (may affect totalOrders count)
    if (orderData.freelancerId) {
      console.log('🔄 Auto-updating freelancer order statistics...');
      await recalculateFreelancerRating(orderData.freelancerId);
      console.log('✅ Freelancer statistics updated automatically');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    throw error;
  }
}; 