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
import chatService from './chatService';

class OrderService {
  constructor() {
    this.collectionName = 'orders';
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
        status: 'pending',
        paymentStatus: 'pending',
        
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
      
      // Get additional details
      const [gigDoc, clientDoc, freelancerDoc] = await Promise.all([
        getDoc(doc(db, 'gigs', orderData.gigId)),
        getDoc(doc(db, 'users', orderData.clientId)),
        getDoc(doc(db, 'users', orderData.freelancerId))
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

  // Update order status with enhanced workflow
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
      if (newStatus === 'in_progress') {
        timeline.confirmed = serverTimestamp();
      } else if (newStatus === 'completed') {
        timeline.completed = serverTimestamp();
        updateData.completedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        timeline.cancelled = serverTimestamp();
      }
      updateData.timeline = timeline;

      // Update progress
      const progress = { ...order.progress };
      switch (newStatus) {
        case 'active':
        case 'in_progress':
          progress.percentage = 25;
          progress.currentPhase = 'in_progress';
          progress.phases[0].completed = true;
          progress.phases[0].date = new Date();
          progress.phases[1].completed = true;
          progress.phases[1].date = new Date();
          break;
        case 'delivered':
        case 'in_review':
          progress.percentage = 75;
          progress.currentPhase = 'in_review';
          progress.phases[2].completed = true;
          progress.phases[2].date = new Date();
          break;
        case 'in_revision':
          progress.percentage = 50;
          progress.currentPhase = 'in_revision';
          // Reset delivery phase
          progress.phases[2].completed = false;
          progress.phases[2].date = null;
          break;
        case 'completed':
          progress.percentage = 100;
          progress.currentPhase = 'completed';
          progress.phases[3].completed = true;
          progress.phases[3].date = new Date();
          break;
        case 'cancelled':
          progress.currentPhase = 'cancelled';
          break;
      }
      updateData.progress = progress;

      // Update order in database
      await updateDoc(doc(db, this.collectionName, orderId), updateData);

      // Send status update notification
      try {
        const chat = await chatService.findChatBetweenUsers(order.clientId, order.freelancerId);
        if (chat) {
          await chatService.sendOrderStatusMessage(
            chat.id,
            userId,
            orderId,
            newStatus,
            additionalData.statusMessage || ''
          );
        }
      } catch (chatError) {
        console.error('Error sending status notification:', chatError);
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
      'pending': ['active', 'cancelled'],
      'active': ['delivered', 'cancelled'],
      'delivered': ['completed', 'in_revision', 'cancelled'],
      'in_revision': ['delivered', 'cancelled'],
      'in_progress': ['delivered', 'cancelled'], // Legacy status support
      'in_review': ['completed', 'in_revision', 'cancelled'], // Legacy status support
      'completed': [], // Final state
      'cancelled': [] // Final state
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
        status: 'in_review',
        updatedAt: serverTimestamp()
      });

      // Update status to in_review
      await this.updateOrderStatus(orderId, 'in_review', userId, {
        statusMessage: deliveryData.message
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

      // Check if revisions are available
      if (order.revisionCount >= order.maxRevisions) {
        throw new Error('Maximum revisions exceeded');
      }

      const revisionCount = (order.revisionCount || 0) + 1;

      await updateDoc(doc(db, this.collectionName, orderId), {
        revisionCount,
        revisionRequests: [...(order.revisionRequests || []), {
          message: revisionData.message,
          requestedAt: serverTimestamp()
        }],
        updatedAt: serverTimestamp()
      });

      // Update status back to in_progress
      await this.updateOrderStatus(orderId, 'in_progress', userId, {
        statusMessage: `Revisi diminta: ${revisionData.message}`
      });

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error requesting revision:', error);
      throw error;
    }
  }

  // Get client orders with enhanced data
  async getClientOrders(clientId, options = {}) {
    console.log('🔍 [OrderService] getClientOrders called with:', { clientId, options });
    
    try {
      const { 
        status = null, 
        limitCount = 20, 
        orderByField = 'createdAt', 
        orderDirection = 'desc',
        lastDoc = null 
      } = options;

      let q = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId)
      );

      console.log('📡 [OrderService] Building query with clientId:', clientId);

      if (status) {
        q = query(q, where('status', '==', status));
        console.log('📡 [OrderService] Added status filter:', status);
      }

      // Removed orderBy to avoid composite index requirement
      // Will sort in JavaScript instead
      console.log('📡 [OrderService] Removed orderBy to avoid composite index, will sort in JavaScript');

      // For now, fetch more records and handle pagination in JavaScript
      // This is a trade-off between composite indexes and performance
      const fetchLimit = limitCount ? limitCount * 2 : 50; // Fetch more to allow for JS sorting
      q = query(q, limit(fetchLimit));
      console.log('📡 [OrderService] Added limit:', fetchLimit);

      // Note: Removing startAfter pagination for now to avoid complexity
      // In a production app, you'd want to implement cursor-based pagination differently
      if (lastDoc) {
        console.log('📡 [OrderService] Pagination with lastDoc temporarily disabled due to sorting changes');
      }

      console.log('📡 [OrderService] Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('📥 [OrderService] Firestore query result:', {
        size: querySnapshot.size,
        empty: querySnapshot.empty,
        docs: querySnapshot.docs.length
      });
      
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 [OrderService] Processing order doc:', {
          id: doc.id,
          orderNumber: data.orderNumber,
          clientId: data.clientId,
          freelancerId: data.freelancerId,
          gigId: data.gigId,
          status: data.status,
          title: data.title,
          price: data.price
        });
        
        orders.push({
          id: doc.id,
          ...data
        });
      });

      // Sort by the specified field in JavaScript
      orders.sort((a, b) => {
        let aValue, bValue;
        
        if (orderByField === 'createdAt') {
          aValue = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          bValue = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        } else {
          aValue = a[orderByField] || '';
          bValue = b[orderByField] || '';
        }
        
        if (orderDirection === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      // Apply the original limit after sorting
      const limitedOrders = limitCount ? orders.slice(0, limitCount) : orders;
      
      console.log('✅ [OrderService] Client orders processed and sorted:', {
        total: orders.length,
        returned: limitedOrders.length,
        orders: limitedOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status }))
      });
      
      return {
        orders: limitedOrders,
        lastDoc: null, // Simplified pagination for now
        hasMore: orders.length > limitedOrders.length
      };
    } catch (error) {
      console.error('💥 [OrderService] Error getting client orders:', error);
      throw error;
    }
  }

  // Get freelancer orders with enhanced data
  async getFreelancerOrders(freelancerId, options = {}) {
    try {
      const { 
        status = null, 
        limitCount = 20, 
        orderByField = 'createdAt', 
        orderDirection = 'desc',
        lastDoc = null 
      } = options;

      let q = query(
        collection(db, this.collectionName),
        where('freelancerId', '==', freelancerId)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      // Removed orderBy to avoid composite index requirement
      // Will sort in JavaScript instead
      
      // For now, fetch more records and handle pagination in JavaScript
      const fetchLimit = limitCount ? limitCount * 2 : 50;
      q = query(q, limit(fetchLimit));

      // Note: Removing startAfter pagination for now
      if (lastDoc) {
        console.log('Pagination with lastDoc temporarily disabled due to sorting changes');
      }

      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by the specified field in JavaScript
      orders.sort((a, b) => {
        let aValue, bValue;
        
        if (orderByField === 'createdAt') {
          aValue = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          bValue = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        } else {
          aValue = a[orderByField] || '';
          bValue = b[orderByField] || '';
        }
        
        if (orderDirection === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      // Apply the original limit after sorting
      const limitedOrders = limitCount ? orders.slice(0, limitCount) : orders;
      
      return {
        orders: limitedOrders,
        lastDoc: null, // Simplified pagination for now
        hasMore: orders.length > limitedOrders.length
      };
    } catch (error) {
      console.error('Error getting freelancer orders:', error);
      throw error;
    }
  }

  // Get orders with enhanced user details
  async getOrdersWithDetails(userId, userType = 'client') {
    console.log('🔍 [OrderService] getOrdersWithDetails called with:', { userId, userType });
    
    try {
      const field = userType === 'client' ? 'clientId' : 'freelancerId';
      console.log('📡 [OrderService] Getting orders using field:', field);
      
      const { orders } = await this[userType === 'client' ? 'getClientOrders' : 'getFreelancerOrders'](userId);
      
      console.log('📥 [OrderService] Raw orders received:', {
        count: orders.length,
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          clientId: o.clientId,
          freelancerId: o.freelancerId,
          gigId: o.gigId,
          title: o.title
        }))
      });
      
      // Get additional details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order, index) => {
          console.log(`🔄 [OrderService] Processing order ${index + 1}/${orders.length}:`, order.id);
          
          try {
            // Get gig details
            const gigDoc = await getDoc(doc(db, 'gigs', order.gigId));
            let gigData = null;
            if (gigDoc.exists()) {
              gigData = { id: gigDoc.id, ...gigDoc.data() };
              console.log(`✅ [OrderService] Gig data found for order ${order.id}:`, gigData.title);
            } else {
              console.log(`⚠️ [OrderService] No gig data found for order ${order.id}, gigId: ${order.gigId}`);
            }

            // Get client details if viewing as freelancer
            let clientData = null;
            if (userType === 'freelancer' && order.clientId) {
              const clientDoc = await getDoc(doc(db, 'users', order.clientId));
              if (clientDoc.exists()) {
                clientData = { id: clientDoc.id, ...clientDoc.data() };
                console.log(`✅ [OrderService] Client data found for order ${order.id}:`, clientData.displayName);
              } else {
                console.log(`⚠️ [OrderService] No client data found for order ${order.id}, clientId: ${order.clientId}`);
              }
            }

            // Get freelancer details if viewing as client
            let freelancerData = null;
            if (userType === 'client' && order.freelancerId) {
              const freelancerDoc = await getDoc(doc(db, 'users', order.freelancerId));
              if (freelancerDoc.exists()) {
                freelancerData = { id: freelancerDoc.id, ...freelancerDoc.data() };
                console.log(`✅ [OrderService] Freelancer data found for order ${order.id}:`, freelancerData.displayName);
              } else {
                console.log(`⚠️ [OrderService] No freelancer data found for order ${order.id}, freelancerId: ${order.freelancerId}`);
              }
            }

            const enrichedOrder = {
              ...order,
              gig: gigData,
              client: clientData,
              freelancer: freelancerData
            };
            
            console.log(`✅ [OrderService] Order ${order.id} processed successfully`);
            return enrichedOrder;
          } catch (error) {
            console.error(`💥 [OrderService] Error getting details for order ${order.id}:`, error);
            return order;
          }
        })
      );
      
      console.log('✅ [OrderService] All orders processed:', {
        count: ordersWithDetails.length,
        orders: ordersWithDetails.map(o => ({
          id: o.id,
          title: o.title,
          hasGig: !!o.gig,
          hasClient: !!o.client,
          hasFreelancer: !!o.freelancer
        }))
      });
      
      return ordersWithDetails;
    } catch (error) {
      console.error('💥 [OrderService] Error getting orders with details:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(clientId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clientId', '==', clientId)
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      const stats = {
        total: orders.length,
        pending: orders.filter(order => order.status === 'pending').length,
        inProgress: orders.filter(order => order.status === 'in_progress').length,
        completed: orders.filter(order => order.status === 'completed').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length,
        totalSpent: orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + (order.price || 0), 0)
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting client stats:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0
      };
    }
  }

  // Get order statistics for freelancer
  async getFreelancerStats(freelancerId) {
    try {
      const { orders } = await this.getFreelancerOrders(freelancerId, { limitCount: null });
      
      const stats = {
        total: orders.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalEarnings: 0,
        averageOrderValue: 0,
        completionRate: 0
      };

      orders.forEach(order => {
        stats.totalEarnings += order.freelancerEarning || (order.price * 0.9) || 0;
        
        switch (order.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'in_progress':
          case 'in_review':
            stats.inProgress++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
        }
      });

      stats.averageOrderValue = stats.total > 0 ? stats.totalEarnings / stats.total : 0;
      stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting freelancer stats:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      await updateDoc(docRef, {
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
      
      // Only allow cancellation by client or freelancer and only if not completed
      if (order.clientId !== userId && order.freelancerId !== userId) {
        throw new Error('Only client or freelancer can cancel the order');
      }

      if (order.status === 'completed') {
        throw new Error('Cannot cancel completed order');
      }

      await updateDoc(doc(db, this.collectionName, orderId), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: userId,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send cancellation notification
      try {
        const chat = await chatService.findChatBetweenUsers(order.clientId, order.freelancerId);
        if (chat) {
          await chatService.sendOrderStatusMessage(
            chat.id,
            userId,
            orderId,
            'cancelled',
            reason
          );
        }
      } catch (chatError) {
        console.error('Error sending cancellation notification:', chatError);
      }

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService; 