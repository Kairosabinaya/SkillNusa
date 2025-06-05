// Global subscription registry to prevent duplicates across the entire app
class SubscriptionRegistry {
  constructor() {
    this.activeSubscriptions = new Map();
    this.userSubscriptions = new Map(); // Track by userId
  }

  // Check if a subscription type already exists for a user
  hasSubscription(userId, type) {
    const userSubs = this.userSubscriptions.get(userId) || new Set();
    return userSubs.has(type);
  }

  // Register a new subscription
  registerSubscription(userId, type, unsubscribeFunction) {
    const subscriptionId = `${userId}_${type}_${Date.now()}`;
    
    // Check if this type already exists for this user
    if (this.hasSubscription(userId, type)) {
      console.warn(`⚠️ [SubscriptionRegistry] Subscription type "${type}" already exists for user ${userId}`);
      return null; // Don't register duplicate
    }

    // Register the subscription
    this.activeSubscriptions.set(subscriptionId, {
      userId,
      type,
      unsubscribe: unsubscribeFunction,
      createdAt: new Date()
    });

    // Track by user
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId).add(type);

    console.log(`✅ [SubscriptionRegistry] Registered ${type} subscription for user ${userId}`);
    return subscriptionId;
  }

  // Unregister a subscription
  unregisterSubscription(subscriptionId) {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (subscription) {
      const { userId, type, unsubscribe } = subscription;
      
      // Call the unsubscribe function
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      // Remove from registry
      this.activeSubscriptions.delete(subscriptionId);
      
      // Remove from user tracking
      const userSubs = this.userSubscriptions.get(userId);
      if (userSubs) {
        userSubs.delete(type);
        if (userSubs.size === 0) {
          this.userSubscriptions.delete(userId);
        }
      }

      console.log(`🧹 [SubscriptionRegistry] Unregistered ${type} subscription for user ${userId}`);
      return true;
    }
    return false;
  }

  // Clean up all subscriptions for a user
  cleanupUserSubscriptions(userId) {
    console.log(`🧹 [SubscriptionRegistry] Cleaning up all subscriptions for user ${userId}`);
    
    const subscriptionsToRemove = [];
    this.activeSubscriptions.forEach((subscription, id) => {
      if (subscription.userId === userId) {
        subscriptionsToRemove.push(id);
      }
    });

    subscriptionsToRemove.forEach(id => {
      this.unregisterSubscription(id);
    });

    return subscriptionsToRemove.length;
  }

  // Get statistics
  getStats() {
    const stats = {
      totalActive: this.activeSubscriptions.size,
      byUser: {},
      byType: {}
    };

    this.activeSubscriptions.forEach((subscription) => {
      const { userId, type } = subscription;
      
      // Count by user
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;
      
      // Count by type
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  // Force cleanup all subscriptions (emergency)
  forceCleanupAll() {
    console.warn('🚨 [SubscriptionRegistry] Force cleaning up ALL subscriptions');
    
    this.activeSubscriptions.forEach((subscription, id) => {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });

    this.activeSubscriptions.clear();
    this.userSubscriptions.clear();
    
    console.log('✅ [SubscriptionRegistry] All subscriptions cleaned up');
  }
}

// Create singleton instance
const subscriptionRegistry = new SubscriptionRegistry();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.subscriptionRegistry = subscriptionRegistry;
  
  // Global cleanup utility
  window.emergencyCleanupSubscriptions = () => {
    subscriptionRegistry.forceCleanupAll();
    return subscriptionRegistry.getStats();
  };
}

export default subscriptionRegistry; 