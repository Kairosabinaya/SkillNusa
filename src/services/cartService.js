/**
 * Cart Service - Handles shopping cart functionality
 * Updated to use new database structure with proper references
 */

import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

class CartService {
  constructor() {
    this.collectionName = 'cart'; // Keep cart as separate collection
  }

  // Add item to cart
  async addToCart(userId, gigId, packageType, customRequirements = '') {
    try {
      // Validate parameters to prevent undefined errors
      if (!userId || !gigId || !packageType) {
        throw new Error('Invalid parameters: userId, gigId, and packageType are required');
      }

      // Check if item already exists in cart
      const existingItem = await this.getCartItem(userId, gigId, packageType);
      if (existingItem) {
        throw new Error('Item already in cart');
      }

      // Get gig data using standardized collection
      const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
      if (!gigDoc.exists()) {
        throw new Error('Gig not found');
      }

      const gigData = gigDoc.data();
      const packageData = gigData.packages?.[packageType];
      
      if (!packageData) {
        throw new Error('Package not found');
      }

      // Get freelancer data using standardized userId field
      const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
      let freelancerData = null;
      if (freelancerDoc.exists()) {
        const userData = freelancerDoc.data();
        
        // Get freelancer profile for additional data
        const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
        const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
        
        freelancerData = {
          id: gigData.userId,
          displayName: userData.displayName,
          profilePhoto: userData.profilePhoto,
          rating: profileData.rating || 0,
          totalReviews: profileData.totalReviews || 0
        };
      }

      const cartItem = {
        userId,
        gigId,
        packageType,
        customRequirements,
        quantity: 1, // Add default quantity
        // Store data in structured format for easy access
        gigData: {
          id: gigId,
          title: gigData.title,
          images: gigData.images || [],
          category: gigData.category
        },
        packageData: {
          name: packageData.name,
          description: packageData.description,
          price: packageData.price,
          deliveryTime: packageData.deliveryTime,
          revisions: packageData.revisions,
          features: packageData.features || []
        },
        freelancerData: freelancerData,
        // Keep legacy fields for compatibility
        gigTitle: gigData.title,
        gigImage: gigData.images?.[0] || null,
        gigCategory: gigData.category,
        freelancerId: gigData.userId,
        freelancerName: freelancerData?.displayName || 'Unknown',
        freelancerPhoto: freelancerData?.profilePhoto || null,
        packageName: packageData.name,
        packageDescription: packageData.description,
        price: packageData.price,
        deliveryTime: packageData.deliveryTime,
        revisions: packageData.revisions,
        features: packageData.features || [],
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), cartItem);
      return { id: docRef.id, ...cartItem };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Get cart item
  async getCartItem(userId, gigId, packageType) {
    try {
      // Validate parameters to prevent undefined errors
      if (!userId || !gigId || !packageType) {
        console.warn('CartService.getCartItem - Invalid parameters:', { userId, gigId, packageType });
        return null;
      }

      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('gigId', '==', gigId),
        where('packageType', '==', packageType)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cart item:', error);
      return null;
    }
  }

  // Update cart item
  async updateCartItem(cartItemId, updates) {
    try {
      const cartItemRef = doc(db, this.collectionName, cartItemId);
      await updateDoc(cartItemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItemQuantity(userId, cartItemId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      const cartItemRef = doc(db, this.collectionName, cartItemId);
      await updateDoc(cartItemRef, {
        quantity: quantity,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  // Remove item from cart (overloaded to support both userId+itemId and just itemId)
  async removeFromCart(userIdOrItemId, cartItemId = null) {
    try {
      // If cartItemId is null, treat first parameter as cartItemId
      const itemId = cartItemId || userIdOrItemId;
      await deleteDoc(doc(db, this.collectionName, itemId));
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Get user's cart items
  async getUserCart(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const cartItems = [];

      for (const docSnapshot of querySnapshot.docs) {
        const cartData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // If cart item doesn't have structured data, get fresh data from gig
        if (!cartData.gigData || !cartData.packageData || !cartData.freelancerData) {
          try {
            const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, cartData.gigId));
            if (gigDoc.exists()) {
              const gigData = gigDoc.data();
              const packageData = gigData.packages?.[cartData.packageType];
              
              // Get freelancer data
              const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
              let freelancerData = null;
              if (freelancerDoc.exists()) {
                const userData = freelancerDoc.data();
                const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
                const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
                
                freelancerData = {
                  id: gigData.userId,
                  displayName: userData.displayName,
                  profilePhoto: userData.profilePhoto,
                  rating: profileData.rating || 0,
                  totalReviews: profileData.totalReviews || 0
                };
              }
              
              // Update cart data with structured format
              cartData.gigData = {
                id: cartData.gigId,
                title: gigData.title,
                images: gigData.images || [],
                category: gigData.category
              };
              cartData.packageData = packageData;
              cartData.freelancerData = freelancerData;
              cartData.gigAvailable = true;
            } else {
              cartData.gigAvailable = false;
            }
          } catch (error) {
            console.error('Error checking gig availability:', error);
            cartData.gigAvailable = false;
          }
        } else {
          // For existing structured data, just check if gig is still available
          try {
            const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, cartData.gigId));
            if (gigDoc.exists()) {
              const gigData = gigDoc.data();
              const packageData = gigData.packages?.[cartData.packageType];
              
              // Update with fresh data if different
              if (packageData && packageData.price !== cartData.packageData.price) {
                cartData.packageData.currentPrice = packageData.price;
                cartData.priceChanged = true;
              }
              
              cartData.gigAvailable = true;
            } else {
              cartData.gigAvailable = false;
            }
          } catch (error) {
            console.error('Error checking gig availability:', error);
            cartData.gigAvailable = false;
          }
        }
        
        cartItems.push(cartData);
      }

      return cartItems;
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw error;
    }
  }

  // Clear user's cart
  async clearCart(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(docSnapshot.ref)
      );

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart summary
  async getCartSummary(userId) {
    try {
      const cartItems = await this.getUserCart(userId);
      
      const summary = {
        itemCount: cartItems.length,
        totalPrice: 0,
        totalDeliveryTime: 0,
        categories: new Set(),
        freelancers: new Set()
      };

      cartItems.forEach(item => {
        summary.totalPrice += item.currentPrice || item.price || 0;
        summary.totalDeliveryTime = Math.max(summary.totalDeliveryTime, item.deliveryTime || 0);
        summary.categories.add(item.gigCategory);
        summary.freelancers.add(item.freelancerId);
      });

      return {
        ...summary,
        categories: Array.from(summary.categories),
        freelancers: Array.from(summary.freelancers),
        uniqueFreelancers: summary.freelancers.size,
        uniqueCategories: summary.categories.size
      };
    } catch (error) {
      console.error('Error getting cart summary:', error);
      return {
        itemCount: 0,
        totalPrice: 0,
        totalDeliveryTime: 0,
        categories: [],
        freelancers: [],
        uniqueFreelancers: 0,
        uniqueCategories: 0
      };
    }
  }

  // Check if item is in cart
  async isInCart(userId, gigId, packageType) {
    try {
      const item = await this.getCartItem(userId, gigId, packageType);
      return !!item;
    } catch (error) {
      console.error('Error checking if item is in cart:', error);
      return false;
    }
  }

  // Get cart item count
  async getCartItemCount(userId) {
    try {
      const cartItems = await this.getUserCart(userId);
      return cartItems.length;
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  }

  // Validate cart before checkout
  async validateCart(userId) {
    try {
      const cartItems = await this.getUserCart(userId);
      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        validItems: [],
        invalidItems: []
      };

      for (const item of cartItems) {
        const itemValidation = {
          id: item.id,
          gigId: item.gigId,
          packageType: item.packageType,
          isValid: true,
          errors: []
        };

        // Check if gig still exists and is active
        try {
          const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, item.gigId));
          if (!gigDoc.exists()) {
            itemValidation.isValid = false;
            itemValidation.errors.push('Gig no longer exists');
          } else {
            const gigData = gigDoc.data();
            if (!gigData.isActive) {
              itemValidation.isValid = false;
              itemValidation.errors.push('Gig is no longer active');
            }

            // Check if package still exists
            const packageData = gigData.packages?.[item.packageType];
            if (!packageData) {
              itemValidation.isValid = false;
              itemValidation.errors.push('Package no longer available');
            } else if (packageData.price !== item.price) {
              validationResults.warnings.push(`Price changed for ${item.gigTitle}`);
            }
          }
        } catch (error) {
          itemValidation.isValid = false;
          itemValidation.errors.push('Error validating gig');
        }

        if (itemValidation.isValid) {
          validationResults.validItems.push(item);
        } else {
          validationResults.invalidItems.push({ ...item, validation: itemValidation });
          validationResults.isValid = false;
          validationResults.errors.push(...itemValidation.errors);
        }
      }

      return validationResults;
    } catch (error) {
      console.error('Error validating cart:', error);
      return {
        isValid: false,
        errors: ['Error validating cart'],
        warnings: [],
        validItems: [],
        invalidItems: []
      };
    }
  }

  // Subscribe to user's cart count with real-time updates
  subscribeToCartCount(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const count = querySnapshot.size;
        callback(count);
      }, (error) => {
        console.error('Error in cart count subscription:', error);
        // Call callback with 0 on error to prevent app crash
        callback(0);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up cart count subscription:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  // Subscribe to user's cart items with real-time updates (provides complete cart data)
  subscribeToCartItems(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        try {
          const cartItems = [];

          for (const docSnapshot of querySnapshot.docs) {
            const cartData = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // If cart item doesn't have structured data, get fresh data from gig
            if (!cartData.gigData || !cartData.packageData || !cartData.freelancerData) {
              try {
                const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, cartData.gigId));
                if (gigDoc.exists()) {
                  const gigData = gigDoc.data();
                  const packageData = gigData.packages?.[cartData.packageType];
                  
                  // Get freelancer data
                  const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
                  let freelancerData = null;
                  if (freelancerDoc.exists()) {
                    const userData = freelancerDoc.data();
                    const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
                    const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
                    
                    freelancerData = {
                      id: gigData.userId,
                      displayName: userData.displayName,
                      profilePhoto: userData.profilePhoto,
                      rating: profileData.rating || 0,
                      totalReviews: profileData.totalReviews || 0
                    };
                  }
                  
                  // Update cart data with structured format
                  cartData.gigData = {
                    id: cartData.gigId,
                    title: gigData.title,
                    images: gigData.images || [],
                    category: gigData.category
                  };
                  cartData.packageData = packageData;
                  cartData.freelancerData = freelancerData;
                  cartData.gigAvailable = true;
                } else {
                  cartData.gigAvailable = false;
                }
              } catch (error) {
                console.error('Error checking gig availability:', error);
                cartData.gigAvailable = false;
              }
            } else {
              // For existing structured data, just check if gig is still available
              try {
                const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, cartData.gigId));
                if (gigDoc.exists()) {
                  const gigData = gigDoc.data();
                  const packageData = gigData.packages?.[cartData.packageType];
                  
                  // Update with fresh data if different
                  if (packageData && packageData.price !== cartData.packageData.price) {
                    cartData.packageData.currentPrice = packageData.price;
                    cartData.priceChanged = true;
                  }
                  
                  cartData.gigAvailable = true;
                } else {
                  cartData.gigAvailable = false;
                }
              } catch (error) {
                console.error('Error checking gig availability:', error);
                cartData.gigAvailable = false;
              }
            }
            
            cartItems.push(cartData);
          }

          callback(cartItems);
        } catch (error) {
          console.error('Error processing cart items snapshot:', error);
          // Call callback with empty array on error to prevent app crash
          callback([]);
        }
      }, (error) => {
        console.error('Error in cart items subscription:', error);
        // Call callback with empty array on error to prevent app crash
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up cart items subscription:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }
}

export default new CartService(); 