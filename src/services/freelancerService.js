import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, FREELANCER_STATUS } from '../utils/constants';

/**
 * Apply as freelancer - handles creating freelancer profile and updating user document
 * @param {string} userId - User ID
 * @param {object} freelancerData - Freelancer profile data
 * @returns {Promise} - Promise that resolves when profile is created
 */
export const applyAsFreelancer = async (userId, freelancerData) => {
  // Create freelancer profile document
  const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
  
  // Add timestamps and status
  const profileData = {
    ...freelancerData,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Update user document to include freelancer role
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  
  try {
    // Create freelancer profile
    await setDoc(freelancerProfileRef, profileData);
    
    // Update user document with multi-role information
    await updateDoc(userRef, {
      roles: ['client', 'freelancer'],
      isFreelancer: true,
      freelancerStatus: FREELANCER_STATUS.PENDING,
      freelancerAppliedAt: new Date(),
    });
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Get freelancer profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Promise that resolves to freelancer profile
 */
export const getFreelancerProfile = async (userId) => {
  try {
    const docRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update freelancer profile
 * @param {string} userId - User ID
 * @param {object} profileData - Updated profile data
 * @returns {Promise} - Promise that resolves when profile is updated
 */
export const updateFreelancerProfile = async (userId, profileData) => {
  try {
    const docRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
    
    const updatedData = {
      ...profileData,
      updatedAt: new Date()
    };
    
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    throw error;
  }
};
