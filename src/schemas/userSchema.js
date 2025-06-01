/**
 * User Schema - Standardized user document structure
 * This schema ensures all user documents have consistent structure
 */

import { USER_ROLES } from '../utils/constants';

/**
 * Base user document schema
 * All user documents must follow this structure
 */
export const USER_SCHEMA = {
  // Required fields
  uid: '', // Firebase Auth UID (primary identifier)
  email: '',
  username: '',
  displayName: '',
  
  // Multi-role architecture
  roles: [USER_ROLES.CLIENT], // Array of roles
  activeRole: USER_ROLES.CLIENT, // Current active role
  isFreelancer: false, // Quick check flag
  
  // Profile information
  profilePhoto: null, // URL string or null
  phoneNumber: '',
  dateOfBirth: '', // YYYY-MM-DD format
  gender: '', // 'Male', 'Female', or ''
  location: '', // City name
  bio: '',
  
  // Status flags
  isActive: true,
  emailVerified: false,
  isOnline: false,
  
  // Timestamps (set by Firestore)
  createdAt: null,
  updatedAt: null
};

/**
 * Validate and sanitize user data according to schema
 * @param {Object} userData - Raw user data
 * @param {string} authUid - Firebase Auth UID
 * @returns {Object} Sanitized user data
 */
export const validateUserData = (userData, authUid) => {
  const sanitized = {
    // Core identifiers
    uid: authUid, // Always use auth UID as primary identifier
    email: (userData.email || '').toLowerCase().trim(),
    username: (userData.username || '').toLowerCase().trim(),
    displayName: (userData.displayName || userData.fullName || userData.username || '').trim(),
    
    // Multi-role architecture
    roles: Array.isArray(userData.roles) ? userData.roles : [USER_ROLES.CLIENT],
    activeRole: userData.activeRole || userData.role || USER_ROLES.CLIENT,
    isFreelancer: Boolean(userData.isFreelancer || (userData.roles && userData.roles.includes(USER_ROLES.FREELANCER))),
    
    // Profile information
    profilePhoto: userData.profilePhoto || null,
    phoneNumber: (userData.phoneNumber || '').trim(),
    dateOfBirth: userData.dateOfBirth || userData.birthDate || '',
    gender: userData.gender || '',
    location: userData.location || userData.city || '',
    bio: (userData.bio || '').trim(),
    
    // Status flags
    isActive: userData.isActive !== undefined ? Boolean(userData.isActive) : true,
    emailVerified: Boolean(userData.emailVerified),
    isOnline: Boolean(userData.isOnline)
  };

  // Validation rules
  if (!sanitized.email) {
    throw new Error('Email is required');
  }
  if (!sanitized.username) {
    throw new Error('Username is required');
  }
  if (!sanitized.displayName) {
    throw new Error('Display name is required');
  }
  if (!sanitized.uid) {
    throw new Error('UID is required');
  }

  return sanitized;
};

/**
 * Create client profile data
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @returns {Object} Client profile data
 */
export const createClientProfileData = (userId, userData) => {
  return {
    userId,
    phoneNumber: userData.phoneNumber || '',
    dateOfBirth: userData.dateOfBirth || '',
    gender: userData.gender || '',
    location: userData.location || '',
    bio: userData.bio || '',
    
    // Preferences
    marketingEmails: Boolean(userData.marketingEmails || userData.agreeToMarketing)
  };
};

/**
 * Create freelancer profile data
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @returns {Object} Freelancer profile data
 */
export const createFreelancerProfileData = (userId, userData) => {
  return {
    userId,
    skills: Array.isArray(userData.skills) ? userData.skills : [],
    experienceLevel: userData.experienceLevel || '',
    bio: userData.bio || '',
    portfolioLinks: Array.isArray(userData.portfolioLinks) ? userData.portfolioLinks.filter(Boolean) : [],
    hourlyRate: Number(userData.hourlyRate) || 0,
    availability: userData.availability || '',
    
    // Rating system (normalized)
    rating: 0,
    totalReviews: 0,
    totalOrders: 0
  };
}; 