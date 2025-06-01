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
 * Firebase collections - Standardized naming (camelCase)
 */
export const COLLECTIONS = {
  USERS: 'users',
  CLIENT_PROFILES: 'clientProfiles',
  FREELANCER_PROFILES: 'freelancerProfiles',
  GIGS: 'gigs',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  CHATS: 'chats',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  FAVORITES: 'favorites'
};

/**
 * Order statuses
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  IN_REVISION: 'in_revision',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Payment statuses
 */
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

/**
 * Gig statuses
 */
export const GIG_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DRAFT: 'draft'
};

/**
 * Review statuses
 */
export const REVIEW_STATUSES = {
  PUBLISHED: 'published',
  PENDING: 'pending',
  HIDDEN: 'hidden'
};

/**
 * Message types
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
  ORDER_NOTIFICATION: 'order_notification',
  ORDER_STATUS: 'order_status',
  GIG_CONTEXT: 'gig_context'
};

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  ORDER_DELIVERED: 'order_delivered',
  MESSAGE: 'message',
  REVIEW: 'review',
  SYSTEM: 'system'
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