// Enhanced Firebase monitoring utility for production debugging
class FirebaseMonitor {
  constructor() {
    this.subscriptions = new Map();
    this.reads = [];
    this.writes = [];
    this.maxLogEntries = 100; // Limit memory usage
    this.monitoringInterval = null;
    
    // Start automatic monitoring in development
    if (process.env.NODE_ENV === 'development') {
      // Start with a delay to avoid startup noise
      setTimeout(() => {
        this.startPeriodicMonitoring(15000); // Check every 15 seconds in development
      }, 5000);
    }
  }

  // Track subscription creation
  trackSubscription(subscriptionId, collectionName, userId) {
    const subscriptionData = {
      collectionName,
      userId,
      createdAt: new Date(),
      isActive: true,
      totalReads: 0
    };
    
    this.subscriptions.set(subscriptionId, subscriptionData);
    console.log(`📊 [FirebaseMonitor] Tracking subscription: ${subscriptionId} for ${collectionName}`);
    
    // Log active subscriptions periodically
    this.logSubscriptionStats();
  }

  // Track subscription cleanup
  trackSubscriptionCleanup(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      subscription.cleanedUpAt = new Date();
      console.log(`🧹 [FirebaseMonitor] Cleaned up subscription: ${subscriptionId} (Total reads: ${subscription.totalReads})`);
      
      // Show warning if cleanup seems delayed
      const cleanupDelay = subscription.cleanedUpAt - subscription.createdAt;
      if (cleanupDelay > 60000) { // More than 1 minute
        console.warn(`⚠️ [FirebaseMonitor] Subscription ${subscriptionId} was active for ${Math.round(cleanupDelay/1000)}s - potential memory leak`);
      }
    }
  }

  // Track Firestore reads with subscription tracking
  trackRead(operation, collectionName, count = 1) {
    const readEntry = {
      operation,
      collectionName,
      count,
      timestamp: new Date()
    };
    
    this.reads.push(readEntry);
    
    // Update subscription read counts
    this.subscriptions.forEach((sub, id) => {
      if (sub.collectionName === collectionName && sub.isActive) {
        sub.totalReads += count;
      }
    });
    
    // Limit memory usage
    if (this.reads.length > this.maxLogEntries) {
      this.reads = this.reads.slice(-this.maxLogEntries);
    }
    
    // Warning for high read operations
    if (count > 10) {
      console.warn(`⚠️ [FirebaseMonitor] High read count: ${operation} - ${collectionName} (${count} docs)`);
    }
    
    console.log(`📖 [FirebaseMonitor] Read tracked: ${operation} - ${collectionName} (${count} docs)`);
  }

  // Track Firestore writes
  trackWrite(operation, collectionName, count = 1) {
    const writeEntry = {
      operation,
      collectionName,
      count,
      timestamp: new Date()
    };
    
    this.writes.push(writeEntry);
    
    // Limit memory usage
    if (this.writes.length > this.maxLogEntries) {
      this.writes = this.writes.slice(-this.maxLogEntries);
    }
    
    console.log(`✍️ [FirebaseMonitor] Write tracked: ${operation} - ${collectionName} (${count} docs)`);
  }

  // Get active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  // Get usage stats
  getUsageStats() {
    const totalReads = this.reads.reduce((sum, read) => sum + read.count, 0);
    const totalWrites = this.writes.reduce((sum, write) => sum + write.count, 0);
    const activeSubscriptions = this.getActiveSubscriptions();
    
    return {
      totalReads,
      totalWrites,
      activeSubscriptions: activeSubscriptions.length,
      totalSubscriptions: this.subscriptions.size,
      subscriptionsByCollection: this.getSubscriptionsByCollection(),
      readsByCollection: this.getReadsByCollection(),
      recentHighUsage: this.getRecentHighUsage()
    };
  }

  // Get subscriptions grouped by collection
  getSubscriptionsByCollection() {
    const byCollection = {};
    this.subscriptions.forEach((sub) => {
      if (sub.isActive) {
        if (!byCollection[sub.collectionName]) {
          byCollection[sub.collectionName] = { count: 0, totalReads: 0 };
        }
        byCollection[sub.collectionName].count++;
        byCollection[sub.collectionName].totalReads += sub.totalReads;
      }
    });
    return byCollection;
  }

  // Get reads grouped by collection
  getReadsByCollection() {
    const byCollection = {};
    this.reads.forEach((read) => {
      if (!byCollection[read.collectionName]) {
        byCollection[read.collectionName] = 0;
      }
      byCollection[read.collectionName] += read.count;
    });
    return byCollection;
  }

  // Get recent high usage operations
  getRecentHighUsage() {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    
    return this.reads
      .filter(read => read.timestamp > last5Minutes && read.count > 5)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  // Log subscription statistics
  logSubscriptionStats() {
    const stats = this.getUsageStats();
    
    if (stats.activeSubscriptions > 8) {
      console.warn('⚠️ [FirebaseMonitor] CRITICAL: High number of active subscriptions:', stats.activeSubscriptions);
      console.table(stats.subscriptionsByCollection);
      
      // Show detailed subscription info
      console.group('🔍 Active Subscriptions Details:');
      this.subscriptions.forEach((sub, id) => {
        if (sub.isActive) {
          const age = Date.now() - sub.createdAt.getTime();
          console.log(`- ${id}: ${sub.collectionName} (age: ${Math.round(age/1000)}s, reads: ${sub.totalReads})`);
        }
      });
      console.groupEnd();
    } else if (stats.activeSubscriptions > 5) {
      console.warn('⚠️ [FirebaseMonitor] Warning: Multiple active subscriptions:', stats.activeSubscriptions);
    }
    
    if (stats.totalReads > 50) {
      console.warn('⚠️ [FirebaseMonitor] High read usage detected:', stats.totalReads);
      console.table(stats.readsByCollection);
    }
  }

  // Start periodic monitoring
  startPeriodicMonitoring(intervalMs = 30000) { // Default: 30 seconds
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      const stats = this.getSubscriptionStats();
      
      // Auto cleanup old inactive subscriptions
      this.cleanupOldSubscriptions();
      
      // Warn if too many active subscriptions
      if (stats.active > 8) {
        console.warn(`🚨 [FirebaseMonitor] CRITICAL: ${stats.active} active subscriptions!`);
        console.table(stats.byCollection);
        
        // Auto-trigger cleanup after critical threshold
        console.log('🔄 [FirebaseMonitor] Auto-triggering cleanup due to critical subscription count');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('forceCleanupSubscriptions', {
            detail: { reason: 'critical_threshold', count: stats.active, timestamp: Date.now() }
          }));
        }
      } else if (stats.active > 5) {
        console.warn(`⚠️ [FirebaseMonitor] Warning: ${stats.active} active subscriptions`);
      }
    }, intervalMs);
    
    console.log('📊 [FirebaseMonitor] Started periodic monitoring (interval: ' + intervalMs + 'ms)');
  }

  // Stop periodic monitoring
  stopPeriodicMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📊 [FirebaseMonitor] Stopped periodic monitoring');
    }
  }

  // Manual cleanup of old subscriptions (helpful for debugging)
  cleanupOldSubscriptions() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let cleanedCount = 0;
    this.subscriptions.forEach((sub, id) => {
      if (!sub.isActive && sub.cleanedUpAt && sub.cleanedUpAt < oneHourAgo) {
        this.subscriptions.delete(id);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 [FirebaseMonitor] Cleaned up ${cleanedCount} old subscription records`);
    }
  }

  // Get detailed report for debugging
  getDetailedReport() {
    const stats = this.getUsageStats();
    
    console.group('📊 Firebase Usage Report');
    console.log('Total Reads:', stats.totalReads);
    console.log('Total Writes:', stats.totalWrites);
    console.log('Active Subscriptions:', stats.activeSubscriptions);
    console.log('Total Subscriptions Created:', stats.totalSubscriptions);
    
    console.group('📊 By Collection:');
    console.table(stats.subscriptionsByCollection);
    console.table(stats.readsByCollection);
    console.groupEnd();
    
    if (stats.recentHighUsage.length > 0) {
      console.group('⚠️ Recent High Usage:');
      console.table(stats.recentHighUsage);
      console.groupEnd();
    }
    
    console.groupEnd();
    
    return stats;
  }

  // Legacy compatibility method for existing monitor script
  getReport() {
    const stats = this.getUsageStats();
    
    // Calculate reads per minute
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentReads = this.reads
      .filter(read => read.timestamp > oneMinuteAgo)
      .reduce((sum, read) => sum + read.count, 0);
    
    // Get top operations
    const operationCounts = {};
    this.reads.forEach(read => {
      operationCounts[read.operation] = (operationCounts[read.operation] || 0) + read.count;
    });
    
    const topOperations = Object.entries(operationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Calculate duration since first read
    const firstRead = this.reads[0];
    const duration = firstRead ? now.getTime() - firstRead.timestamp.getTime() : 0;
    
    return {
      totalReads: stats.totalReads,
      totalWrites: stats.totalWrites,
      activeSubscriptions: stats.activeSubscriptions,
      readsPerMinute: recentReads,
      topOperations,
      duration,
      readsByCollection: stats.readsByCollection
    };
  }

  // Reset monitoring data
  reset() {
    this.reads = [];
    this.writes = [];
    // Keep subscriptions active but reset their read counts
    this.subscriptions.forEach(sub => {
      if (sub.isActive) {
        sub.totalReads = 0;
      }
    });
  }

  // Log top operations
  logTopOperations() {
    const operationCounts = {};
    this.reads.forEach(read => {
      operationCounts[read.operation] = (operationCounts[read.operation] || 0) + read.count;
    });
    
    const topOperations = Object.entries(operationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.group('🔝 Top Firebase Operations');
    topOperations.forEach(([operation, count]) => {
      console.log(`${operation}: ${count} reads`);
    });
    console.groupEnd();
  }

  // Get current subscription stats
  getSubscriptionStats() {
    const stats = {
      total: this.subscriptions.size,
      active: 0,
      inactive: 0,
      byCollection: {}
    };
    
    this.subscriptions.forEach((sub) => {
      if (sub.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }
      
      if (!stats.byCollection[sub.collection]) {
        stats.byCollection[sub.collection] = { active: 0, inactive: 0, totalReads: 0 };
      }
      
      if (sub.isActive) {
        stats.byCollection[sub.collection].active++;
      } else {
        stats.byCollection[sub.collection].inactive++;
      }
      
      stats.byCollection[sub.collection].totalReads += sub.totalReads;
    });
    
    return stats;
  }
}

// Create singleton instance
const firebaseMonitor = new FirebaseMonitor();

// Expose global methods for debugging in console
if (typeof window !== 'undefined') {
  window.firebaseMonitor = firebaseMonitor;
  
  // Global utility to force cleanup all subscriptions
  window.forceCleanupAllSubscriptions = () => {
    console.warn('🧹 [Global] Force cleaning up ALL Firebase subscriptions');
    const stats = firebaseMonitor.getSubscriptionStats();
    console.table(stats.byCollection);
    
    // Send cleanup event to all components
    window.dispatchEvent(new CustomEvent('forceCleanupSubscriptions', {
      detail: { reason: 'manual_cleanup', timestamp: Date.now() }
    }));
    
    return stats;
  };
  
  // Global utility to check subscription health
  window.checkSubscriptionHealth = () => {
    const stats = firebaseMonitor.getSubscriptionStats();
    console.group('🔍 Subscription Health Check');
    console.log('Active subscriptions:', stats.active);
    console.log('Total subscriptions created:', stats.total);
    console.table(stats.byCollection);
    
    if (stats.active > 8) {
      console.error('🚨 CRITICAL: Too many active subscriptions! Possible memory leak.');
    } else if (stats.active > 5) {
      console.warn('⚠️ WARNING: Many active subscriptions. Monitor closely.');
    } else {
      console.log('✅ Subscription count looks healthy.');
    }
    
    console.groupEnd();
    return stats;
  };
}

export default firebaseMonitor; 