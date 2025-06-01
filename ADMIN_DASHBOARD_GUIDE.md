# Admin Dashboard Guide - SkillNusa

## Overview

The SkillNusa Admin Dashboard provides comprehensive management capabilities for the entire platform. Admins can manage users, gigs, orders, and view analytics from a centralized interface.

## ⚠️ Important: Firebase Authentication vs Firestore

**CRITICAL UNDERSTANDING**: Firebase Authentication and Firestore are **separate services**. When you delete a user from the admin dashboard:

- ✅ **User is removed from Firestore database** (your app's user data)
- ❌ **User remains in Firebase Authentication** (can still login!)

### Security Implications

- User can still login with their email/password even after being "deleted"
- User profile data is gone, but authentication credentials persist
- This creates a security gap where deleted users can still access the platform

### Solutions Implemented

The admin dashboard now provides **two user management options**:

1. **🟡 Deactivate User (Recommended)**: 
   - Sets `isActive: false` and `isDeleted: true`
   - User data remains in Firestore but marked as deleted
   - Safer approach as user status is tracked

2. **🔴 Delete from Database (Not Secure)**:
   - Completely removes user from Firestore
   - Shows security warning about Authentication persistence
   - Admin must manually clean up Firebase Authentication

### Complete User Removal Process

To completely remove a user:

1. **Use Admin Dashboard**: Deactivate or delete user from Firestore
2. **Manual Firebase Console Cleanup**:
   - Go to Firebase Console → Authentication
   - Find the user by email
   - Delete manually from Authentication panel
3. **Or Implement Cloud Functions** (recommended for production):
   ```javascript
   // Cloud Function to sync deletions
   exports.deleteUserAuth = functions.firestore
     .document('users/{userId}')
     .onDelete(async (snap, context) => {
       const admin = require('firebase-admin');
       try {
         await admin.auth().deleteUser(context.params.userId);
       } catch (error) {
         console.error('Error deleting user from Auth:', error);
       }
     });
   ```

## Features

### 1. Dashboard Overview (`/dashboard/admin`)
- Platform statistics and KPIs
- Recent user registrations
- Recent gig creations
- Recent order activity
- Quick access buttons to all management sections

### 2. User Management (`/dashboard/admin/users`)
- **🆕 Enhanced Security Features**:
  - Warning banner about Firebase Authentication persistence
  - Two-step user deletion process with security warnings
  - Improved user deactivation system
- View all users with filtering and search capabilities
- Add new users manually
- Edit user information
- **Smart Delete Options**:
  - Deactivate user (recommended, secure)
  - Delete from database (with security warnings)
- Toggle user active/inactive status
- Change user roles (client, freelancer, admin)
- Filter by role (admin, freelancer, client)
- Filter by status (active, inactive)
- **Automatic filtering of deleted users**

### 3. Gig Management (`/dashboard/admin/gigs`)
- View all gigs with filtering and search
- Create new gigs and assign to freelancers
- Edit existing gig details
- Delete gigs
- Toggle gig active/inactive status
- Filter by category
- Filter by status
- Comprehensive gig creation form with:
  - Basic info (title, description, category, subcategory)
  - Freelancer assignment
  - Tags management
  - Package pricing (Basic, Standard, Premium)
  - Features for each package

### 4. Order Management (`/dashboard/admin/orders`)
- View all orders with comprehensive details
- Real-time status updates
- Payment status management
- Detailed order information modal
- Filter by order status (pending, in_progress, completed, etc.)
- Filter by payment status (pending, paid, refunded)
- Search across order details
- Update order and payment status directly

### 5. Analytics (`/dashboard/admin/analytics`)
- Platform performance metrics
- Revenue analytics (total and monthly)
- User growth statistics with 30-day growth rate calculation
- Order analytics with success rates
- Top performing categories with visual charts
- Recent activity overview
- Detailed user and order analytics breakdown

## Security Best Practices

### 🔐 User Management Security

1. **Always use "Deactivate" instead of "Delete"** for user management
2. **Monitor deactivated users** to ensure they cannot access the platform
3. **Implement Cloud Functions** for automatic Authentication cleanup (production recommendation)
4. **Regular Authentication audit** - manually check Firebase Authentication for orphaned accounts
5. **User access logging** - track when deactivated users attempt to login

### 🛡️ Admin Access Control

- Only users with `roles: ['admin']` can access admin features
- All admin actions are logged with timestamps and admin user ID
- Admin status verification on every page load
- Secure Firebase rules prevent unauthorized database access

## Getting Admin Access

### For Development/Testing

In development mode, you can use the console utilities to grant admin access:

1. Open browser console (F12)
2. Get the user ID from Firebase (check user profile or database)
3. Run the following command:
```javascript
await window.adminUtils.makeUserAdmin('USER_ID_HERE')
```

### Manual Database Method

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the user document in the `users` collection
4. Add/update the `roles` field to include `'admin'`:
```json
{
  "roles": ["admin"]
}
```

### Through User Management Interface

If you already have admin access, you can use the User Management interface:
1. Go to `/dashboard/admin/users`
2. Find the user you want to make admin
3. Click edit button
4. Check the "Is Admin" checkbox
5. Save changes

## Key Functionalities

### User Management
- **Enhanced Security**: Proper handling of Firebase Authentication vs Firestore separation
- **Smart Delete Options**: Choose between deactivate (secure) and delete (with warnings)
- **Add Users**: Create new users with all necessary fields
- **Edit Users**: Modify user information and roles
- **Role Management**: Assign roles (client, freelancer, admin)
- **Status Control**: Activate/deactivate user accounts with proper tracking
- **Security Warnings**: Clear notifications about Authentication cleanup requirements

### Gig Management
- **Full CRUD Operations**: Create, read, update, delete gigs
- **Freelancer Assignment**: Assign gigs to specific freelancers
- **Package Management**: Configure pricing for Basic, Standard, Premium packages
- **Category Management**: Organize gigs by categories and subcategories
- **Feature Management**: Add specific features for each package tier

### Order Management
- **Order Tracking**: Monitor all orders across the platform
- **Status Updates**: Change order status (pending → in_progress → completed)
- **Payment Management**: Track and update payment status
- **Detailed Views**: Access comprehensive order information
- **Real-time Updates**: Changes reflect immediately across the platform

### Analytics & Reporting
- **Performance Metrics**: Track platform growth and usage
- **Revenue Analytics**: Monitor financial performance with monthly breakdowns
- **User Analytics**: Track user engagement, growth rates, and demographics
- **Category Performance**: Identify top-performing service categories
- **Growth Tracking**: 30-day growth rate calculations for users and orders

## Database Structure

The admin dashboard works with the following enhanced collections:

### Users Collection
```javascript
{
  id: "user_id",
  email: "user@example.com",
  username: "username",
  displayName: "Display Name",
  roles: ["admin"], // or ["client"] or ["freelancer"]
  isFreelancer: boolean,
  isActive: boolean,
  isDeleted: boolean, // NEW: For soft delete tracking
  deletedAt: timestamp, // NEW: When user was deleted
  deletedBy: "admin_user_id", // NEW: Which admin deleted the user
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Gigs Collection
```javascript
{
  id: "gig_id",
  title: "Gig Title",
  description: "Gig Description",
  category: "Programming & Tech",
  subcategory: "Web Development",
  freelancerId: "freelancer_user_id",
  tags: ["tag1", "tag2"],
  packages: {
    basic: { price: 50000, description: "...", deliveryTime: 3, revisions: 1 },
    standard: { price: 100000, description: "...", deliveryTime: 5, revisions: 2 },
    premium: { price: 200000, description: "...", deliveryTime: 7, revisions: 3 }
  },
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Orders Collection
```javascript
{
  id: "order_id",
  clientId: "client_user_id",
  freelancerId: "freelancer_user_id",
  gigId: "gig_id",
  packageType: "basic|standard|premium",
  price: number,
  status: "pending|in_progress|completed|cancelled|dispute",
  paymentStatus: "pending|paid|refunded",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API/Service Integration

The admin dashboard integrates with:
- **Firebase Firestore**: For data storage and real-time updates
- **Firebase Auth**: For user authentication and role verification (with security considerations)
- **React Router**: For navigation and route protection
- **Formik & Yup**: For form handling and validation
- **Framer Motion**: For smooth animations and transitions

## Best Practices

1. **Security First**: Always consider Firebase Authentication vs Firestore separation
2. **Use Soft Deletes**: Prefer deactivating users over permanent deletion
3. **Authentication Cleanup**: Regularly audit Firebase Authentication for orphaned accounts
4. **Admin Monitoring**: Track all admin activities for security purposes
5. **User Verification**: Implement proper user verification workflows
6. **Data Backup**: Regularly backup important platform data
7. **Access Logging**: Monitor admin access patterns for security

## Troubleshooting

### Common Issues

1. **"Deleted" User Can Still Login**:
   - **Cause**: User deleted from Firestore but still in Firebase Authentication
   - **Solution**: Manually delete from Firebase Console → Authentication
   - **Prevention**: Use "Deactivate" option instead of "Delete"

2. **Access Denied**: 
   - Ensure user has admin role in Firebase
   - Check that `roles` array includes 'admin'

3. **Data Not Loading**: 
   - Check Firebase configuration and network connectivity
   - Verify Firebase rules allow admin operations

4. **Form Validation Errors**: 
   - Verify all required fields are filled
   - Check data types match schema requirements

5. **Permission Errors**: 
   - Ensure Firebase security rules allow admin operations
   - Check user authentication status

### Security Monitoring

Monitor for these security issues:
- Users attempting to login after being "deleted"
- Orphaned accounts in Firebase Authentication
- Unusual admin activity patterns
- Failed authentication attempts from deactivated accounts

## Future Enhancements

Planned features for future releases:
- **Automated Cloud Functions** for Authentication cleanup
- **Enhanced audit trail** with detailed admin action logging
- **Bulk user operations** with proper security handling
- **Advanced user verification** system with email confirmation
- **Real-time security monitoring** dashboard
- **Automated security reports** for orphaned accounts
- **Two-factor authentication** for admin accounts
- **Advanced analytics** with charts and graphs
- **Export functionality** for reports
- **Real-time chat support** management

## Security Compliance

The admin dashboard follows security best practices:
- Role-based access control (RBAC)
- Secure session management
- Input validation and sanitization
- Audit trail for all admin actions
- Clear security warnings for dangerous operations
- Proper handling of sensitive user data 