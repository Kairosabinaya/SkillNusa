/**
 * Navigation cleanup utility to prevent duplicate subscriptions
 * when navigating between pages that use notification subscriptions
 */

import notificationService from '../services/notificationService';

class NavigationCleanup {
  constructor() {
    this.lastUserId = null;
    this.isCleanupInProgress = false;
  }

  /**
   * Clean up subscriptions when navigating away from notification-related pages
   * @param {string} userId - Current user ID
   * @param {string} reason - Reason for cleanup (navigation, logout, etc.)
   */
  async cleanupOnNavigation(userId, reason = 'navigation') {
    if (!userId || this.isCleanupInProgress) return;

    this.isCleanupInProgress = true;
    
    try {
      console.log(`🧹 [NavigationCleanup] Cleaning up subscriptions for user ${userId}, reason: ${reason}`);
      
      // Clean up notification service subscriptions for this user
      notificationService.cleanup(userId);
      
      // Update last user ID
      this.lastUserId = userId;
      
      console.log(`✅ [NavigationCleanup] Cleanup completed for user ${userId}`);
    } catch (error) {
      console.error('❌ [NavigationCleanup] Error during cleanup:', error);
    } finally {
      this.isCleanupInProgress = false;
    }
  }

  /**
   * Check if user has changed and trigger cleanup if needed
   * @param {string} newUserId - New user ID
   */
  handleUserChange(newUserId) {
    if (this.lastUserId && this.lastUserId !== newUserId) {
      this.cleanupOnNavigation(this.lastUserId, 'user-change');
    }
    this.lastUserId = newUserId;
  }

  /**
   * Force cleanup all subscriptions (emergency cleanup)
   */
  forceCleanupAll() {
    console.log('🚨 [NavigationCleanup] Force cleaning up all subscriptions');
    notificationService.cleanup(); // Clean up all without user filter
  }
}

// Create singleton instance
const navigationCleanup = new NavigationCleanup();

// Export the instance
export default navigationCleanup;

// Also provide it as window utility for debugging
if (typeof window !== 'undefined') {
  window.navigationCleanup = navigationCleanup;
} 