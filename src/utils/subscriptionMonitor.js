/**
 * Subscription Monitor - Utility untuk monitoring subscription health
 */
class SubscriptionMonitor {
  constructor() {
    this.subscriptionMetrics = new Map();
    this.warningThreshold = 5000; // 5 seconds
    this.errorThreshold = 10000; // 10 seconds
  }

  // Track subscription creation
  trackSubscriptionStart(subscriptionId, type, userId) {
    this.subscriptionMetrics.set(subscriptionId, {
      type,
      userId,
      startTime: Date.now(),
      status: 'pending',
      lastUpdate: null,
      updateCount: 0
    });
    
    console.log(`📊 [SubscriptionMonitor] Tracking subscription: ${subscriptionId}`);
  }

  // Track subscription update/callback
  trackSubscriptionUpdate(subscriptionId, dataCount = 0) {
    const metric = this.subscriptionMetrics.get(subscriptionId);
    if (metric) {
      metric.lastUpdate = Date.now();
      metric.updateCount += 1;
      metric.status = 'active';
      metric.lastDataCount = dataCount;
      
      const timeSinceStart = metric.lastUpdate - metric.startTime;
      console.log(`📊 [SubscriptionMonitor] Update for ${subscriptionId}: ${timeSinceStart}ms, data: ${dataCount}`);
    }
  }

  // Track subscription cleanup
  trackSubscriptionCleanup(subscriptionId) {
    const metric = this.subscriptionMetrics.get(subscriptionId);
    if (metric) {
      metric.status = 'cleaned';
      metric.cleanupTime = Date.now();
      
      const lifetime = metric.cleanupTime - metric.startTime;
      console.log(`🧹 [SubscriptionMonitor] Cleaned up ${subscriptionId}: lifetime ${lifetime}ms, updates: ${metric.updateCount}`);
      
      // Keep metric for a while for debugging
      setTimeout(() => {
        this.subscriptionMetrics.delete(subscriptionId);
      }, 30000); // 30 seconds
    }
  }

  // Check for stuck subscriptions
  checkSubscriptionHealth() {
    const now = Date.now();
    const stuckSubscriptions = [];
    const slowSubscriptions = [];

    this.subscriptionMetrics.forEach((metric, id) => {
      if (metric.status === 'pending') {
        const timeSinceStart = now - metric.startTime;
        
        if (timeSinceStart > this.errorThreshold) {
          stuckSubscriptions.push({ id, metric, timeSinceStart });
        } else if (timeSinceStart > this.warningThreshold) {
          slowSubscriptions.push({ id, metric, timeSinceStart });
        }
      }
    });

    if (stuckSubscriptions.length > 0) {
      console.error('🚨 [SubscriptionMonitor] Stuck subscriptions detected:', stuckSubscriptions);
    }

    if (slowSubscriptions.length > 0) {
      console.warn('⚠️ [SubscriptionMonitor] Slow subscriptions detected:', slowSubscriptions);
    }

    return { stuckSubscriptions, slowSubscriptions };
  }

  // Get subscription statistics
  getStats() {
    const stats = {
      total: this.subscriptionMetrics.size,
      byStatus: {},
      byType: {},
      byUser: {}
    };

    this.subscriptionMetrics.forEach((metric) => {
      // Count by status
      stats.byStatus[metric.status] = (stats.byStatus[metric.status] || 0) + 1;
      
      // Count by type
      stats.byType[metric.type] = (stats.byType[metric.type] || 0) + 1;
      
      // Count by user
      stats.byUser[metric.userId] = (stats.byUser[metric.userId] || 0) + 1;
    });

    return stats;
  }

  // Auto health check every minute
  startHealthCheck(interval = 60000) {
    setInterval(() => {
      this.checkSubscriptionHealth();
    }, interval);
    
    console.log('✅ [SubscriptionMonitor] Health check started');
  }
}

// Create singleton instance
const subscriptionMonitor = new SubscriptionMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.subscriptionMonitor = subscriptionMonitor;
  
  // Debug utilities
  window.checkSubscriptionHealth = () => {
    return subscriptionMonitor.checkSubscriptionHealth();
  };
  
  window.getSubscriptionStats = () => {
    return subscriptionMonitor.getStats();
  };
}

export default subscriptionMonitor; 