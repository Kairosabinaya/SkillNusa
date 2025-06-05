import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import favoriteService from '../services/favoriteService';
import cartService from '../services/cartService';
import chatService from '../services/chatService';

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
  
  useEffect(() => {
    if (!currentUser) {
      // Clear all subscriptions and reset counts
      Object.values(subscriptionsRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
      subscriptionsRef.current = {};
      
      setCounts({
        favorites: 0,
        cart: 0,
        messages: 0
      });
      return;
    }

    console.log('🔄 [SubscriptionContext] Setting up unified subscriptions for user:', currentUser.uid);

    // Favorites count subscription (single instance)
    if (!subscriptionsRef.current.favorites) {
      subscriptionsRef.current.favorites = favoriteService.subscribeToFavoritesCount(
        currentUser.uid, 
        (count) => {
          console.log('📊 [SubscriptionContext] Favorites count update:', count);
          setCounts(prev => ({ ...prev, favorites: count }));
        }
      );
    }

    // Cart count subscription (single instance)
    if (!subscriptionsRef.current.cart) {
      subscriptionsRef.current.cart = cartService.subscribeToCartCount(
        currentUser.uid, 
        (count) => {
          console.log('📊 [SubscriptionContext] Cart count update:', count);
          setCounts(prev => ({ ...prev, cart: count }));
        }
      );
    }

    // Messages count subscription (single instance)
    if (!subscriptionsRef.current.messages) {
      subscriptionsRef.current.messages = chatService.subscribeToUnreadCount(
        currentUser.uid, 
        (count) => {
          console.log('📊 [SubscriptionContext] Messages count update:', count);
          setCounts(prev => ({ ...prev, messages: count }));
        }
      );
    }

    // Cleanup on user change
    return () => {
      console.log('🧹 [SubscriptionContext] Cleaning up subscriptions');
      Object.values(subscriptionsRef.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
      subscriptionsRef.current = {};
    };
  }, [currentUser?.uid]); // Only depend on user ID to prevent unnecessary re-subscriptions

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