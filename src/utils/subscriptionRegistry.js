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
      // Clean up existing subscription of the same type
      this.forceCleanupSubscriptionType(userId, type);
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

      return true;
    }
    return false;
  }

  // Clean up all subscriptions for a user
  cleanupUserSubscriptions(userId) {
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

  // Force cleanup specific subscription type for a user
  forceCleanupSubscriptionType(userId, type) {
    const subscriptionsToRemove = [];
    this.activeSubscriptions.forEach((subscription, id) => {
      if (subscription.userId === userId && subscription.type === type) {
        subscriptionsToRemove.push(id);
      }
    });

    subscriptionsToRemove.forEach(id => {
      this.unregisterSubscription(id);
    });

    return subscriptionsToRemove.length;
  }

  // Force cleanup all subscriptions (emergency)
  forceCleanupAll() {
    this.activeSubscriptions.forEach((subscription, id) => {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });

    this.activeSubscriptions.clear();
    this.userSubscriptions.clear();
  }
}

// Create singleton instance
const subscriptionRegistry = new SubscriptionRegistry();

export default subscriptionRegistry; 