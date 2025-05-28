/**
 * Cart Service for managing shopping cart functionality
 */
class CartService {
  constructor() {
    this.storageKey = 'cart';
  }

  /**
   * Get cart key for specific user
   * @param {string} userId - User ID
   * @returns {string} Storage key
   */
  getUserCartKey(userId) {
    return `${this.storageKey}_${userId}`;
  }

  /**
   * Get cart items for user
   * @param {string} userId - User ID
   * @returns {Array} Cart items
   */
  getCartItems(userId) {
    try {
      const cartKey = this.getUserCartKey(userId);
      const cart = localStorage.getItem(cartKey);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  /**
   * Add item to cart
   * @param {string} userId - User ID
   * @param {Object} item - Cart item
   * @returns {Array} Updated cart items
   */
  addToCart(userId, item) {
    try {
      const cartItems = this.getCartItems(userId);
      
      // Check if item already exists
      const existingIndex = cartItems.findIndex(
        cartItem => cartItem.gigId === item.gigId && cartItem.packageType === item.packageType
      );

      if (existingIndex > -1) {
        // Update existing item
        cartItems[existingIndex] = { ...cartItems[existingIndex], ...item };
      } else {
        // Add new item
        cartItems.push({
          ...item,
          id: Date.now().toString(), // Simple ID generation
          addedAt: new Date()
        });
      }

      const cartKey = this.getUserCartKey(userId);
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      
      return cartItems;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to remove
   * @returns {Array} Updated cart items
   */
  removeFromCart(userId, itemId) {
    try {
      const cartItems = this.getCartItems(userId);
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      
      const cartKey = this.getUserCartKey(userId);
      localStorage.setItem(cartKey, JSON.stringify(updatedItems));
      
      return updatedItems;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Array} Updated cart items
   */
  updateCartItem(userId, itemId, updates) {
    try {
      const cartItems = this.getCartItems(userId);
      const itemIndex = cartItems.findIndex(item => item.id === itemId);
      
      if (itemIndex > -1) {
        cartItems[itemIndex] = { ...cartItems[itemIndex], ...updates };
        
        const cartKey = this.getUserCartKey(userId);
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
      }
      
      return cartItems;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Clear all cart items for user
   * @param {string} userId - User ID
   * @returns {Array} Empty cart
   */
  clearCart(userId) {
    try {
      const cartKey = this.getUserCartKey(userId);
      localStorage.removeItem(cartKey);
      return [];
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Get cart count for user
   * @param {string} userId - User ID
   * @returns {number} Cart item count
   */
  getCartCount(userId) {
    return this.getCartItems(userId).length;
  }

  /**
   * Get cart total price
   * @param {string} userId - User ID
   * @returns {number} Total price
   */
  getCartTotal(userId) {
    const cartItems = this.getCartItems(userId);
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  }

  /**
   * Check if item is in cart
   * @param {string} userId - User ID
   * @param {string} gigId - Gig ID
   * @param {string} packageType - Package type
   * @returns {boolean} Is in cart
   */
  isInCart(userId, gigId, packageType) {
    const cartItems = this.getCartItems(userId);
    return cartItems.some(
      item => item.gigId === gigId && item.packageType === packageType
    );
  }
}

const cartService = new CartService();
export default cartService; 