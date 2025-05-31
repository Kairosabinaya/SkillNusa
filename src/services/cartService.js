import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  getDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  updateDoc
} from 'firebase/firestore';

/**
 * Enhanced Cart Service for managing shopping cart functionality with Firestore
 */
class CartService {
  constructor() {
    this.collectionName = 'cartItems';
  }

  /**
   * Add item to cart with enhanced gig data
   * @param {string} userId - User ID
   * @param {Object} cartItem - Cart item data
   * @returns {Promise<Object>} Added cart item
   */
  async addToCart(userId, cartItem) {
    try {
      // Validate required fields
      if (!userId || !cartItem.gigId || !cartItem.packageType) {
        throw new Error('Missing required fields: userId, gigId, or packageType');
      }

      // Check if item already exists in cart
      const existingItem = await this.getCartItem(userId, cartItem.gigId, cartItem.packageType);
      if (existingItem) {
        throw new Error('Item already exists in cart');
      }

      // Get fresh gig details
      const gigDoc = await getDoc(doc(db, 'gigs', cartItem.gigId));
      if (!gigDoc.exists()) {
        throw new Error('Gig not found');
      }

      const gigData = gigDoc.data();
      const selectedPackage = gigData.packages[cartItem.packageType];
      
      if (!selectedPackage) {
        throw new Error('Package not found');
      }

      // Get freelancer details
      let freelancerData = null;
      if (gigData.freelancerId) {
        const freelancerDoc = await getDoc(doc(db, 'users', gigData.freelancerId));
        if (freelancerDoc.exists()) {
          freelancerData = {
            id: freelancerDoc.id,
            displayName: freelancerDoc.data().displayName,
            profilePhoto: freelancerDoc.data().profilePhoto
          };
        }
      }

      // Create cart item with denormalized data
      const cartItemData = {
        userId,
        gigId: cartItem.gigId,
        freelancerId: gigData.freelancerId,
        packageType: cartItem.packageType,
        quantity: cartItem.quantity || 1,
        
        // Denormalized gig data - handle undefined values
        gigData: {
          title: gigData.title || 'Untitled Gig',
          images: gigData.images || [],
          category: gigData.category || 'Other',
          rating: gigData.rating || 0,
          totalReviews: gigData.totalReviews || 0 // Default to 0 if undefined
        },
        
        // Denormalized package data
        packageData: {
          name: selectedPackage.name || `${cartItem.packageType} Package`,
          description: selectedPackage.description || '',
          price: selectedPackage.price || 0,
          deliveryTime: selectedPackage.deliveryTime || 7,
          revisions: selectedPackage.revisions || 1,
          features: selectedPackage.features || []
        },
        
        // Denormalized freelancer data
        freelancerData: freelancerData || {
          displayName: 'Freelancer',
          profilePhoto: null
        },
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), cartItemData);
      
      return {
        id: docRef.id,
        ...cartItemData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Get specific cart item
   * @param {string} userId - User ID
   * @param {string} gigId - Gig ID
   * @param {string} packageType - Package type
   * @returns {Promise<Object|null>} Cart item or null
   */
  async getCartItem(userId, gigId, packageType) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('gigId', '==', gigId),
        where('packageType', '==', packageType)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting cart item:', error);
      return null;
    }
  }

  /**
   * Get all cart items for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Cart items
   */
  async getCartItems(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const cartItems = [];
      
      querySnapshot.forEach((doc) => {
        cartItems.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by createdAt in JavaScript instead of Firestore
      cartItems.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bTime - aTime; // desc order
      });
      
      return cartItems;
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  }

  /**
   * Subscribe to cart items (real-time updates)
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToCartItems(userId, callback) {
    console.log('🔍 [CartService] subscribeToCartItems called for userId:', userId);
    
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      console.log('📡 [CartService] Setting up Firestore listener with query:', {
        collection: this.collectionName,
        userId,
        query: 'userId == userId (sorted in JavaScript)'
      });
      
      return onSnapshot(q, (snapshot) => {
        console.log('📥 [CartService] Firestore snapshot received:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docs: snapshot.docs.length
        });
        
        const cartItems = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 [CartService] Processing doc:', {
            id: doc.id,
            userId: data.userId,
            gigId: data.gigId,
            packageType: data.packageType,
            quantity: data.quantity,
            hasGigData: !!data.gigData,
            hasPackageData: !!data.packageData,
            hasFreelancerData: !!data.freelancerData,
            createdAt: data.createdAt
          });
          
          cartItems.push({
            id: doc.id,
            ...data
          });
        });

        // Sort by createdAt in JavaScript instead of Firestore
        cartItems.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime - aTime; // desc order
        });
        
        console.log('✅ [CartService] Processed cart items:', {
          count: cartItems.length,
          items: cartItems.map(item => ({
            id: item.id,
            gigId: item.gigId,
            packageType: item.packageType,
            quantity: item.quantity,
            title: item.gigData?.title
          }))
        });
        
        callback(cartItems);
      }, (error) => {
        console.error('💥 [CartService] Error in cart subscription:', error);
        callback([]);
      });
    } catch (error) {
      console.error('💥 [CartService] Error subscribing to cart:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} cartItemId - Cart item ID
   * @returns {Promise<boolean>} Success status
   */
  async removeFromCart(userId, cartItemId) {
    try {
      // Verify ownership
      const cartItemDoc = await getDoc(doc(db, this.collectionName, cartItemId));
      if (!cartItemDoc.exists() || cartItemDoc.data().userId !== userId) {
        throw new Error('Cart item not found or access denied');
      }
      
      await deleteDoc(doc(db, this.collectionName, cartItemId));
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {string} cartItemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart item
   */
  async updateCartItemQuantity(userId, cartItemId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      
      // Verify ownership
      const cartItemDoc = await getDoc(doc(db, this.collectionName, cartItemId));
      if (!cartItemDoc.exists() || cartItemDoc.data().userId !== userId) {
        throw new Error('Cart item not found or access denied');
      }
      
      await updateDoc(doc(db, this.collectionName, cartItemId), {
        quantity,
        updatedAt: serverTimestamp()
      });
      
      // Return updated item
      const updatedDoc = await getDoc(doc(db, this.collectionName, cartItemId));
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  /**
   * Clear all cart items for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async clearCart(userId) {
    try {
      const cartItems = await this.getCartItems(userId);
      
      // Delete all cart items
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, this.collectionName, item.id))
      );
      
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Get cart items count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Cart items count
   */
  async getCartCount(userId) {
    try {
      const cartItems = await this.getCartItems(userId);
      return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time cart count updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for count updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToCartCount(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalCount = 0;
        snapshot.forEach((doc) => {
          const item = doc.data();
          totalCount += item.quantity || 1;
        });
        
        console.log('Real-time cart count update:', totalCount);
        callback(totalCount);
      }, (error) => {
        console.error('Error in cart count subscription:', error);
        callback(0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up cart count subscription:', error);
      callback(0);
      return null;
    }
  }

  /**
   * Get cart total price
   * @param {string} userId - User ID
   * @returns {Promise<number>} Total price
   */
  async getCartTotal(userId) {
    try {
      const cartItems = await this.getCartItems(userId);
      return cartItems.reduce((total, item) => {
        const price = item.packageData?.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error getting cart total:', error);
      return 0;
    }
  }

  /**
   * Check if item is in cart
   * @param {string} userId - User ID
   * @param {string} gigId - Gig ID
   * @param {string} packageType - Package type
   * @returns {Promise<boolean>} Is in cart
   */
  async isInCart(userId, gigId, packageType) {
    try {
      const item = await this.getCartItem(userId, gigId, packageType);
      return item !== null;
    } catch (error) {
      console.error('Error checking if item is in cart:', error);
      return false;
    }
  }

  /**
   * Validate cart items (check if gigs still exist and active)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation result
   */
  async validateCartItems(userId) {
    try {
      const cartItems = await this.getCartItems(userId);
      const validItems = [];
      const invalidItems = [];
      
      for (const item of cartItems) {
        try {
          const gigDoc = await getDoc(doc(db, 'gigs', item.gigId));
          
          if (gigDoc.exists() && gigDoc.data().isActive) {
            const gigData = gigDoc.data();
            const packageExists = gigData.packages && gigData.packages[item.packageType];
            
            if (packageExists) {
              validItems.push(item);
            } else {
              invalidItems.push({ ...item, reason: 'Package no longer available' });
            }
          } else {
            invalidItems.push({ ...item, reason: 'Gig no longer available' });
          }
        } catch (error) {
          invalidItems.push({ ...item, reason: 'Error validating gig' });
        }
      }
      
      return {
        valid: validItems,
        invalid: invalidItems,
        isValid: invalidItems.length === 0
      };
    } catch (error) {
      console.error('Error validating cart items:', error);
      throw error;
    }
  }

  /**
   * Remove invalid cart items
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Removed items
   */
  async removeInvalidItems(userId) {
    try {
      const validation = await this.validateCartItems(userId);
      
      if (validation.invalid.length > 0) {
        const removePromises = validation.invalid.map(item => 
          this.removeFromCart(userId, item.id)
        );
        
        await Promise.all(removePromises);
      }
      
      return validation.invalid;
    } catch (error) {
      console.error('Error removing invalid cart items:', error);
      throw error;
    }
  }

  // Legacy localStorage methods for backward compatibility
  getUserCartKey(userId) {
    return `cart_${userId}`;
  }
}

const cartService = new CartService();
export default cartService; 