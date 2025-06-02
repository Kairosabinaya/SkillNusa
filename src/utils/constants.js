/**
 * Application-wide constants
 */

/**
 * Authentication states
 */
export const AUTH_STATES = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOADING: 'loading'
};

/**
 * User roles in the system
 */
export const USER_ROLES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  ADMIN: 'admin'
};

/**
 * Firebase collections
 */
export const COLLECTIONS = {
  USERS: 'users',
  // Tidak lagi menggunakan koleksi 'profiles' (legacy)
  // PROFILES: 'profiles',
  
  // Menggunakan format yang konsisten sesuai dengan yang ada di Firestore
  CLIENT_PROFILES: 'clientProfiles',
  FREELANCER_PROFILES: 'freelancerProfiles',
  PROJECTS: 'projects',
  PROPOSALS: 'proposals',
  MESSAGES: 'messages',
  GIGS: 'gigs',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications',
  SKILLBOT_CONVERSATIONS: 'skillbotConversations'
};

// Freelancer status constants removed - no longer using approval system

/**
 * Project statuses
 */
export const PROJECT_STATUSES = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1
};

/**
 * API error messages
 */
export const ERROR_MESSAGES = {
  GENERAL: 'Something went wrong. Please try again later.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.'
}; 