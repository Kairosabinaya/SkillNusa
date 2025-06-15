import { db, auth } from '../firebase/config';
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
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { Order } from '../models/Order';
import chatService from './chatService';
import notificationService from './notificationService';

class OrderService {
  constructor() {
    this.collectionName = 'orders';
    this.subscriptions = new Map(); // Store active subscriptions
    this.ordersCollection = collection(db, this.collectionName);
    this.gigsCollection = collection(db, 'gigs');
    this.usersCollection = collection(db, 'users');
    
    // Production timeout settings
    this.paymentTimeoutMinutes = process.env.NODE_ENV === 'production' ? 60 : 5; // 60 min prod, 5 min dev
    this.confirmationTimeoutHours = 3; // Always 3 hours for confirmation
    
    console.log('📋 [OrderService] Initialized with config:', {
      paymentTimeoutMinutes: this.paymentTimeoutMinutes,
      confirmationTimeoutHours: this.confirmationTimeoutHours,
      environment: process.env.NODE_ENV
    });
  }

  // Generate order number
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SN${timestamp}${random}`;
  }

  // Create new order with enhanced workflow
  async createOrder(orderData) {
    try {
      console.log('📋 [OrderService] createOrder called with:', {
        clientId: orderData.clientId,
        freelancerId: orderData.freelancerId,
        gigId: orderData.gigId,
        packageType: orderData.packageType,
        price: orderData.price,
        title: orderData.title
      });

      // Enhanced validation
      const requiredFields = ['clientId', 'freelancerId', 'gigId', 'packageType', 'price', 'title'];
      const missingFields = requiredFields.filter(field => !orderData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (orderData.price <= 0) {
        throw new Error('Order price must be greater than 0');
      }

      if (orderData.clientId === orderData.freelancerId) {
        throw new Error('Client and freelancer cannot be the same user');
      }

      // Verify gig exists and belongs to freelancer
      const gigRef = doc(this.gigsCollection, orderData.gigId);
      const gigDoc = await getDoc(gigRef);
      
      if (!gigDoc.exists()) {
        throw new Error('Gig not found');
      }

      const gigData = gigDoc.data();
      if (gigData.userId !== orderData.freelancerId) {
        throw new Error('Gig does not belong to the specified freelancer');
      }

      // Verify client and freelancer exist
      const [clientDoc, freelancerDoc] = await Promise.all([
        getDoc(doc(this.usersCollection, orderData.clientId)),
        getDoc(doc(this.usersCollection, orderData.freelancerId))
      ]);

      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }

      if (!freelancerDoc.exists()) {
        throw new Error('Freelancer not found');
      }

      // Generate order number
      const orderNumber = this.generateOrderNumber();
      
      // Set payment expiry time based on environment
      const paymentExpiredAt = new Date();
      paymentExpiredAt.setMinutes(paymentExpiredAt.getMinutes() + this.paymentTimeoutMinutes);

      const newOrder = {
        // Basic order info
        orderNumber,
        clientId: orderData.clientId,
        freelancerId: orderData.freelancerId,
        gigId: orderData.gigId,
        
        // Package details
        packageType: orderData.packageType,
        title: orderData.title,
        description: orderData.description || '',
        price: orderData.price,
        totalAmount: orderData.totalAmount || orderData.price, // For backward compatibility
        
        // Service details
        deliveryTime: orderData.deliveryTime || 7,
        revisions: orderData.revisions || 3,
        requirements: orderData.requirements || '',
        
        // Status tracking
        status: orderData.status || 'draft',
        paymentStatus: orderData.paymentStatus || 'pending',
        paymentMethod: orderData.paymentMethod || 'qris',
        
        // Expiry settings - Production values
        paymentExpiredAt: paymentExpiredAt,
        
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Timeline tracking
        timeline: {
          created: serverTimestamp()
        },
        
        // Additional tracking
        autoCreated: false,
        version: '2.0'
      };

      console.log('📋 [OrderService] Creating order with data:', {
        orderNumber,
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus,
        paymentExpiredAt: paymentExpiredAt.toISOString(),
        paymentTimeoutMinutes: this.paymentTimeoutMinutes,
        environment: process.env.NODE_ENV
      });

      // Create order document
      const orderRef = await addDoc(this.ordersCollection, newOrder);
      
      console.log('✅ [OrderService] Order created successfully:', {
        orderId: orderRef.id,
        orderNumber,
        paymentExpiry: paymentExpiredAt.toISOString()
      });

      return {
        id: orderRef.id,
        orderNumber,
        ...newOrder,
        // Convert timestamp for return
        paymentExpiredAt: paymentExpiredAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ [OrderService] Error creating order:', error);
      
      // Provide more specific error messages
      if (error.message.includes('permission')) {
        throw new Error('You do not have permission to create orders');
      } else if (error.message.includes('not found')) {
        throw new Error(error.message);
      } else if (error.message.includes('same user')) {
        throw new Error('Cannot create order for yourself');
      }
      
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
      const docRef = doc(this.ordersCollection, orderId);
      const orderDoc = await getDoc(docRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = { id: orderDoc.id, ...orderDoc.data() };
      
      // Get additional details
      const [gigDoc, clientDoc, freelancerDoc] = await Promise.all([
        orderData.gigId ? getDoc(doc(this.gigsCollection, orderData.gigId)) : null,
        getDoc(doc(this.usersCollection, orderData.clientId)),
        getDoc(doc(this.usersCollection, orderData.freelancerId))
      ]);

      if (gigDoc && gigDoc.exists()) {
        orderData.gig = { id: gigDoc.id, ...gigDoc.data() };
      }

      if (clientDoc && clientDoc.exists()) {
        orderData.client = { id: clientDoc.id, ...clientDoc.data() };
      }

      if (freelancerDoc && freelancerDoc.exists()) {
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
      console.log('📋 [OrderService] updateOrderStatus called:', {
        orderId,
        newStatus,
        userId,
        additionalData: Object.keys(additionalData)
      });

      if (!orderId || !newStatus || !userId) {
        throw new Error('Missing required parameters for status update');
      }

      const orderRef = doc(this.ordersCollection, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Verify user has permission to update this order
      if (orderData.clientId !== userId && orderData.freelancerId !== userId) {
        throw new Error('You do not have permission to update this order');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(orderData.status, newStatus, userId, orderData)) {
        throw new Error(`Invalid status transition from ${orderData.status} to ${newStatus}`);
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      // Add timeline entry
      if (newStatus === 'active' && orderData.status === 'pending') {
        updateData['timeline.confirmed'] = serverTimestamp();
        
        // Set work deadline - use deliveryTime from order
        const workDeadline = new Date();
        workDeadline.setDate(workDeadline.getDate() + (orderData.deliveryTime || 7));
        updateData.workDeadline = workDeadline;
        
        console.log('⏰ [OrderService] Setting work deadline:', {
          orderId,
          deliveryDays: orderData.deliveryTime || 7,
          workDeadline: workDeadline.toISOString()
        });
      } else if (newStatus === 'in_progress') {
        updateData['timeline.started'] = serverTimestamp();
      } else if (newStatus === 'submitted') {
        updateData['timeline.submitted'] = serverTimestamp();
        updateData.submittedAt = serverTimestamp();
      } else if (newStatus === 'completed') {
        updateData['timeline.completed'] = serverTimestamp();
        updateData.completedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        updateData['timeline.cancelled'] = serverTimestamp();
        updateData.cancelledAt = serverTimestamp();
      }

      // Update order
      await updateDoc(orderRef, updateData);

      console.log('✅ [OrderService] Order status updated successfully:', {
        orderId,
        oldStatus: orderData.status,
        newStatus,
        userId
      });

      // Send notifications to both client and freelancer
      try {
        // Determine user types and send appropriate notifications
        const isClientUpdate = userId === orderData.clientId;
        const isFreelancerUpdate = userId === orderData.freelancerId;

        if (isClientUpdate) {
          // Client updated status, notify freelancer
          await notificationService.createOrderStatusNotification(
            orderId,
            orderData.freelancerId,
            'freelancer',
            newStatus,
            { updatedBy: 'client' }
          );
        } else if (isFreelancerUpdate) {
          // Freelancer updated status, notify client
          await notificationService.createOrderStatusNotification(
            orderId,
            orderData.clientId,
            'client',
            newStatus,
            { updatedBy: 'freelancer' }
          );
        }

        console.log('✅ [OrderService] Notification sent for status update:', {
          orderId,
          newStatus,
          notifiedUser: isClientUpdate ? orderData.freelancerId : orderData.clientId
        });
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending status notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      return {
        success: true,
        orderId,
        oldStatus: orderData.status,
        newStatus,
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ [OrderService] Error updating order status:', error);
      throw error;
    }
  }

  isValidStatusTransition(currentStatus, newStatus, userId, orderData) {
    // Define valid transitions
    const validTransitions = {
      'draft': ['payment', 'cancelled'],
      'payment': ['pending', 'cancelled'], // Payment successful -> pending for freelancer confirmation
      'pending': ['active', 'cancelled'], // Freelancer can accept (active) or client can cancel
      'active': ['delivered', 'cancelled'], // Freelancer working -> delivered or cancelled
      'delivered': ['in_revision', 'completed', 'cancelled'], // Client can request revision or complete
      'in_revision': ['delivered', 'cancelled'], // Freelancer resubmits or cancelled
      'completed': [], // Terminal state
      'cancelled': []  // Terminal state
    };

    if (!validTransitions[currentStatus]) {
      return false;
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return false;
    }

    // Additional permission checks
    if (newStatus === 'active' && userId !== orderData.freelancerId) {
      return false; // Only freelancer can accept order
    }

    if (newStatus === 'delivered' && userId !== orderData.freelancerId) {
      return false; // Only freelancer can deliver work
    }

    if (newStatus === 'completed' && userId !== orderData.clientId) {
      return false; // Only client can mark as completed
    }

    if (newStatus === 'in_revision' && userId !== orderData.clientId) {
      return false; // Only client can request revision
    }

    return true;
  }

  // Deliver order with message and files
  async deliverOrder(orderId, userId, deliveryData = {}) {
    try {
      console.log('📦 [OrderService] deliverOrder called:', {
        orderId,
        userId,
        hasMessage: !!deliveryData.message,
        fileCount: deliveryData.files?.length || 0
      });

      // Get current order to validate
      const orderDoc = await getDoc(doc(this.ordersCollection, orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Validate that user is the freelancer
      if (orderData.freelancerId !== userId) {
        throw new Error('Only the freelancer can deliver this order');
      }

      // Validate current status allows delivery
      if (!['active', 'in_revision'].includes(orderData.status)) {
        throw new Error(`Cannot deliver order with status: ${orderData.status}`);
      }

      // Prepare delivery data
      const deliveryUpdate = {
        status: 'delivered',
        deliveryMessage: deliveryData.message || '',
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: {
          ...orderData.timeline,
          delivered: serverTimestamp()
        }
      };

      // Add files if provided
      if (deliveryData.files && deliveryData.files.length > 0) {
        deliveryUpdate.deliveryFiles = deliveryData.files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url || null // URL would be set after upload
        }));
      }

      // Update order status to delivered
      await updateDoc(doc(this.ordersCollection, orderId), deliveryUpdate);

      console.log('✅ [OrderService] Order delivered successfully:', {
        orderId,
        message: deliveryData.message,
        fileCount: deliveryData.files?.length || 0
      });

      // Send notification to client about delivery
      try {
        await notificationService.createOrderStatusNotification(
          orderId,
          orderData.clientId,
          'client',
          'delivered',
          { 
            deliveryMessage: deliveryData.message,
            fileCount: deliveryData.files?.length || 0
          }
        );
        console.log('✅ [OrderService] Delivery notification sent to client');
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending delivery notification:', notificationError);
      }

      return {
        success: true,
        orderId,
        status: 'delivered',
        deliveredAt: new Date()
      };

    } catch (error) {
      console.error('❌ [OrderService] Error delivering order:', error);
      throw error;
    }
  }

  // Request revision for delivered order
  async requestRevision(orderId, userId, revisionMessage) {
    try {
      console.log('🔄 [OrderService] requestRevision called:', {
        orderId,
        userId,
        hasMessage: !!revisionMessage
      });

      // Get current order to validate
      const orderDoc = await getDoc(doc(this.ordersCollection, orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Validate that user is the client
      if (orderData.clientId !== userId) {
        throw new Error('Only the client can request revision for this order');
      }

      // Validate current status allows revision request
      if (orderData.status !== 'delivered') {
        throw new Error(`Cannot request revision for order with status: ${orderData.status}`);
      }

      // Check revision limits
      const currentRevisions = orderData.revisionRequests?.length || 0;
      const maxRevisions = orderData.revisions || 3; // Default to 3 revisions

      if (currentRevisions >= maxRevisions) {
        throw new Error(`Maximum revision limit (${maxRevisions}) has been reached`);
      }

      // Prepare revision request data
      const revisionRequest = {
        message: revisionMessage,
        requestedAt: serverTimestamp(),
        requestedBy: userId
      };

      // Update order with revision request
      const revisionUpdate = {
        status: 'in_revision',
        revisionRequests: arrayUnion(revisionRequest),
        updatedAt: serverTimestamp(),
        timeline: {
          ...orderData.timeline,
          revision_requested: serverTimestamp()
        }
      };

      await updateDoc(doc(this.ordersCollection, orderId), revisionUpdate);

      console.log('✅ [OrderService] Revision requested successfully:', {
        orderId,
        revisionCount: currentRevisions + 1,
        maxRevisions,
        message: revisionMessage
      });

      // Send notification to freelancer about revision request
      try {
        await notificationService.createOrderStatusNotification(
          orderId,
          orderData.freelancerId,
          'freelancer',
          'in_revision',
          { 
            revisionMessage: revisionMessage,
            revisionCount: currentRevisions + 1,
            maxRevisions
          }
        );
        console.log('✅ [OrderService] Revision notification sent to freelancer');
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending revision notification:', notificationError);
      }

      return {
        success: true,
        orderId,
        status: 'in_revision',
        revisionCount: currentRevisions + 1,
        maxRevisions
      };

    } catch (error) {
      console.error('❌ [OrderService] Error requesting revision:', error);
      throw error;
    }
  }

  // Complete revision and re-deliver order
  async completeRevision(orderId, userId, deliveryData = {}) {
    try {
      console.log('🔄 [OrderService] completeRevision called:', {
        orderId,
        userId,
        hasMessage: !!deliveryData.message,
        hasFiles: !!deliveryData.files?.length
      });

      // Get current order to validate
      const orderDoc = await getDoc(doc(this.ordersCollection, orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();
      
      // Validate that user is the freelancer
      if (orderData.freelancerId !== userId) {
        throw new Error('Only the freelancer can complete revision for this order');
      }

      // Validate current status allows revision completion
      if (orderData.status !== 'in_revision') {
        throw new Error(`Cannot complete revision for order with status: ${orderData.status}`);
      }

      // Prepare revision completion data
      const revisionCompletion = {
        message: deliveryData.message || 'Revision completed',
        files: deliveryData.files || [],
        completedAt: serverTimestamp(),
        completedBy: userId
      };

      // Update order with revision completion
      const revisionUpdate = {
        status: 'delivered',
        revisionCompletions: arrayUnion(revisionCompletion),
        updatedAt: serverTimestamp(),
        timeline: {
          ...orderData.timeline,
          revision_completed: serverTimestamp(),
          delivered: serverTimestamp() // Update delivered timestamp
        }
      };

      await updateDoc(doc(this.ordersCollection, orderId), revisionUpdate);

      console.log('✅ [OrderService] Revision completed successfully:', {
        orderId,
        message: deliveryData.message,
        fileCount: deliveryData.files?.length || 0
      });

      // Send notification to client about revision completion
      try {
        await notificationService.createOrderStatusNotification(
          orderId,
          orderData.clientId,
          'client',
          'delivered',
          { 
            revisionCompleted: true,
            deliveryMessage: deliveryData.message,
            fileCount: deliveryData.files?.length || 0
          }
        );
        console.log('✅ [OrderService] Revision completion notification sent to client');
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending revision completion notification:', notificationError);
      }

      return {
        success: true,
        orderId,
        status: 'delivered',
        completedAt: new Date()
      };

    } catch (error) {
      console.error('❌ [OrderService] Error completing revision:', error);
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
        this.ordersCollection,
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
    console.log('🔍 [OrderService] getFreelancerOrders called with:', { freelancerId, options });
    
    try {
      const { 
        status = null, 
        limitCount = 20, 
        orderByField = 'createdAt', 
        orderDirection = 'desc',
        lastDoc = null 
      } = options;

      let q = query(
        this.ordersCollection,
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

      console.log('📡 [OrderService] Executing query for freelancerId:', freelancerId);
      const querySnapshot = await getDocs(q);
      console.log('📥 [OrderService] Query result size:', querySnapshot.size);
      
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        console.log('📋 [OrderService] Found order:', {
          id: doc.id,
          freelancerId: orderData.freelancerId,
          clientId: orderData.clientId,
          title: orderData.title,
          status: orderData.status
        });
        
        orders.push({
          id: doc.id,
          ...orderData
        });
      });

      // If no orders found, try debugging by checking all orders
      if (orders.length === 0) {
        console.log('⚠️ [OrderService] No orders found for freelancerId, checking all orders...');
        
        // Check all orders to see what freelancerIds exist
        const allOrdersQuery = query(this.ordersCollection);
        const allOrdersSnapshot = await getDocs(allOrdersQuery);
        
        console.log('📊 [OrderService] Total orders in database:', allOrdersSnapshot.size);
        
        const freelancerIds = new Set();
        allOrdersSnapshot.forEach(doc => {
          const orderData = doc.data();
          if (orderData.freelancerId) {
            freelancerIds.add(orderData.freelancerId);
          }
        });
        
        console.log('👥 [OrderService] Unique freelancer IDs found:', Array.from(freelancerIds));
        console.log('🔍 [OrderService] Looking for freelancerId:', freelancerId);
        console.log('✅ [OrderService] Match found:', freelancerIds.has(freelancerId));
      }

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
      
      console.log('✅ [OrderService] getFreelancerOrders returning:', {
        count: limitedOrders.length,
        hasMore: orders.length > limitedOrders.length
      });
      
      return {
        orders: limitedOrders,
        lastDoc: null, // Simplified pagination for now
        hasMore: orders.length > limitedOrders.length
      };
    } catch (error) {
      console.error('💥 [OrderService] Error getting freelancer orders:', error);
      throw error;
    }
  }

  // Get orders with enhanced user details
  async getOrdersWithDetails(userId, userType = 'client') {
    try {
      console.log('🔍 [OrderService] getOrdersWithDetails called:', { userId, userType });

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Query orders based on user type
      const fieldName = userType === 'client' ? 'clientId' : 'freelancerId';
      const ordersQuery = query(
        this.ordersCollection,
        where(fieldName, '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to prevent excessive data loading
      );

      const querySnapshot = await getDocs(ordersQuery);
      
      if (querySnapshot.empty) {
        console.log('📋 [OrderService] No orders found for user:', userId);
        return [];
      }

      console.log('📋 [OrderService] Found', querySnapshot.size, 'orders for user:', userId);

      // Get orders with additional details
      const ordersWithDetails = [];
      
      for (const orderDoc of querySnapshot.docs) {
        const orderData = orderDoc.data();
        const orderId = orderDoc.id;

        try {
          // Get gig details
          let gigData = null;
          if (orderData.gigId) {
            const gigDoc = await getDoc(doc(this.gigsCollection, orderData.gigId));
            if (gigDoc.exists()) {
              gigData = gigDoc.data();
            }
          }

          // Get user details (client or freelancer based on userType)
          let userData = null;
          const otherUserId = userType === 'client' ? orderData.freelancerId : orderData.clientId;
          
          if (otherUserId) {
            const userDoc = await getDoc(doc(this.usersCollection, otherUserId));
            if (userDoc.exists()) {
              const userDocData = userDoc.data();
              userData = {
                displayName: userDocData.displayName || 'Unknown User',
                profilePhoto: userDocData.profilePhoto || null,
                email: userDocData.email || null
              };
              console.log(`📋 [OrderService] User data loaded for ${userType}:`, {
                orderId,
                otherUserId,
                displayName: userDocData.displayName,
                hasProfilePhoto: !!userDocData.profilePhoto,
                email: userDocData.email
              });
            } else {
              console.warn(`⚠️ [OrderService] User document not found:`, {
                orderId,
                userType,
                otherUserId,
                freelancerId: orderData.freelancerId,
                clientId: orderData.clientId
              });
            }
          } else {
            console.warn(`⚠️ [OrderService] No otherUserId found:`, {
              orderId,
              userType,
              freelancerId: orderData.freelancerId,
              clientId: orderData.clientId
            });
          }

          // Convert Firestore timestamps to JavaScript dates
          const processedOrder = {
            id: orderId,
            ...orderData,
            createdAt: orderData.createdAt?.toDate?.() || new Date(),
            updatedAt: orderData.updatedAt?.toDate?.() || new Date(),
            paymentExpiredAt: orderData.paymentExpiredAt?.toDate?.() || null,
            confirmationDeadline: orderData.confirmationDeadline?.toDate?.() || null,
            workDeadline: orderData.workDeadline?.toDate?.() || null,
            paidAt: orderData.paidAt?.toDate?.() || null,
            completedAt: orderData.completedAt?.toDate?.() || null,
            cancelledAt: orderData.cancelledAt?.toDate?.() || null,
            gigData,
            [userType === 'client' ? 'freelancer' : 'client']: userData
          };

          ordersWithDetails.push(processedOrder);

        } catch (detailError) {
          console.error('⚠️ [OrderService] Error loading details for order:', orderId, detailError);
          console.error('⚠️ [OrderService] Order data that failed:', {
            orderId,
            freelancerId: orderData.freelancerId,
            clientId: orderData.clientId,
            gigId: orderData.gigId,
            userType
          });
          
          // Include order without details rather than failing completely
          ordersWithDetails.push({
            id: orderId,
            ...orderData,
            createdAt: orderData.createdAt?.toDate?.() || new Date(),
            updatedAt: orderData.updatedAt?.toDate?.() || new Date(),
            gigData: null,
            [userType === 'client' ? 'freelancerData' : 'clientData']: null,
            _loadError: true
          });
        }
      }

      console.log('✅ [OrderService] Orders with details loaded:', {
        userId,
        userType,
        totalOrders: ordersWithDetails.length,
        statusBreakdown: ordersWithDetails.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {})
      });

      return ordersWithDetails;

    } catch (error) {
      console.error('❌ [OrderService] Error getting orders with details:', error);
      throw error;
    }
  }

  // Get client statistics
  async getClientStats(clientId) {
    try {
      const q = query(
        this.ordersCollection,
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
      const docRef = doc(this.ordersCollection, orderId);
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

  // Complete payment and move to pending status
  async completePayment(orderId, paymentData = {}) {
    try {
      const order = await this.getOrder(orderId);
      
      // Validate order is in payment status
      if (order.status !== 'payment') {
        throw new Error(`Cannot complete payment for order with status '${order.status}'. Order must be in payment status.`);
      }

      // Update order status to pending and add payment information
      await updateDoc(doc(this.ordersCollection, orderId), {
        status: 'pending',
        paymentStatus: 'paid',
        paymentCompletedAt: serverTimestamp(),
        paymentData: paymentData,
        updatedAt: serverTimestamp()
      });

      // Send notification to freelancer about new order
      try {
        await notificationService.createOrderStatusNotification(
          orderId,
          order.freelancerId,
          'freelancer',
          'pending',
          { 
            paymentCompleted: true,
            gigTitle: order.title,
            packageType: order.packageType,
            price: order.price
          }
        );
        console.log('✅ [OrderService] Payment completion notification sent to freelancer');
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending payment notification:', notificationError);
      }

      // Now create chat and send notification since payment is complete
      try {
        const chat = await chatService.createOrGetChat(
          order.clientId, 
          order.freelancerId, 
          order.gigId,
          orderId
        );

        // Send order notification to freelancer
        await chatService.sendOrderNotificationMessage(
          chat.id,
          order.clientId, // Client is sending the notification
          orderId,
          {
            gigTitle: order.title,
            packageType: order.packageType,
            price: order.price,
            clientRequirements: order.requirements
          }
        );
      } catch (chatError) {
        console.error('Error creating chat notification after payment:', chatError);
        // Don't fail the payment completion if chat fails
      }

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error completing payment:', error);
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

      await updateDoc(doc(this.ordersCollection, orderId), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: userId,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification to the other party about cancellation
      try {
        const notifyUserId = userId === order.clientId ? order.freelancerId : order.clientId;
        const notifyUserType = userId === order.clientId ? 'freelancer' : 'client';
        
        await notificationService.createOrderStatusNotification(
          orderId,
          notifyUserId,
          notifyUserType,
          'cancelled',
          { 
            cancellationReason: reason,
            cancelledBy: userId === order.clientId ? 'client' : 'freelancer'
          }
        );
        console.log('✅ [OrderService] Cancellation notification sent');
      } catch (notificationError) {
        console.error('❌ [OrderService] Error sending cancellation notification:', notificationError);
      }

      // Send cancellation notification via chat
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
        console.error('Error sending chat cancellation notification:', chatError);
      }

      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Subscribe to real-time order updates for a user
  subscribeToUserOrders(userId, userType, callback) {
    try {
      const subscriptionKey = `${userId}_${userType}_orders`;
      
      console.log('🔄 [OrderService] Setting up subscription:', subscriptionKey);
      
      // Clean up existing subscription if it exists
      if (this.subscriptions.has(subscriptionKey)) {
        console.log('🧹 [OrderService] Cleaning up existing subscription:', subscriptionKey);
        const existingUnsubscribe = this.subscriptions.get(subscriptionKey);
        if (existingUnsubscribe && typeof existingUnsubscribe === 'function') {
          existingUnsubscribe();
        }
        this.subscriptions.delete(subscriptionKey);
      }

      const userField = userType === 'freelancer' ? 'freelancerId' : 'clientId';
      
      const q = query(
        this.ordersCollection,
        where(userField, '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        async (snapshot) => {
          console.log(`📊 [OrderService] Orders update for ${userId} (${userType}):`, snapshot.size);
          
          try {
            // If no orders, immediately call callback with empty array
            if (snapshot.empty) {
              console.log('📭 [OrderService] No orders found for user');
              callback([]);
              return;
            }
            
            // Get orders with enhanced details
            const orders = [];
            const promises = [];
            
            snapshot.forEach((docSnapshot) => {
              const orderData = { id: docSnapshot.id, ...docSnapshot.data() };
              promises.push(this.getOrderWithDetails(orderData));
            });
            
            // Process all orders in parallel for better performance
            const enhancedOrders = await Promise.all(promises);
            
            console.log(`✅ [OrderService] Processed ${enhancedOrders.length} orders for ${userId}`);
            callback(enhancedOrders);
          } catch (error) {
            console.error('❌ [OrderService] Error processing order updates:', error);
            // Don't call callback with empty array on error - it might cause loading state issues
            // Instead, try to get basic order data without enhancement
            try {
              const basicOrders = [];
              snapshot.forEach((docSnapshot) => {
                basicOrders.push({ id: docSnapshot.id, ...docSnapshot.data() });
              });
              console.log('⚠️ [OrderService] Fallback to basic orders:', basicOrders.length);
              callback(basicOrders);
            } catch (fallbackError) {
              console.error('❌ [OrderService] Fallback also failed:', fallbackError);
              callback([]);
            }
          }
        },
        (error) => {
          console.error('❌ [OrderService] Error in order subscription:', error);
          // Don't immediately call callback on error - let the component handle timeout
          if (error.code === 'permission-denied') {
            console.error('❌ [OrderService] Permission denied - user may not have access');
          }
        }
      );

      this.subscriptions.set(subscriptionKey, unsubscribe);
      console.log('✅ [OrderService] Subscription established:', subscriptionKey);
      return unsubscribe;
    } catch (error) {
      console.error('❌ [OrderService] Error setting up order subscription:', error);
      return () => {};
    }
  }

  // Force cleanup subscription (for debugging)
  forceCleanupSubscription(userId, userType) {
    const subscriptionKey = `${userId}_${userType}_orders`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      console.log('🧹 [OrderService] Force cleanup subscription:', subscriptionKey);
      const unsubscribe = this.subscriptions.get(subscriptionKey);
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      this.subscriptions.delete(subscriptionKey);
      return true;
    }
    
    return false;
  }

  // Helper method to get order with details (used by subscription)
  async getOrderWithDetails(orderData) {
    try {
      console.log('🔍 [OrderService] getOrderWithDetails called for order:', orderData.id);

      // Get gig details
      let gigData = null;
      if (orderData.gigId) {
        const gigDoc = await getDoc(doc(this.gigsCollection, orderData.gigId));
        if (gigDoc.exists()) {
          gigData = { id: gigDoc.id, ...gigDoc.data() };
        }
      }

      // Get client details
      let clientData = null;
      if (orderData.clientId) {
        console.log('🔍 [OrderService] Loading client data for:', orderData.clientId);
        const clientDoc = await getDoc(doc(this.usersCollection, orderData.clientId));
        if (clientDoc.exists()) {
          const rawClientData = clientDoc.data();
          clientData = {
            displayName: rawClientData.displayName || 'Unknown User',
            profilePhoto: rawClientData.profilePhoto || null,
            email: rawClientData.email || null
          };
          console.log('✅ [OrderService] Client data loaded:', {
            orderId: orderData.id,
            clientId: orderData.clientId,
            displayName: clientData.displayName
          });
        } else {
          console.warn('⚠️ [OrderService] Client document not found:', orderData.clientId);
        }
      }

      // Get freelancer details
      let freelancerData = null;
      if (orderData.freelancerId) {
        console.log('🔍 [OrderService] Loading freelancer data for:', orderData.freelancerId);
        const freelancerDoc = await getDoc(doc(this.usersCollection, orderData.freelancerId));
        if (freelancerDoc.exists()) {
          const rawFreelancerData = freelancerDoc.data();
          freelancerData = {
            displayName: rawFreelancerData.displayName || 'Unknown User',
            profilePhoto: rawFreelancerData.profilePhoto || null,
            email: rawFreelancerData.email || null
          };
          console.log('✅ [OrderService] Freelancer data loaded:', {
            orderId: orderData.id,
            freelancerId: orderData.freelancerId,
            displayName: freelancerData.displayName
          });
        } else {
          console.warn('⚠️ [OrderService] Freelancer document not found:', orderData.freelancerId);
        }
      }

      // Convert Firestore timestamps to JavaScript dates
      const processedOrder = {
        ...orderData,
        createdAt: orderData.createdAt?.toDate?.() || new Date(),
        updatedAt: orderData.updatedAt?.toDate?.() || new Date(),
        paymentExpiredAt: orderData.paymentExpiredAt?.toDate?.() || null,
        confirmationDeadline: orderData.confirmationDeadline?.toDate?.() || null,
        workDeadline: orderData.workDeadline?.toDate?.() || null,
        paidAt: orderData.paidAt?.toDate?.() || null,
        completedAt: orderData.completedAt?.toDate?.() || null,
        cancelledAt: orderData.cancelledAt?.toDate?.() || null,
        gigData,
        client: clientData,      // Use 'client' to match OrderCard expectations
        freelancer: freelancerData   // Use 'freelancer' to match OrderCard expectations
      };

      console.log('✅ [OrderService] Order with details processed:', {
        orderId: orderData.id,
        hasGigData: !!gigData,
        hasClient: !!clientData,
        hasFreelancer: !!freelancerData,
        clientDisplayName: clientData?.displayName,
        freelancerDisplayName: freelancerData?.displayName
      });

      return processedOrder;
    } catch (error) {
      console.error('❌ [OrderService] Error getting order details:', error);
      return {
        ...orderData,
        gigData: null,
        client: null,
        freelancer: null,
        _loadError: true
      };
    }
  }

  // Clean up subscriptions
  cleanup(userId = null) {
    if (userId) {
      // Clean up specific user subscriptions
      for (const [key, unsubscribe] of this.subscriptions.entries()) {
        if (key.startsWith(userId)) {
          console.log('🧹 [OrderService] Cleaning up subscription:', key);
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
          this.subscriptions.delete(key);
        }
      }
    } else {
      // Clean up all subscriptions
      console.log('🧹 [OrderService] Cleaning up all subscriptions');
      this.subscriptions.forEach((unsubscribe, key) => {
        console.log('🧹 [OrderService] Cleaning up subscription:', key);
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.subscriptions.clear();
    }
  }

  // Force cleanup specific subscription
  forceCleanupSubscription(userId, userType) {
    const subscriptionKey = `${userId}_${userType}_orders`;
    const unsubscribe = this.subscriptions.get(subscriptionKey);
    if (unsubscribe && typeof unsubscribe === 'function') {
      console.log('🧹 [OrderService] Force cleaning up subscription:', subscriptionKey);
      unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      return true;
    }
    return false;
  }

  // Helper method to check if payment is expired
  isPaymentExpired(order) {
    if (!order.paymentExpiredAt) return false;
    
    const expiredAt = order.paymentExpiredAt instanceof Date 
      ? order.paymentExpiredAt 
      : order.paymentExpiredAt.toDate();
      
    return expiredAt <= new Date();
  }

  // Helper method to check if confirmation is expired
  isConfirmationExpired(order) {
    if (!order.confirmationDeadline) return false;
    
    const deadline = order.confirmationDeadline instanceof Date 
      ? order.confirmationDeadline 
      : order.confirmationDeadline.toDate();
      
    return deadline <= new Date();
  }

  // Batch update expired orders (used by cron job)
  async updateExpiredOrders() {
    try {
      console.log('⏰ [OrderService] Checking for expired orders...');
      
      const now = new Date();
      const batch = writeBatch(db);
      let updatedCount = 0;

      // Get payment expired orders
      const paymentExpiredQuery = query(
        this.ordersCollection,
        where('status', '==', 'payment'),
        where('paymentExpiredAt', '<=', now),
        limit(100)
      );

      const paymentExpiredSnapshot = await getDocs(paymentExpiredQuery);
      
      paymentExpiredSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'cancelled',
          paymentStatus: 'expired',
          cancellationReason: 'Payment timeout',
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          'timeline.cancelled': serverTimestamp()
        });
        updatedCount++;
      });

      // Get confirmation expired orders
      const confirmationExpiredQuery = query(
        this.ordersCollection,
        where('status', '==', 'pending'),
        where('confirmationDeadline', '<=', now),
        limit(100)
      );

      const confirmationExpiredSnapshot = await getDocs(confirmationExpiredQuery);
      
      confirmationExpiredSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'cancelled',
          cancellationReason: 'Freelancer confirmation timeout',
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          'timeline.cancelled': serverTimestamp(),
          refundStatus: 'pending' // Mark for refund
        });
        updatedCount++;
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ [OrderService] Updated ${updatedCount} expired orders`);
      } else {
        console.log('✅ [OrderService] No expired orders found');
      }

      return { updatedCount };

    } catch (error) {
      console.error('❌ [OrderService] Error updating expired orders:', error);
      throw error;
    }
  }

  // Get order by ID with details
  async getOrderById(orderId, userId = null) {
    try {
      console.log('🔍 [OrderService] getOrderById called:', { orderId, userId });

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const orderRef = doc(this.ordersCollection, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();

      // Verify permission if userId provided
      if (userId && orderData.clientId !== userId && orderData.freelancerId !== userId) {
        throw new Error('You do not have permission to view this order');
      }

      // Get additional details
      const [gigDoc, clientDoc, freelancerDoc] = await Promise.all([
        orderData.gigId ? getDoc(doc(this.gigsCollection, orderData.gigId)) : null,
        getDoc(doc(this.usersCollection, orderData.clientId)),
        getDoc(doc(this.usersCollection, orderData.freelancerId))
      ]);

      const result = {
        id: orderId,
        ...orderData,
        // Convert timestamps
        createdAt: orderData.createdAt?.toDate?.() || new Date(),
        updatedAt: orderData.updatedAt?.toDate?.() || new Date(),
        paymentExpiredAt: orderData.paymentExpiredAt?.toDate?.() || null,
        confirmationDeadline: orderData.confirmationDeadline?.toDate?.() || null,
        workDeadline: orderData.workDeadline?.toDate?.() || null,
        paidAt: orderData.paidAt?.toDate?.() || null,
        completedAt: orderData.completedAt?.toDate?.() || null,
        cancelledAt: orderData.cancelledAt?.toDate?.() || null,
        // Additional data
        gigData: gigDoc?.exists() ? gigDoc.data() : null,
        clientData: clientDoc?.exists() ? {
          displayName: clientDoc.data().displayName || 'Unknown Client',
          profilePhoto: clientDoc.data().profilePhoto || null,
          email: clientDoc.data().email || null
        } : null,
        freelancerData: freelancerDoc?.exists() ? {
          displayName: freelancerDoc.data().displayName || 'Unknown Freelancer',
          profilePhoto: freelancerDoc.data().profilePhoto || null,
          email: freelancerDoc.data().email || null
        } : null
      };

      console.log('✅ [OrderService] Order retrieved successfully:', {
        orderId,
        status: result.status,
        hasGigData: !!result.gigData,
        hasClientData: !!result.clientData,
        hasFreelancerData: !!result.freelancerData
      });

      return result;

    } catch (error) {
      console.error('❌ [OrderService] Error getting order by ID:', error);
      throw error;
    }
  }

  // Test function to create manual notification (for debugging)
  async testCreateNotification(userId, userType = 'client') {
    try {
      console.log('🧪 [OrderService] Testing notification creation:', { userId, userType });
      
      const testNotification = await notificationService.createOrderStatusNotification(
        'TEST_ORDER_ID',
        userId,
        userType,
        'pending',
        { 
          test: true,
          createdAt: new Date().toISOString()
        }
      );
      
      console.log('✅ [OrderService] Test notification created:', testNotification);
      return testNotification;
    } catch (error) {
      console.error('❌ [OrderService] Error creating test notification:', error);
      throw error;
    }
  }

  // Get configuration
  getConfig() {
    return {
      paymentTimeoutMinutes: this.paymentTimeoutMinutes,
      confirmationTimeoutHours: this.confirmationTimeoutHours,
      environment: process.env.NODE_ENV
    };
  }
}

const orderService = new OrderService();
export default orderService; 