/**
 * Utility functions for handling profile photos
 * Provides centralized logic for default profile photo handling
 */

// Default profile photo path
export const DEFAULT_PROFILE_PHOTO = '/images/default-profile.jpg';

/**
 * Get profile photo URL with fallback to default
 * @param {string|null} profilePhoto - User's profile photo URL
 * @returns {string} Profile photo URL or default image
 */
export const getProfilePhotoUrl = (profilePhoto) => {
  // Return default image if profilePhoto is null, undefined, or empty string
  if (!profilePhoto || profilePhoto === null || profilePhoto === '' || profilePhoto === 'null') {
    return DEFAULT_PROFILE_PHOTO;
  }
  return profilePhoto;
};

/**
 * Check if a profile photo is the default image
 * @param {string} profilePhoto - Profile photo URL to check
 * @returns {boolean} True if it's the default image
 */
export const isDefaultProfilePhoto = (profilePhoto) => {
  return profilePhoto === DEFAULT_PROFILE_PHOTO;
};

/**
 * Get user initials for avatar fallback
 * @param {string} displayName - User's display name
 * @param {string} email - User's email (fallback)
 * @returns {string} User initials (1-2 characters)
 */
export const getUserInitials = (displayName, email = '') => {
  if (displayName && displayName.trim()) {
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }
  
  if (email && email.trim()) {
    return email.charAt(0).toUpperCase();
  }
  
  return 'U'; // Default fallback
};

/**
 * Determine if user needs a default profile photo
 * @param {Object} user - User object
 * @returns {boolean} True if user needs default profile photo
 */
export const needsDefaultProfilePhoto = (user) => {
  if (!user) return false;
  
  const { profilePhoto } = user;
  return !profilePhoto || profilePhoto === null || profilePhoto === '' || profilePhoto === 'null';
};

/**
 * Get profile photo with multiple fallback options
 * @param {Object} user - User object with profilePhoto, displayName, email
 * @param {Object} options - Options for fallback behavior
 * @param {boolean} options.useInitials - Whether to use initials as final fallback
 * @param {string} options.className - CSS classes for image element
 * @returns {Object} Object with { type, src, alt, initials }
 */
export const getProfilePhotoDisplay = (user, options = {}) => {
  const { useInitials = true, className = '' } = options;
  
  if (!user) {
    return {
      type: 'default',
      src: DEFAULT_PROFILE_PHOTO,
      alt: 'Default Profile',
      initials: 'U',
      className
    };
  }
  
  const { profilePhoto, displayName, email } = user;
  
  // If user has a custom profile photo
  if (profilePhoto && profilePhoto !== null && profilePhoto !== '' && profilePhoto !== 'null') {
    return {
      type: 'custom',
      src: profilePhoto,
      alt: displayName || email || 'User Profile',
      initials: getUserInitials(displayName, email),
      className
    };
  }
  
  // If using initials as fallback
  if (useInitials) {
    return {
      type: 'initials',
      src: null,
      alt: displayName || email || 'User Profile',
      initials: getUserInitials(displayName, email),
      className
    };
  }
  
  // Default image fallback
  return {
    type: 'default',
    src: DEFAULT_PROFILE_PHOTO,
    alt: displayName || email || 'Default Profile',
    initials: getUserInitials(displayName, email),
    className
  };
};

/**
 * Update user profile photo to default if null
 * @param {Object} userData - User data object
 * @returns {Object} Updated user data with default profile photo if needed
 */
export const ensureDefaultProfilePhoto = (userData) => {
  if (!userData) return userData;
  
  const updatedData = { ...userData };
  
  if (needsDefaultProfilePhoto(updatedData)) {
    updatedData.profilePhoto = DEFAULT_PROFILE_PHOTO;
  }
  
  return updatedData;
}; 