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
  }

  // Track subscription update/callback
  trackSubscriptionUpdate(subscriptionId, dataCount = 0) {
    const metric = this.subscriptionMetrics.get(subscriptionId);
    if (metric) {
      metric.lastUpdate = Date.now();
      metric.updateCount += 1;
      metric.status = 'active';
      metric.lastDataCount = dataCount;
    }
  }

  // Track subscription cleanup
  trackSubscriptionCleanup(subscriptionId) {
    const metric = this.subscriptionMetrics.get(subscriptionId);
    if (metric) {
      metric.status = 'cleaned';
      metric.cleanupTime = Date.now();
      
      // Keep metric for a while
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
  }
}

// Create singleton instance
const subscriptionMonitor = new SubscriptionMonitor();

export default subscriptionMonitor; 