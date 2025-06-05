import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import favoriteService from '../services/favoriteService';
import cartService from '../services/cartService';
import chatService from '../services/chatService';
import subscriptionRegistry from '../utils/subscriptionRegistry';

const SubscriptionContext = createContext();

export const useSubscriptions = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }) {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({
    favorites: 0,
    cart: 0,
    messages: 0
  });
  
  // Track active subscriptions to prevent duplicates
  const subscriptionsRef = useRef({});
  
  // Function to clean up all subscriptions
  const cleanupAllSubscriptions = () => {
    console.log('🧹 [SubscriptionContext] Force cleaning up all subscriptions');
    
    // Clean up through subscription registry (preferred method)
    if (currentUser) {
      const cleanedCount = subscriptionRegistry.cleanupUserSubscriptions(currentUser.uid);
      console.log(`🧹 [SubscriptionContext] Registry cleaned up ${cleanedCount} subscriptions`);
    }
    
    // Also clean up local references as backup
    Object.values(subscriptionsRef.current).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Warning: Error during subscription cleanup:', error);
        }
      }
    });
    subscriptionsRef.current = {};
    
    setCounts({
      favorites: 0,
      cart: 0,
      messages: 0
    });
  };
  
  useEffect(() => {
    if (!currentUser) {
      // Clear all subscriptions and reset counts
      cleanupAllSubscriptions();
      return;
    }

    console.log('🔄 [SubscriptionContext] Setting up unified subscriptions for user:', currentUser.uid);

    // Check if subscriptions already exist for this user (prevent StrictMode double-mounting)
    const hasExistingSubscriptions = Object.keys(subscriptionsRef.current).length > 0;
    if (hasExistingSubscriptions) {
      console.log('⚠️ [SubscriptionContext] Subscriptions already exist, skipping setup (likely StrictMode double-mount)');
      return;
    }

    // Clean up existing subscriptions first to prevent duplicates
    cleanupAllSubscriptions();

    // Add a small delay to ensure cleanup completes before creating new subscriptions
    const setupTimer = setTimeout(() => {
      // Double-check if subscriptions were created in the meantime (race condition protection)
      if (Object.keys(subscriptionsRef.current).length > 0) {
        console.log('⚠️ [SubscriptionContext] Subscriptions already created, aborting setup');
        return;
      }

      try {
        // Check registry before creating any subscriptions
        const registryStats = subscriptionRegistry.getStats();
        console.log('📊 [SubscriptionContext] Current registry stats:', registryStats);

        // Favorites count subscription (single instance)
        if (!subscriptionRegistry.hasSubscription(currentUser.uid, 'favorites')) {
          console.log('📡 [SubscriptionContext] Setting up favorites subscription');
          const favoritesUnsubscribe = favoriteService.subscribeToFavoritesCount(
            currentUser.uid, 
            (count) => {
              console.log('📊 [SubscriptionContext] Favorites count update:', count);
              setCounts(prev => ({ ...prev, favorites: count }));
            }
          );
          
          subscriptionsRef.current.favorites = favoritesUnsubscribe;
          subscriptionRegistry.registerSubscription(currentUser.uid, 'favorites', favoritesUnsubscribe);
        } else {
          console.log('⚠️ [SubscriptionContext] Favorites subscription already exists, skipping');
        }

        // Cart count subscription (single instance)
        if (!subscriptionRegistry.hasSubscription(currentUser.uid, 'cart')) {
          console.log('📡 [SubscriptionContext] Setting up cart subscription');
          const cartUnsubscribe = cartService.subscribeToCartCount(
            currentUser.uid, 
            (count) => {
              console.log('📊 [SubscriptionContext] Cart count update:', count);
              setCounts(prev => ({ ...prev, cart: count }));
            }
          );
          
          subscriptionsRef.current.cart = cartUnsubscribe;
          subscriptionRegistry.registerSubscription(currentUser.uid, 'cart', cartUnsubscribe);
        } else {
          console.log('⚠️ [SubscriptionContext] Cart subscription already exists, skipping');
        }

        // Messages count subscription (single instance)
        if (!subscriptionRegistry.hasSubscription(currentUser.uid, 'messages')) {
          console.log('📡 [SubscriptionContext] Setting up messages subscription');
          const messagesUnsubscribe = chatService.subscribeToUnreadCount(
            currentUser.uid, 
            (count) => {
              console.log('📊 [SubscriptionContext] Messages count update:', count);
              setCounts(prev => ({ ...prev, messages: count }));
            }
          );
          
          subscriptionsRef.current.messages = messagesUnsubscribe;
          subscriptionRegistry.registerSubscription(currentUser.uid, 'messages', messagesUnsubscribe);
        } else {
          console.log('⚠️ [SubscriptionContext] Messages subscription already exists, skipping');
        }

        console.log('✅ [SubscriptionContext] All subscriptions set up successfully');
      } catch (error) {
        console.error('❌ [SubscriptionContext] Error setting up subscriptions:', error);
      }
    }, 200); // Increased delay to handle StrictMode

    // Cleanup on user change
    return () => {
      console.log('🧹 [SubscriptionContext] Cleaning up subscriptions');
      clearTimeout(setupTimer);
      cleanupAllSubscriptions();
    };
  }, [currentUser?.uid]); // Only depend on user ID to prevent unnecessary re-subscriptions
  
  // Listen for forced cleanup events (e.g., during account deletion)
  useEffect(() => {
    const handleForceCleanup = (event) => {
      const { userId, reason } = event.detail;
      console.log(`🧹 [SubscriptionContext] Received force cleanup request for user ${userId}, reason: ${reason}`);
      
      if (currentUser && userId === currentUser.uid) {
        cleanupAllSubscriptions();
      }
    };

    window.addEventListener('forceCleanupSubscriptions', handleForceCleanup);
    
    return () => {
      window.removeEventListener('forceCleanupSubscriptions', handleForceCleanup);
    };
  }, [currentUser?.uid]);

  const value = {
    counts,
    // Method to force refresh specific count if needed
    refreshCount: (type) => {
      console.log(`🔄 [SubscriptionContext] Force refreshing ${type} count`);
      // Implementation for manual refresh if needed
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
} 