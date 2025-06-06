/**
 * User Profile Service
 * 
 * Standardized service for accessing and managing user profile data across different collections
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import { 
  DEFAULT_PROFILE_PHOTO, 
  ensureDefaultProfilePhoto, 
  isValidProfilePhoto,
  ensureDefaultProfilePhotoInDatabase
} from '../utils/profilePhotoUtils';

/**
 * Get complete user profile data from all collections
 * @param {string} userId - User ID
 * @returns {Object} - Combined user profile data
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) return null;
    
    const profileData = {};
    
    // Get user basic data from users collection
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Ensure user has default profile photo if none exists
      const userDataWithDefaults = ensureDefaultProfilePhoto(userData);
      Object.assign(profileData, userDataWithDefaults);
      
      // Auto-fix null profile photo in database if needed
      if (!isValidProfilePhoto(userData.profilePhoto)) {
        console.log(`🔧 [UserProfileService] Auto-fixing null profile photo for user: ${userId}`);
        // Don't await this to avoid blocking the main operation
        ensureDefaultProfilePhotoInDatabase(userId).catch(error => {
          console.error('Error auto-fixing profile photo:', error);
        });
      }
    }
    
    // Check clientProfiles collection (string format)
    let clientProfileDoc = await getDoc(doc(db, 'clientProfiles', userId));
    
    // If not found, check client_profiles collection (underscore format)
    if (!clientProfileDoc.exists()) {
      clientProfileDoc = await getDoc(doc(db, COLLECTIONS.CLIENT_PROFILES, userId));
    }
    
    // Assign profile data if it exists in either collection
    if (clientProfileDoc.exists()) {
      Object.assign(profileData, clientProfileDoc.data());
    }
    
    // Check freelancer_profiles collection if user is freelancer
    if (profileData.isFreelancer) {
      const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, userId));
      if (freelancerProfileDoc.exists()) {
        Object.assign(profileData, freelancerProfileDoc.data());
      }
    }
    
    return Object.keys(profileData).length > 0 ? profileData : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile data
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {boolean} updateAuthProfile - Whether to update auth profile displayName/photoURL
 * @returns {boolean} - Success status
 */
export const updateUserProfile = async (userId, profileData, updateAuthProfile = true) => {
  try {
    if (!userId) return false;
    
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const clientProfileRef = doc(db, COLLECTIONS.CLIENT_PROFILES, userId);
    
    // Fields that belong in users collection - only the 15 required fields
    const userFields = [
      'uid',
      'email', 
      'username', 
      'displayName',
      'phoneNumber',
      'gender',
      'dateOfBirth',
      'location',
      'roles',
      'isFreelancer',
      'hasInteractedWithSkillBot',
      'profilePhoto',
      'emailVerified'
    ];
    
    // Fields that belong in client profile - only the 4 required fields
    const clientProfileFields = [
      'bio'
    ];
    
    // Separate data for different collections
    const userData = {};
    const clientData = {};
    
    // Distribute fields to appropriate objects
    Object.keys(profileData).forEach(key => {
      if (userFields.includes(key)) {
        userData[key] = profileData[key];
      }
      if (clientProfileFields.includes(key)) {
        clientData[key] = profileData[key];
      }
    });
    
    // Ensure profile photo is never null when updating
    if ('profilePhoto' in userData) {
      const profilePhotoToSave = isValidProfilePhoto(userData.profilePhoto) 
        ? userData.profilePhoto 
        : DEFAULT_PROFILE_PHOTO;
        
      userData.profilePhoto = profilePhotoToSave;
      
      console.log(`🖼️ [UserProfileService] Updating profile photo for ${userId}:`, {
        provided: profileData.profilePhoto,
        saving: profilePhotoToSave,
        isDefault: profilePhotoToSave === DEFAULT_PROFILE_PHOTO
      });
    }
    
    // Add timestamps
    if (Object.keys(userData).length > 0) {
      userData.updatedAt = serverTimestamp();
    }
    if (Object.keys(clientData).length > 0) {
      clientData.updatedAt = serverTimestamp();
    }
    
    // Update in users collection if we have user data
    if (Object.keys(userData).length > 0) {
      await updateDoc(userRef, userData);
    }
    
    // Update in client_profiles collection if we have client data
    if (Object.keys(clientData).length > 0) {
      // Use setDoc with merge to create if not exists
      await setDoc(clientProfileRef, {
        ...clientData,
        userID: userId // Ensure userID is set
      }, { merge: true });
    }
    
    // Also handle freelancer profile data if relevant
    if (profileData.isFreelancer) {
      // Check if we have any freelancer-specific fields
      const freelancerFields = ['skills', 'experienceLevel', 'portfolioLinks', 'hourlyRate', 'availability'];
      const hasFreelancerData = Object.keys(profileData).some(key => freelancerFields.includes(key));
      
      if (hasFreelancerData) {
        const freelancerData = {};
        freelancerFields.forEach(field => {
          if (profileData[field]) freelancerData[field] = profileData[field];
        });
        
        if (Object.keys(freelancerData).length > 0) {
          // Update in freelancer profiles collection
          const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
          await setDoc(freelancerProfileRef, {
            ...freelancerData,
            userId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    }
    
    // Update auth profile if requested and if we have displayName or profilePhoto
    if (updateAuthProfile && auth.currentUser && 
        (profileData.displayName || profileData.profilePhoto)) {
      const updateData = {};
      if (profileData.displayName) updateData.displayName = profileData.displayName;
      if (profileData.profilePhoto && isValidProfilePhoto(profileData.profilePhoto)) {
        updateData.photoURL = profileData.profilePhoto;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateProfile(auth.currentUser, updateData);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Batch fix users with null profile photos
 * @param {number} batchSize - Number of users to process at once
 * @returns {Promise<number>} Number of users fixed
 */
export const batchFixNullProfilePhotos = async (batchSize = 50) => {
  try {
    console.log('🔧 [UserProfileService] Starting batch fix for null profile photos...');
    
    // Query users with null or invalid profile photos
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      limit(batchSize)
    );
    
    const snapshot = await getDocs(usersQuery);
    const usersToFix = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      if (!isValidProfilePhoto(userData.profilePhoto)) {
        usersToFix.push(doc.id);
      }
    });
    
    if (usersToFix.length === 0) {
      console.log('✅ [UserProfileService] No users found with null profile photos');
      return 0;
    }
    
    console.log(`🔧 [UserProfileService] Found ${usersToFix.length} users with null profile photos, fixing...`);
    
    // Fix them in parallel
    const results = await Promise.allSettled(
      usersToFix.map(userId => ensureDefaultProfilePhotoInDatabase(userId, true))
    );
    
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
    
    console.log(`✅ [UserProfileService] Batch fix completed: ${successCount}/${usersToFix.length} users fixed`);
    return successCount;
    
  } catch (error) {
    console.error('❌ [UserProfileService] Error in batch fix:', error);
    return 0;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  batchFixNullProfilePhotos
};
