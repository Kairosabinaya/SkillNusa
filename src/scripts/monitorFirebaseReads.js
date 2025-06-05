/**
 * Firebase Reads Monitor Script
 * Run this script to monitor Firebase read usage in real-time
 */

// Check if running in browser environment
if (typeof window !== 'undefined' && window.firebaseMonitor) {
  console.log('🔍 Firebase Read Monitor is active');
  
  // Set up periodic reporting
  setInterval(() => {
    const report = window.firebaseMonitor.getReport();
    
    console.log('📊 Firebase Read Monitor Report:');
    console.log(`  Total Reads: ${report.totalReads}`);
    console.log(`  Reads/Minute: ${report.readsPerMinute}`);
    console.log(`  Active Subscriptions: ${report.activeSubscriptions}`);
    console.log(`  Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (report.topOperations.length > 0) {
      console.log('  Top Operations:');
      report.topOperations.forEach(([operation, count]) => {
        console.log(`    ${operation}: ${count} reads`);
      });
    }
    
    // Alert if reads are too high
    if (report.readsPerMinute > 500) {
      console.error('🚨 CRITICAL: Firebase reads are extremely high!');
      console.error('Consider implementing caching or reducing real-time subscriptions');
    } else if (report.readsPerMinute > 100) {
      console.warn('⚠️ WARNING: Firebase reads are high');
    }
    
    console.log('---');
  }, 30000); // Report every 30 seconds
  
  // Add global functions for manual monitoring
  window.getFirebaseReport = () => {
    return window.firebaseMonitor.getReport();
  };
  
  window.resetFirebaseMonitor = () => {
    window.firebaseMonitor.reset();
    console.log('🔄 Firebase monitor reset');
  };
  
  window.logFirebaseTopOperations = () => {
    window.firebaseMonitor.logTopOperations();
  };
  
  console.log('Available commands:');
  console.log('  window.getFirebaseReport() - Get current report');
  console.log('  window.resetFirebaseMonitor() - Reset monitoring');
  console.log('  window.logFirebaseTopOperations() - Show top operations');
  
} else {
  console.log('Firebase monitor not available. Make sure the app is running.');
}

export default {}; 