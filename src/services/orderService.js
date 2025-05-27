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
  startAfter
} from 'firebase/firestore';
import { Order } from '../models/Order';

class OrderService {
  constructor() {
    this.collectionName = 'orders';
  }

  // Create new order
  async createOrder(orderData) {
    try {
      const order = new Order({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Validate order data
      const errors = order.validate();
      if (Object.keys(errors).length > 0) {
        throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
      }

      const docRef = await addDoc(collection(db, this.collectionName), order.toJSON());
      return { id: docRef.id, ...order.toJSON() };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrder(orderId) {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      const orderDoc = await getDoc(docRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      return {
        id: orderDoc.id,
        ...orderDoc.data()
      };
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      const updateData = {
        status,
        updatedAt: new Date(),
        ...additionalData
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      await updateDoc(docRef, updateData);
      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get client orders
  async getClientOrders(clientId, options = {}) {
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

      if (status) {
        q = query(q, where('status', '==', status));
      }

      q = query(q, orderBy(orderByField, orderDirection));

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        orders,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error getting client orders:', error);
      throw error;
    }
  }

  // Get freelancer orders
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

      q = query(q, orderBy(orderByField, orderDirection));

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        orders,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error getting freelancer orders:', error);
      throw error;
    }
  }

  // Get orders with user details
  async getOrdersWithDetails(userId, userType = 'client') {
    try {
      const field = userType === 'client' ? 'clientId' : 'freelancerId';
      const { orders } = await this[userType === 'client' ? 'getClientOrders' : 'getFreelancerOrders'](userId);
      
      // Get additional details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          try {
            // Get gig details
            const gigDoc = await getDoc(doc(db, 'gigs', order.gigId));
            let gigData = null;
            if (gigDoc.exists()) {
              gigData = { id: gigDoc.id, ...gigDoc.data() };
            }

            // Get client details if viewing as freelancer
            let clientData = null;
            if (userType === 'freelancer' && order.clientId) {
              const clientDoc = await getDoc(doc(db, 'users', order.clientId));
              if (clientDoc.exists()) {
                clientData = { id: clientDoc.id, ...clientDoc.data() };
              }
            }

            // Get freelancer details if viewing as client
            let freelancerData = null;
            if (userType === 'client' && order.freelancerId) {
              const freelancerDoc = await getDoc(doc(db, 'users', order.freelancerId));
              if (freelancerDoc.exists()) {
                freelancerData = { id: freelancerDoc.id, ...freelancerDoc.data() };
              }
            }

            return {
              ...order,
              gig: gigData,
              client: clientData,
              freelancer: freelancerData
            };
          } catch (error) {
            console.error(`Error getting details for order ${order.id}:`, error);
            return order;
          }
        })
      );
      
      return ordersWithDetails;
    } catch (error) {
      console.error('Error getting orders with details:', error);
      throw error;
    }
  }

  // Get order statistics for client
  async getClientStats(clientId) {
    try {
      const { orders } = await this.getClientOrders(clientId, { limitCount: null });
      
      const stats = {
        total: orders.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0,
        averageOrderValue: 0
      };

      orders.forEach(order => {
        stats.totalSpent += order.price || 0;
        
        switch (order.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'in_progress':
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

      stats.averageOrderValue = stats.total > 0 ? stats.totalSpent / stats.total : 0;

      return stats;
    } catch (error) {
      console.error('Error getting client stats:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      await updateDoc(docRef, {
        paymentStatus,
        updatedAt: new Date()
      });
      
      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService; 