import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase/config';

// Debug utilities untuk testing Firestore connection dan queries
export const debugFirestore = {
  // Get current user info
  getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
      console.log('Current user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      return user.uid;
    } else {
      console.log('No user currently logged in');
      return null;
    }
  },

  // Test basic connection
  async testConnection() {
    console.log('🧪 Testing Firestore connection...');
    try {
      const testQuery = query(collection(db, 'test'));
      const snapshot = await getDocs(testQuery);
      console.log('✅ Firestore connection OK, test collection size:', snapshot.size);
      return true;
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
      return false;
    }
  },

  // Test specific collection
  async testCollection(collectionName, userId = null) {
    console.log(`🧪 Testing collection: ${collectionName}`);
    try {
      let q = query(collection(db, collectionName));
      
      if (userId) {
        q = query(collection(db, collectionName), where('userId', '==', userId));
        console.log(`📡 Testing with userId filter: ${userId}`);
      }
      
      const snapshot = await getDocs(q);
      console.log(`✅ Collection ${collectionName} query successful:`, {
        size: snapshot.size,
        empty: snapshot.empty,
        docs: snapshot.docs.length
      });
      
      // Log first few documents
      const docs = [];
      snapshot.forEach((doc, index) => {
        if (index < 3) { // Only log first 3
          docs.push({
            id: doc.id,
            data: doc.data()
          });
        }
      });
      
      if (docs.length > 0) {
        console.log(`📄 Sample documents from ${collectionName}:`, docs);
      }
      
      return {
        success: true,
        size: snapshot.size,
        docs: docs
      };
    } catch (error) {
      console.error(`❌ Error testing collection ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test favorites for specific user
  async testFavorites(userId) {
    console.log('🧪 Testing favorites for user:', userId);
    return await this.testCollection('favorites', userId);
  },

  // Test cart for specific user
  async testCart(userId) {
    console.log('🧪 Testing cart for user:', userId);
    return await this.testCollection('cartItems', userId);
  },

  // Test orders for specific user
  async testOrders(userId) {
    console.log('🧪 Testing orders for user:', userId);
    return await this.testCollection('orders', userId);
  },

  // Create test favorite
  async createTestFavorite(userId, gigId = 'test-gig-123') {
    console.log('🧪 Creating test favorite...');
    try {
      const testFavorite = {
        userId,
        gigId,
        gigData: {
          title: 'Test Gig',
          images: ['https://picsum.photos/400/300'],
          rating: 5.0,
          totalReviews: 10,
          packages: {
            basic: { price: 100000 }
          },
          category: 'Test'
        },
        freelancerData: {
          displayName: 'Test Freelancer',
          profilePhoto: 'https://picsum.photos/40/40'
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'favorites'), testFavorite);
      console.log('✅ Test favorite created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating test favorite:', error);
      return null;
    }
  },

  // Create test cart item
  async createTestCartItem(userId, gigId = 'test-gig-123') {
    console.log('🧪 Creating test cart item...');
    try {
      const testCartItem = {
        userId,
        gigId,
        freelancerId: 'test-freelancer-123',
        packageType: 'basic',
        quantity: 1,
        gigData: {
          title: 'Test Gig',
          images: ['https://picsum.photos/400/300'],
          category: 'Test',
          rating: 5.0,
          totalReviews: 10
        },
        packageData: {
          name: 'Basic Package',
          description: 'Test package',
          price: 100000,
          deliveryTime: 7,
          revisions: 3,
          features: ['Feature 1', 'Feature 2']
        },
        freelancerData: {
          displayName: 'Test Freelancer',
          profilePhoto: 'https://picsum.photos/40/40'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'cartItems'), testCartItem);
      console.log('✅ Test cart item created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating test cart item:', error);
      return null;
    }
  },

  // Create test order
  async createTestOrder(userId, gigId = 'test-gig-123') {
    console.log('🧪 Creating test order...');
    try {
      const testOrder = {
        clientId: userId,
        freelancerId: 'test-freelancer-123',
        gigId,
        orderNumber: `ORD-TEST-${Date.now()}`,
        status: 'pending',
        paymentStatus: 'pending',
        packageType: 'basic',
        title: 'Test Gig Order',
        description: 'Test package description',
        price: 100000,
        deliveryTime: 7,
        revisions: 3,
        requirements: 'Test requirements',
        paymentMethod: 'bank_transfer',
        timeline: {
          ordered: serverTimestamp(),
          confirmed: null,
          completed: null,
          cancelled: null
        },
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
        deliveries: [],
        revisionCount: 0,
        maxRevisions: 3,
        totalAmount: 100000,
        platformFee: 10000,
        freelancerEarning: 90000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), testOrder);
      console.log('✅ Test order created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating test order:', error);
      return null;
    }
  },

  // Run comprehensive test
  async runComprehensiveTest(userId) {
    console.log('🚀 Running comprehensive Firestore test for user:', userId);
    
    const results = {
      connection: false,
      favorites: null,
      cart: null,
      orders: null,
      testDataCreated: {
        favorite: null,
        cart: null,
        order: null
      }
    };

    // Test connection
    results.connection = await this.testConnection();
    
    if (!results.connection) {
      console.log('❌ Connection failed, aborting other tests');
      return results;
    }

    // Test existing data
    results.favorites = await this.testFavorites(userId);
    results.cart = await this.testCart(userId);
    results.orders = await this.testOrders(userId);

    // Create test data if collections are empty
    if (results.favorites.size === 0) {
      console.log('📝 Creating test favorite data...');
      results.testDataCreated.favorite = await this.createTestFavorite(userId);
    }

    if (results.cart.size === 0) {
      console.log('📝 Creating test cart data...');
      results.testDataCreated.cart = await this.createTestCartItem(userId);
    }

    if (results.orders.size === 0) {
      console.log('📝 Creating test order data...');
      results.testDataCreated.order = await this.createTestOrder(userId);
    }

    console.log('🏁 Comprehensive test completed:', results);
    return results;
  }
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  window.debugFirestore = debugFirestore;
}

export default debugFirestore; 