/**
 * Utility functions for handling profile photos
 * Provides centralized logic for default profile photo handling
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from './constants';

// Default profile photo path
export const DEFAULT_PROFILE_PHOTO = '/images/default-profile.jpg';

/**
 * Check if profile photo URL is valid (not null, empty, or 'null' string)
 * @param {string} profilePhoto - Profile photo URL
 * @returns {boolean} True if valid, false if needs default
 */
export const isValidProfilePhoto = (profilePhoto) => {
  return profilePhoto && 
         profilePhoto !== null && 
         profilePhoto !== '' && 
         profilePhoto !== 'null' && 
         profilePhoto !== 'undefined';
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
  return !isValidProfilePhoto(user.profilePhoto);
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
  
  // If user has a valid custom profile photo
  if (isValidProfilePhoto(profilePhoto)) {
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
 * Update user profile photo to default if null (for data processing)
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

/**
 * Update user's profile photo to default in database if currently null
 * @param {string} userId - User ID
 * @param {boolean} force - Whether to force update even if photo exists
 * @returns {Promise<boolean>} True if updated, false if no update needed
 */
export const ensureDefaultProfilePhotoInDatabase = async (userId, force = false) => {
  if (!userId) {
    console.warn('[ProfilePhotoUtils] No userId provided for database update');
    return false;
  }

  try {
    // Get current user data to check profile photo
    const { getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    
    if (!userDoc.exists()) {
      console.warn('[ProfilePhotoUtils] User document not found:', userId);
      return false;
    }

    const userData = userDoc.data();
    const currentPhoto = userData.profilePhoto;

    // Check if update is needed
    if (!force && isValidProfilePhoto(currentPhoto)) {
      console.log('[ProfilePhotoUtils] User already has valid profile photo, skipping update');
      return false;
    }

    // Update user document with default profile photo
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      profilePhoto: DEFAULT_PROFILE_PHOTO,
      updatedAt: serverTimestamp()
    });

    console.log(`✅ [ProfilePhotoUtils] Updated user ${userId} profile photo to default`);
    return true;

  } catch (error) {
    console.error('[ProfilePhotoUtils] Error updating profile photo in database:', error);
    return false;
  }
};

/**
 * Batch update multiple users to have default profile photos
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<number>} Number of users updated
 */
export const batchEnsureDefaultProfilePhotos = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return 0;
  }

  let updateCount = 0;
  
  try {
    // Process in batches to avoid overwhelming Firebase
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (userId) => {
        const updated = await ensureDefaultProfilePhotoInDatabase(userId);
        return updated ? 1 : 0;
      });
      
      const results = await Promise.all(promises);
      updateCount += results.reduce((sum, result) => sum + result, 0);
    }
    
    console.log(`✅ [ProfilePhotoUtils] Batch update completed: ${updateCount}/${userIds.length} users updated`);
    return updateCount;
    
  } catch (error) {
    console.error('[ProfilePhotoUtils] Error in batch update:', error);
    return updateCount;
  }
}; 