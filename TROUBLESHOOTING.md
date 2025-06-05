# 🛠️ Troubleshooting Guide

## Fixed Issues

### ✅ Firebase Permission Error (Gig Creation)
**Problem**: "Missing or insufficient permissions" when creating gigs
**Solution**: Updated Firestore security rules to properly handle gig creation with `allow create` permissions

### ✅ Missing Firestore Index (FreelancerDashboard)
**Problem**: Query requires index for messages collection with `senderId`, `timestamp`, and `__name__` fields
**Solution**: Added composite index to `firestore.indexes.json` and deployed to Firebase

## Testing the Fixes

### 1. Test Gig Creation
Open browser console on the CreateGig page and run:
```javascript
// Test Firebase authentication status
window.testFirebaseAuth()

// Test gig creation permissions
window.testGigCreation()
```

### 2. Test FreelancerDashboard
Navigate to `/dashboard/freelancer` and check that:
- Response rate displays without errors
- No index-related errors in console
- All metrics load properly

## Common Issues & Solutions

### Authentication Problems
1. **Check if user is logged in**: `auth.currentUser`
2. **Verify user has freelancer role**: Check `userProfile.isFreelancer`
3. **Ensure email is verified**: `auth.currentUser.emailVerified`

### Permission Errors
1. **Firestore Rules**: Rules have been updated to separate `create`, `update`, `delete` permissions
2. **User ID Mismatch**: Ensure `freelancerId` and `userId` match the authenticated user
3. **Role-based Access**: Verify user has proper roles in their profile

### Index Errors
1. **Check Firebase Console**: Visit Firebase Console → Firestore → Indexes
2. **Deploy Indexes**: Run `firebase deploy --only firestore` to update indexes
3. **Wait for Build**: New indexes may take a few minutes to build

## Firebase Commands

```bash
# Deploy only Firestore rules and indexes
firebase deploy --only firestore

# Check deployment status
firebase list

# View Firestore rules locally
cat firestore.rules

# View indexes locally
cat firestore.indexes.json
```

## Browser Console Debugging

Use these commands in the browser console for debugging:

```javascript
// Check authentication
console.log('Current user:', firebase.auth().currentUser)

// Test Firestore connection
firebase.firestore().collection('gigs').limit(1).get()
  .then(snap => console.log('Firestore connected:', snap.size))
  .catch(err => console.error('Firestore error:', err))

// Monitor Firestore reads
window.getFirebaseReport()

// Test specific Firebase operations
window.testGigCreation()
window.testFirebaseAuth()
```

## Error Codes Reference

- `permission-denied`: User lacks necessary permissions
- `failed-precondition`: Missing required index
- `invalid-argument`: Invalid data format
- `unauthenticated`: User not signed in
- `unavailable`: Firebase service temporarily unavailable

## Next Steps

1. ✅ Firebase rules fixed for gig creation
2. ✅ Firestore indexes added for messages query
3. ✅ Error handling improved in CreateGig component
4. ✅ Test utilities added for debugging

The application should now work without permission errors or missing index issues. 