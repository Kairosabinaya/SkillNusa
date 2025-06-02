# Admin Dashboard - SkillNusa

## Overview

The Admin Dashboard provides comprehensive administrative capabilities for managing the SkillNusa platform. It includes user management, gig management, and system statistics with full cascade deletion support.

## Features

### 1. Dashboard Overview (`/dashboard/admin`)
- **Statistics Cards**: Total users, gigs, orders, and reviews
- **Quick Actions**: Direct links to user and gig management
- **Real-time Data**: Live statistics from the database

### 2. User Management (`/dashboard/admin/users`)
- **View All Users**: Complete list of registered users
- **Search Functionality**: Search by email, username, or display name
- **User Information**: Profile photos, roles, account status, registration date
- **Delete Users**: Cascade deletion with confirmation
- **Role Identification**: Visual badges for Admin, Freelancer, and Client roles
- **Protection**: Admins cannot delete themselves or other admins

### 3. Gig Management (`/dashboard/admin/gigs`)
- **View All Gigs**: Complete list of all gigs on the platform
- **Search Functionality**: Search by title, description, or tags
- **Gig Information**: Images, freelancer details, pricing, ratings, status
- **Delete Gigs**: Cascade deletion with confirmation
- **View Gigs**: Direct links to view gigs on the platform
- **Status Tracking**: Active/inactive gig status

## Cascade Deletion System

### User Deletion
When an admin deletes a user, the system automatically removes:
- User document from Firestore
- Client profile (if exists)
- Freelancer profile (if exists)
- All user's gigs
- All user's orders (as client or freelancer)
- All user's reviews (given and received)
- All user's messages
- All user's favorites
- All user's notifications
- All user's reports
- Profile photos from Cloudinary
- Portfolio images from Cloudinary
- User from Firebase Authentication

### Gig Deletion
When an admin deletes a gig, the system automatically removes:
- Gig document from Firestore
- All gig images from Cloudinary
- All related reviews
- All related orders
- All related favorites
- All related cart items

## Admin Role Setup

### Database Setup
Admin roles must be assigned directly in the database by a database administrator:

```javascript
// In Firestore, update the user document:
{
  uid: "user-id",
  email: "admin@example.com",
  username: "admin",
  displayName: "Admin User",
  roles: ["admin"], // Add admin role
  isFreelancer: false,
  isActive: true,
  // ... other fields
}
```

### Authentication Flow
1. User logs in normally through the authentication system
2. The system checks the user's `roles` array for the "admin" role
3. If admin role is found, user is redirected to `/dashboard/admin`
4. Admin navigation items are displayed in the sidebar

## Security Features

### Role-Based Access Control
- **RoleRoute Component**: Protects admin routes from non-admin users
- **Admin Guard**: Redirects non-admin users to client dashboard
- **Self-Protection**: Admins cannot delete their own accounts
- **Admin Protection**: Admins cannot delete other admin accounts

### Confirmation System
- **Two-Step Deletion**: Users must click delete, then confirm
- **Loading States**: Visual feedback during deletion operations
- **Error Handling**: Comprehensive error reporting and user feedback

## API Services

### AdminService (`src/services/adminService.js`)
Main service class providing all admin functionality:

```javascript
// Get dashboard statistics
const stats = await adminService.getDashboardStats();

// Get all users with pagination
const users = await adminService.getAllUsers({ limit: 50 });

// Get all gigs with pagination
const gigs = await adminService.getAllGigs({ limit: 50 });

// Delete user with cascade deletion
const result = await adminService.deleteUser(userId);

// Delete gig with cascade deletion
const result = await adminService.deleteGig(gigId);

// Search users
const users = await adminService.searchUsers("search term");

// Search gigs
const gigs = await adminService.searchGigs("search term");
```

## Components

### AdminDashboard (`src/pages/Dashboard/AdminDashboard.js`)
- Main dashboard with statistics and quick actions
- Real-time data loading with error handling
- Responsive design with loading states

### AdminUsers (`src/pages/Dashboard/AdminUsers.js`)
- User management interface
- Search functionality
- Deletion with confirmation
- Role-based protections

### AdminGigs (`src/pages/Dashboard/AdminGigs.js`)
- Gig management interface
- Search functionality
- Deletion with confirmation
- View gig functionality

## Navigation

### Dashboard Layout Integration
Admin navigation items are automatically displayed when an admin user accesses the dashboard:

- Dashboard Admin
- Kelola Pengguna (User Management)
- Kelola Gigs (Gig Management)
- Pengaturan (Settings)

### Routing
All admin routes are protected by the `RoleRoute` component:

```javascript
<Route 
  path="admin" 
  element={
    <RoleRoute allowedRoles="admin">
      <AdminDashboard />
    </RoleRoute>
  } 
/>
```

## Error Handling

### Service Level
- Try-catch blocks around all database operations
- Detailed error logging
- User-friendly error messages

### Component Level
- Loading states during operations
- Error state display
- Retry functionality

### Deletion Operations
- Batch operations for atomicity
- Error collection for partial failures
- Success/failure reporting

## Performance Considerations

### Pagination
- Default limit of 50 items per page
- Configurable pagination options
- Efficient Firestore queries

### Search Optimization
- Client-side filtering for small datasets
- Debounced search input
- Minimum search term length

### Image Handling
- Cloudinary integration for image deletion
- Error handling for missing images
- Batch image deletion

## Usage Instructions

### For Database Administrators
1. Add admin role to user document in Firestore
2. Ensure user has `roles: ["admin"]` in their profile
3. User will automatically get admin access on next login

### For Admin Users
1. Log in to the platform normally
2. Navigate to `/dashboard` - you'll be redirected to admin dashboard
3. Use the sidebar navigation to access different admin functions
4. Use search functionality to find specific users or gigs
5. Use delete functionality with caution - deletions are permanent

### For Developers
1. Import `adminService` for admin operations
2. Use `RoleRoute` component to protect admin routes
3. Check `userProfile.roles?.includes('admin')` for admin checks
4. Follow the cascade deletion pattern for new admin features

## Testing

### Manual Testing
1. Create a test admin user in the database
2. Log in and verify admin dashboard access
3. Test user and gig management features
4. Verify cascade deletion works correctly

### Console Testing
Use the test script in the browser console:
```javascript
// Available in browser console
testAdminService();
```

## Future Enhancements

### Planned Features
- Order management interface
- Review moderation system
- User activity logs
- System configuration panel
- Bulk operations
- Export functionality
- Advanced analytics

### Technical Improvements
- Real-time updates with WebSocket
- Advanced search with Algolia
- Audit logging system
- Role-based permissions granularity
- Automated backup system

## Support

For technical support or questions about the admin dashboard:
1. Check the error logs in the browser console
2. Verify user roles in the database
3. Ensure proper Firebase permissions
4. Contact the development team for assistance 