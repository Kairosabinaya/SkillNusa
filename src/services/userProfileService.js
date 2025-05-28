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
  serverTimestamp
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';

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
      Object.assign(profileData, userData);
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
    
    // Get freelancer profile data if user is a freelancer
    if (profileData.isFreelancer) {
      // Check both potential collection names for freelancer profiles
      let freelancerProfileDoc = await getDoc(doc(db, 'freelancerProfiles', userId));
      
      if (!freelancerProfileDoc.exists()) {
        freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, userId));
      }
      
      if (freelancerProfileDoc.exists()) {
        // Merge specific fields we want from freelancer profile
        const freelancerData = freelancerProfileDoc.data();
        profileData.skills = freelancerData.skills;
        profileData.experienceLevel = freelancerData.experienceLevel;
        profileData.portfolioLinks = freelancerData.portfolioLinks;
        profileData.hourlyRate = freelancerData.hourlyRate;
        profileData.availability = freelancerData.availability;
        // Only override bio if not already set and if freelancer bio exists
        if (!profileData.bio && freelancerData.bio) {
          profileData.bio = freelancerData.bio;
        }
      }
    }
    
    return profileData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
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
    
    // Fields that belong in users collection
    const userFields = [
      'displayName', 
      'email', 
      'username', 
      'roles',
      'activeRole', 
      'isFreelancer', 
    ];
    
    // Fields that belong in client profile
    const profileFields = [
      'displayName', 
      'fullName',
      'phoneNumber', 
      'gender', 
      'dateOfBirth',
      'location', 
      'bio', 
      'profilePhoto'
    ];
    
    // Separate data for different collections
    const userData = {};
    const clientData = {};
    
    // Distribute fields to appropriate objects
    Object.keys(profileData).forEach(key => {
      if (userFields.includes(key)) {
        userData[key] = profileData[key];
      }
      if (profileFields.includes(key)) {
        clientData[key] = profileData[key];
      }
    });
    
    // Add timestamps
    userData.updatedAt = serverTimestamp();
    clientData.updatedAt = serverTimestamp();
    
    // Update in users collection if we have user data
    if (Object.keys(userData).length > 0) {
      await updateDoc(userRef, userData);
    }
    
    // Update in client_profiles collection if we have client data
    if (Object.keys(clientData).length > 0) {
      // Use setDoc with merge to create if not exists
      await setDoc(clientProfileRef, {
        ...clientData,
        userId // Ensure userId is set
      }, { merge: true });
      
      // Also update data in clientProfiles if it exists (to keep both collections in sync)
      const oldFormatRef = doc(db, 'clientProfiles', userId);
      const oldFormatDoc = await getDoc(oldFormatRef);
      if (oldFormatDoc.exists()) {
        await setDoc(oldFormatRef, {
          ...clientData,
          userId,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
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
          // Update in both possible collections
          const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
          await setDoc(freelancerProfileRef, {
            ...freelancerData,
            userId,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          // Also update in old format collection if it exists
          const oldFormatFreelancerRef = doc(db, 'freelancerProfiles', userId);
          const oldFormatDoc = await getDoc(oldFormatFreelancerRef);
          if (oldFormatDoc.exists()) {
            await setDoc(oldFormatFreelancerRef, {
              ...freelancerData,
              userId,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      }
    }
    
    // Update auth profile if requested and if we have displayName or profilePhoto
    if (updateAuthProfile && auth.currentUser && 
        (profileData.displayName || profileData.profilePhoto)) {
      const updateData = {};
      if (profileData.displayName) updateData.displayName = profileData.displayName;
      if (profileData.profilePhoto) updateData.photoURL = profileData.profilePhoto;
      
      await updateProfile(auth.currentUser, updateData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export default {
  getUserProfile,
  updateUserProfile
};
