// Debug utility for monitoring Firebase usage in real-time
import firebaseMonitor from './firebaseMonitor';

class FirebaseUsageDebugger {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.alertThresholds = {
      reads: 100,
      subscriptions: 8,
      readsPerMinute: 20
    };
  }

  // Start monitoring Firebase usage
  startMonitoring(intervalSeconds = 30) {
    if (this.isMonitoring) {
      console.log('🔍 [DebugUsage] Already monitoring...');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 [DebugUsage] Starting Firebase usage monitoring (${intervalSeconds}s intervals)`);
    
    // Initial report
    this.logUsageReport();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.logUsageReport();
      this.checkAlerts();
    }, intervalSeconds * 1000);
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('🛑 [DebugUsage] Stopping Firebase usage monitoring');
    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Log current usage report
  logUsageReport() {
    const stats = firebaseMonitor.getUsageStats();
    
    console.group('📊 Firebase Usage Report');
    console.log('🔵 Total Reads:', stats.totalReads);
    console.log('🟠 Total Writes:', stats.totalWrites);
    console.log('🟢 Active Subscriptions:', stats.activeSubscriptions);
    
    if (Object.keys(stats.subscriptionsByCollection).length > 0) {
      console.log('📋 Subscriptions by Collection:');
      console.table(stats.subscriptionsByCollection);
    }
    
    if (Object.keys(stats.readsByCollection).length > 0) {
      console.log('📖 Reads by Collection:');
      console.table(stats.readsByCollection);
    }
    
    if (stats.recentHighUsage.length > 0) {
      console.log('⚠️ Recent High Usage Operations:');
      console.table(stats.recentHighUsage);
    }
    
    console.groupEnd();
  }

  // Check for usage alerts
  checkAlerts() {
    const stats = firebaseMonitor.getUsageStats();
    
    // High reads alert
    if (stats.totalReads > this.alertThresholds.reads) {
      console.warn(`⚠️ [UsageAlert] High read count: ${stats.totalReads} reads detected`);
      this.suggestOptimizations(stats);
    }
    
    // Too many subscriptions alert
    if (stats.activeSubscriptions > this.alertThresholds.subscriptions) {
      console.warn(`⚠️ [UsageAlert] High subscription count: ${stats.activeSubscriptions} active subscriptions`);
      this.suggestSubscriptionCleanup(stats);
    }
    
    // High reads per minute alert
    const recentReads = this.calculateRecentReads();
    if (recentReads > this.alertThresholds.readsPerMinute) {
      console.warn(`⚠️ [UsageAlert] High read rate: ${recentReads} reads in the last minute`);
    }
  }

  // Calculate reads in the last minute
  calculateRecentReads() {
    const stats = firebaseMonitor.getUsageStats();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    return firebaseMonitor.reads
      .filter(read => read.timestamp > oneMinuteAgo)
      .reduce((sum, read) => sum + read.count, 0);
  }

  // Suggest optimizations based on usage patterns
  suggestOptimizations(stats) {
    console.group('💡 Optimization Suggestions');
    
    // Check for high-read collections
    const highReadCollections = Object.entries(stats.readsByCollection)
      .filter(([collection, count]) => count > 20)
      .sort((a, b) => b[1] - a[1]);
    
    if (highReadCollections.length > 0) {
      console.log('🔍 High-read collections detected:');
      highReadCollections.forEach(([collection, count]) => {
        console.log(`   - ${collection}: ${count} reads`);
        
        // Specific suggestions per collection
        switch (collection) {
          case 'gigs':
            console.log('     💡 Consider: Pagination, caching featured gigs, reducing real-time updates');
            break;
          case 'users':
            console.log('     💡 Consider: User caching, batch user fetches, denormalized user data');
            break;
          case 'chats':
            console.log('     💡 Consider: Message pagination, cached participant data');
            break;
          case 'favorites':
            console.log('     💡 Consider: Batch favorite checks, denormalized favorite data');
            break;
          case 'reviews':
            console.log('     💡 Consider: Cached ratings, denormalized review counts');
            break;
          default:
            console.log('     💡 Consider: Pagination, caching, reducing query frequency');
        }
      });
    }
    
    console.groupEnd();
  }

  // Suggest subscription cleanup
  suggestSubscriptionCleanup(stats) {
    console.group('🧹 Subscription Cleanup Suggestions');
    
    Object.entries(stats.subscriptionsByCollection).forEach(([collection, data]) => {
      if (data.count > 2) {
        console.warn(`   ⚠️ ${collection}: ${data.count} active subscriptions (might be duplicate)`);
      }
    });
    
    console.log('💡 Suggestions:');
    console.log('   - Check for component re-renders causing duplicate subscriptions');
    console.log('   - Ensure proper cleanup in useEffect dependencies');
    console.log('   - Consider using SubscriptionContext for shared subscriptions');
    
    console.groupEnd();
  }

  // Get optimization recommendations
  getOptimizationReport() {
    const stats = firebaseMonitor.getUsageStats();
    
    const report = {
      currentUsage: stats,
      alerts: [],
      recommendations: []
    };
    
    // Check for issues and generate recommendations
    if (stats.totalReads > this.alertThresholds.reads) {
      report.alerts.push({
        type: 'high_reads',
        severity: 'warning',
        message: `High read count: ${stats.totalReads} reads`
      });
      report.recommendations.push('Implement caching for frequently accessed data');
      report.recommendations.push('Review subscription patterns and reduce real-time updates');
    }
    
    if (stats.activeSubscriptions > this.alertThresholds.subscriptions) {
      report.alerts.push({
        type: 'many_subscriptions',
        severity: 'warning', 
        message: `Too many active subscriptions: ${stats.activeSubscriptions}`
      });
      report.recommendations.push('Consolidate subscriptions using shared contexts');
      report.recommendations.push('Ensure proper subscription cleanup');
    }
    
    return report;
  }
}

// Create global instance
const usageDebugger = new FirebaseUsageDebugger();

// Expose to window for console debugging
if (typeof window !== 'undefined') {
  window.debugFirebaseUsage = {
    start: (interval) => usageDebugger.startMonitoring(interval),
    stop: () => usageDebugger.stopMonitoring(),
    report: () => usageDebugger.logUsageReport(),
    optimize: () => usageDebugger.getOptimizationReport(),
    monitor: firebaseMonitor
  };
  
  // Auto-start monitoring in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [DevMode] Firebase usage monitoring available:');
    console.log('   - debugFirebaseUsage.start() - Start monitoring');
    console.log('   - debugFirebaseUsage.report() - Get current report');
    console.log('   - debugFirebaseUsage.optimize() - Get optimization suggestions');
    console.log('   - debugFirebaseUsage.stop() - Stop monitoring');
  }
}

export default usageDebugger; 