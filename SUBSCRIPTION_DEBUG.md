# Debug Guide: Subscription Issues

## Problem
Halaman `/dashboard/freelancer/orders` mengalami loading lama dan warning "Subscription already exists" karena duplikasi subscription.

## Root Cause
1. Multiple subscription systems yang berjalan bersamaan
2. `useOrderManagement` hook membuat subscription baru tanpa check duplikasi
3. `SubscriptionContext` juga membuat subscription untuk order notifications
4. Tidak ada mechanism cleanup yang proper

## Solution Applied

### 1. Subscription Registry Integration
- Added `subscriptionRegistry` import to `useOrderManagement`
- Check existing subscription before creating new one
- Use fallback fetch if subscription already exists

### 2. Improved Subscription Management
- Use different subscription types for different purposes:
  - `freelancer_orders_management` - for order management
  - `order_notifications` - for notification counts
- Proper subscription cleanup on unmount

### 3. Debug Utilities
- `debugCleanupFreelancerOrders()` - Manual cleanup function available in console
- `window.subscriptionRegistry` - Access to subscription registry in browser console
- `window.emergencyCleanupSubscriptions()` - Emergency cleanup function
- `window.subscriptionMonitor` - Subscription health monitoring
- `window.checkSubscriptionHealth()` - Check for stuck/slow subscriptions
- `window.getSubscriptionStats()` - Get subscription statistics

## Debug Commands

### In Browser Console:

```javascript
// Check current subscriptions
window.subscriptionRegistry.getStats()

// Check subscription health (stuck/slow subscriptions)
window.checkSubscriptionHealth()

// Get detailed subscription statistics
window.getSubscriptionStats()

// Manual cleanup for freelancer orders
debugCleanupFreelancerOrders()

// Emergency cleanup all subscriptions
window.emergencyCleanupSubscriptions()

// Check specific user subscriptions
window.subscriptionRegistry.cleanupUserSubscriptions('USER_ID')

// Monitor specific subscription
window.subscriptionMonitor.trackSubscriptionStart('subscription_id', 'type', 'user_id')
```

## Prevention

1. Always check `subscriptionRegistry.hasSubscription()` before creating new subscriptions
2. Use unique subscription types for different purposes
3. Always register subscriptions with `subscriptionRegistry.registerSubscription()`
4. Clean up subscriptions properly on component unmount

## Testing

1. Navigate to `/dashboard/freelancer/orders`
2. Check console for subscription warnings
3. Page should load normally without hanging
4. Refresh page should work immediately
5. No duplicate subscriptions should be created

## Future Improvements

1. Add subscription timeout mechanism
2. Implement subscription health check
3. Add automatic retry with exponential backoff
4. Create centralized subscription manager 