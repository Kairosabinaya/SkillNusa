# SkillNusa Database Structure

**Version**: 2.0  
**Created**: December 2024  
**Purpose**: Clean, normalized, and consistent database structure for SkillNusa freelance platform

---

## 🎯 **DESIGN PRINCIPLES**

### **1. Single Source of Truth**
- Each piece of data has ONE primary location
- No embedded duplicate data (use references instead)
- Clear data ownership and update responsibilities

### **2. Consistent Naming Convention**
- Collection names: `camelCase` (users, clientProfiles, freelancerProfiles)
- Field names: `camelCase` (userId, createdAt, profilePhoto)
- ID fields: Always `userId`, never mix with `freelancerId` or `clientId`
- Timestamp fields: `createdAt`, `updatedAt` consistently

### **3. Normalized Structure**
- User data separated by role (client vs freelancer)
- Rating data centralized in freelancerProfiles only
- No data duplication across collections
- Clear relationships via references

---

## 📊 **COLLECTIONS OVERVIEW**

```
📁 users/                     # Core user accounts
📁 clientProfiles/            # Client-specific data
📁 freelancerProfiles/        # Freelancer-specific data  
📁 gigs/                      # Freelancer services
📁 orders/                    # Service orders/transactions
📁 reviews/                   # Order reviews (separate from ratings)
📁 chats/                     # Chat conversations
📁 messages/                  # Chat messages
📁 notifications/             # User notifications
📁 favorites/                 # User favorites (references only)
```

---

## 🏗️ **COLLECTION STRUCTURES**

### **1. `users/` Collection**
**Purpose**: Core user authentication and basic profile data

```typescript
{
  id: string,                    // Document ID (Firebase Auth UID)
  email: string,                 // Required, unique
  username: string,              // Required, unique
  displayName: string,           // Required
  phoneNumber?: string,          // Optional
  profilePhoto?: string,         // Cloudinary URL
  emailVerified: boolean,        // Default: false
  
  // Role Management
  roles: string[],               // ["client", "freelancer", "admin"]
  activeRole: string,            // "client" | "freelancer" | "admin"
  isFreelancer: boolean,         // Quick check flag
  
  // Status
  isActive: boolean,             // Default: true
  isOnline: boolean,             // Default: false
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Registration forms, profile updates  
**Relationships**: 1:1 with clientProfiles, 1:1 with freelancerProfiles  

---

### **2. `clientProfiles/` Collection**
**Purpose**: Client-specific profile information

```typescript
{
  id: string,                    // Same as users document ID
  userId: string,                // Reference to users collection
  
  // Personal Info
  gender?: string,               // "Male" | "Female" | "Other"
  dateOfBirth?: string,          // YYYY-MM-DD format
  location?: string,             // City/region
  bio?: string,                  // Personal description
  
  // Business Info (for business clients)
  companyName?: string,
  industry?: string,
  
  // Preferences
  marketingEmails: boolean,      // Default: false
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Profile setup forms, settings pages  
**Relationships**: 1:1 with users  

---

### **3. `freelancerProfiles/` Collection**
**Purpose**: Freelancer-specific profile and performance data

```typescript
{
  id: string,                    // Same as users document ID
  userId: string,                // Reference to users collection
  
  // Personal Info
  gender?: string,
  dateOfBirth?: string,
  location?: string,
  bio?: string,
  
  // Professional Info
  skills: Array<{
    skill: string,
    experienceLevel: "Pemula" | "Menengah" | "Ahli"
  }>,
  
  education: Array<{
    degree: string,
    university: string,
    fieldOfStudy: string,
    graduationYear: string,
    country: string
  }>,
  
  certifications: Array<{
    name: string,
    issuedBy: string,
    year: string
  }>,
  
  // Work Details
  experienceLevel: "entry" | "intermediate" | "expert",
  hourlyRate: number,            // in IDR
  availability: "full-time" | "part-time",
  workingHours?: string,         // e.g., "08:00 - 17:00 WIB"
  languages?: string[],          // ["id", "en"]
  
  // Portfolio
  portfolioLinks: string[],      // Array of URLs
  website?: string,
  
  // Performance Metrics (SINGLE SOURCE OF TRUTH)
  rating: number,                // Average rating (0-5)
  totalReviews: number,          // Count of reviews
  totalOrders: number,           // Completed orders count
  completedProjects: number,     // Legacy field, same as totalOrders
  
  // Status
  tier?: "bronze" | "silver" | "gold" | "platinum",
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Become freelancer forms, profile edits, order completions  
**Rating Updates**: Calculated from reviews collection  
**Relationships**: 1:1 with users, 1:many with gigs  

---

### **4. `gigs/` Collection**
**Purpose**: Freelancer services/offerings

```typescript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // Reference to users (freelancer)
  
  // Basic Info
  title: string,                 // Required
  description: string,           // Required
  category: string,              // Required
  subcategory?: string,
  tags: string[],                // For search
  
  // Media
  images: string[],              // Cloudinary URLs
  
  // Packages
  packages: {
    basic: {
      name: string,
      description: string,
      price: number,             // in IDR
      deliveryTime: number,      // in days
      revisions: number,
      features: string[]
    },
    standard?: {
      name: string,
      description: string, 
      price: number,
      deliveryTime: number,
      revisions: number,
      features: string[]
    },
    premium?: {
      name: string,
      description: string,
      price: number,
      deliveryTime: number,
      revisions: number,
      features: string[]
    }
  },
  
  // Performance (DERIVED FROM ORDERS)
  totalOrders: number,           // Count from orders collection
  inQueue: number,               // Active orders count
  
  // Status
  isActive: boolean,             // Default: true
  status: "active" | "paused" | "draft",
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Create/Edit gig forms  
**Performance Updates**: Calculated from orders collection  
**Relationships**: Many:1 with users, 1:many with orders  

---

### **5. `orders/` Collection**
**Purpose**: Service orders and transactions

```typescript
{
  id: string,                    // Auto-generated document ID
  orderNumber: string,           // Human-readable (ORD-YYYYMMDD-XXXXXX)
  
  // Parties
  clientId: string,              // Reference to users
  freelancerId: string,          // Reference to users (same as gig owner)
  gigId: string,                 // Reference to gigs
  
  // Order Details
  packageType: "basic" | "standard" | "premium",
  title: string,                 // Gig title at time of order
  description: string,           // Package description at time of order
  requirements: string,          // Client requirements
  
  // Pricing
  price: number,                 // Package price at time of order
  totalAmount: number,           // Same as price
  platformFee: number,           // 10% of price
  freelancerEarning: number,     // price - platformFee
  
  // Timeline
  deliveryTime: number,          // Days
  revisions: number,             // Max revisions allowed
  dueDate: Timestamp,            // Expected delivery
  
  // Status
  status: "pending" | "in_progress" | "delivered" | "in_revision" | "completed" | "cancelled",
  paymentStatus: "pending" | "paid" | "refunded",
  paymentMethod: "bank_transfer" | "e_wallet" | "credit_card",
  
  // Progress Tracking
  progress: {
    percentage: number,          // 0-100
    currentPhase: string,        // Current status
    phases: Array<{
      name: string,
      completed: boolean,
      date?: Timestamp
    }>
  },
  
  // Deliveries & Revisions
  deliveries: Array<{
    message: string,
    attachments?: Array<{
      name: string,
      url: string,
      size: number,
      type: string
    }>,
    createdAt: Timestamp
  }>,
  
  revisionCount: number,         // Current revision count
  maxRevisions: number,          // Same as revisions
  
  // Delivery Info
  hasAttachments?: boolean,      // If final delivery has attachments
  deliveryMessage?: string,      // Final delivery message
  deliveredAt?: Timestamp,       // Final delivery time
  
  // Completion
  completedAt?: Timestamp,       // When marked complete
  hasRating?: boolean,           // If client left review
  ratedAt?: Timestamp,           // When review was left
  
  // Timeline Tracking
  timeline: {
    ordered: Timestamp,
    confirmed?: Timestamp,
    completed?: Timestamp,
    cancelled?: Timestamp
  },
  
  // Metadata
  statusMessage?: string,        // Additional status info
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Checkout forms, order management  
**Status Updates**: Through order management system  
**Relationships**: Many:1 with users (client), Many:1 with users (freelancer), Many:1 with gigs  

---

### **6. `reviews/` Collection**
**Purpose**: Order reviews and ratings (SEPARATE from rating aggregates)

```typescript
{
  id: string,                    // Auto-generated document ID
  orderId: string,               // Reference to orders
  gigId: string,                 // Reference to gigs
  freelancerId: string,          // Reference to users (freelancer)
  clientId: string,              // Reference to users (client)
  
  // Review Content
  rating: number,                // 1-5 stars
  comment: string,               // Review text
  
  // Interaction
  helpful: number,               // Helpful votes count
  
  // Moderation
  status: "published" | "pending" | "hidden",
  isVisible: boolean,            // Default: true
  isReported: boolean,           // Default: false
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Review forms after order completion  
**Rating Calculation**: Used to update freelancerProfiles.rating  
**Relationships**: 1:1 with orders, Many:1 with freelancerProfiles  

---

### **7. `chats/` Collection**
**Purpose**: Chat conversations between users

```typescript
{
  id: string,                    // Auto-generated document ID
  
  // Participants
  participants: string[],        // [clientId, freelancerId]
  participantDetails: {
    [userId]: {
      displayName: string,
      profilePhoto?: string,
      role: "client" | "freelancer"
    }
  },
  
  // Context
  gigId?: string,                // Related gig (if any)
  orderId?: string,              // Related order (if any)
  
  // Status
  isActive: boolean,             // Default: true
  
  // Last Message Info
  lastMessage: string,
  lastMessageSender: string,     // userId
  lastMessageTime: Timestamp,
  
  // Unread Counts
  unreadCount: {
    [userId]: number
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Data Sources**: Chat system, automatic on order creation  
**Participant Details**: Synced from users collection  
**Relationships**: Many:many with users  

---

### **8. `messages/` Collection**
**Purpose**: Individual chat messages

```typescript
{
  id: string,                    // Auto-generated document ID
  chatId: string,                // Reference to chats
  senderId: string,              // Reference to users
  
  // Content
  content: string,               // Message text
  messageType: "text" | "file" | "order_notification" | "order_status" | "gig_context",
  
  // File Attachments (if messageType === "file")
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  fileType?: string,
  
  // Metadata (for special message types)
  metadata?: {
    // For order_notification
    orderId?: string,
    orderData?: {
      gigTitle: string,
      packageType: string,
      price: number,
      clientRequirements: string
    },
    
    // For order_status
    orderId?: string,
    newStatus?: string,
    additionalInfo?: string,
    
    // For gig_context
    gigId?: string,
    gigTitle?: string,
    gigThumbnail?: string
  },
  
  // Status
  isRead: boolean,               // Default: false
  readAt?: Timestamp,
  
  // Timestamps
  createdAt: Timestamp
}
```

**Data Sources**: Chat interface, system notifications  
**Metadata**: Context-specific data, NO embedded full objects  
**Relationships**: Many:1 with chats, Many:1 with users  

---

### **9. `notifications/` Collection**
**Purpose**: User notifications

```typescript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // Reference to users (recipient)
  
  // Content
  type: "order_update" | "order_delivered" | "message" | "review" | "system",
  message: string,               // Notification text
  
  // Related Data (REFERENCES ONLY)
  orderId?: string,              // Reference to orders
  chatId?: string,               // Reference to chats
  gigId?: string,                // Reference to gigs
  
  // Status
  read: boolean,                 // Default: false
  readAt?: Timestamp,
  
  // Timestamps
  createdAt: Timestamp
}
```

**Data Sources**: System events (order updates, new messages, etc.)  
**Content**: Text only, fetch details via references  
**Relationships**: Many:1 with users  

---

### **10. `favorites/` Collection**
**Purpose**: User favorites (REFERENCES ONLY, no embedded data)

```typescript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // Reference to users
  gigId: string,                 // Reference to gigs
  
  // Timestamps
  createdAt: Timestamp
}
```

**Data Sources**: Favorite buttons in UI  
**Display Data**: Fetched from gigs collection via gigId  
**Relationships**: Many:1 with users, Many:1 with gigs  

---

## 🔗 **RELATIONSHIPS & DATA FLOW**

### **User Registration Flow**
1. Create document in `users/` collection
2. If client: Create document in `clientProfiles/`
3. If freelancer: Create document in `freelancerProfiles/`

### **Rating System Flow**
1. Client completes order → Creates review in `reviews/`
2. Review creation triggers → Update `freelancerProfiles.rating` & `freelancerProfiles.totalReviews`
3. **NEVER store rating in gigs** → Always fetch from freelancerProfiles

### **Chat System Flow**
1. User contacts freelancer → Create/get chat in `chats/`
2. Order created → Link chat via `orderId`
3. Messages sent → Create in `messages/`, update chat `lastMessage` fields

### **Favorites Flow**
1. User favorites gig → Create reference in `favorites/`
2. Display favorites → Fetch gig details via `gigId` reference
3. **NO embedded gig data** in favorites

---

## 📝 **FIELD NAMING STANDARDS**

### **ID Fields**
- `userId` - Always for user references
- `gigId` - For gig references  
- `orderId` - For order references
- `chatId` - For chat references

### **Timestamp Fields**
- `createdAt` - When record was created
- `updatedAt` - When record was last modified
- `deliveredAt` - When order was delivered
- `completedAt` - When order was completed
- `ratedAt` - When review was submitted

### **Status Fields**
- `isActive` - Boolean for active/inactive status
- `isOnline` - Boolean for online status
- `status` - String enum for detailed status

### **Photo Fields**
- `profilePhoto` - User profile photo URL
- `images` - Array of image URLs (for gigs)

---

## 🚀 **MIGRATION STRATEGY**

### **Phase 1: Clean Database**
1. Run `cleanDatabase.js` to clear all existing data
2. Update all code to use new structure
3. Reseed with new standardized structure

### **Phase 2: Code Updates**
1. Update all services to use single source fields
2. Remove embedded data operations
3. Implement reference-based data fetching
4. Update all forms to save in correct locations

### **Phase 3: Validation**
1. Add Firestore security rules
2. Implement data validation schemas
3. Add automated tests for data consistency

---

## ⚠️ **CRITICAL RULES**

1. **NO EMBEDDED DATA** - Always use references
2. **SINGLE RATING SOURCE** - Only in freelancerProfiles
3. **CONSISTENT FIELD NAMES** - Follow naming standards
4. **UPDATE ALL LOCATIONS** - When user data changes, update all references
5. **VALIDATE BEFORE SAVE** - Always validate data structure

---

This structure eliminates all 18 identified issues and provides a clean, maintainable database foundation for SkillNusa. 