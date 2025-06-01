/**
 * User Profile Service
 * 
 * Standardized service for accessing and managing user profile data
 * Following new database structure with single source of truth
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  collection,
  getDocs,
  where
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
    
    // Get user basic data from users collection (SINGLE SOURCE)
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      Object.assign(profileData, userData);
    } else {
      return null; // User not found
    }
    
    // Get client profile data if exists
    const clientProfileDoc = await getDoc(doc(db, COLLECTIONS.CLIENT_PROFILES, userId));
    if (clientProfileDoc.exists()) {
      const clientData = clientProfileDoc.data();
      // Merge client-specific fields
      Object.assign(profileData, {
        gender: clientData.gender,
        dateOfBirth: clientData.dateOfBirth,
        location: clientData.location,
        bio: clientData.bio,
        companyName: clientData.companyName,
        industry: clientData.industry,
        marketingEmails: clientData.marketingEmails
      });
    }
    
    // Get freelancer profile data if user is a freelancer
    if (profileData.isFreelancer) {
      const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, userId));
      if (freelancerProfileDoc.exists()) {
        const freelancerData = freelancerProfileDoc.data();
        // Merge freelancer-specific fields
        Object.assign(profileData, {
          skills: freelancerData.skills,
          education: freelancerData.education,
          certifications: freelancerData.certifications,
          experienceLevel: freelancerData.experienceLevel,
          hourlyRate: freelancerData.hourlyRate,
          availability: freelancerData.availability,
          workingHours: freelancerData.workingHours,
          languages: freelancerData.languages,
          portfolioLinks: freelancerData.portfolioLinks,
          website: freelancerData.website,
          rating: freelancerData.rating,
          totalReviews: freelancerData.totalReviews,
          totalOrders: freelancerData.totalOrders,
          completedProjects: freelancerData.completedProjects,
          tier: freelancerData.tier,
          // Override bio if freelancer bio exists and client bio doesn't
          bio: freelancerData.bio || profileData.bio
        });
      }
    }
    
    return profileData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Update user profile data following new structure
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {boolean} updateAuthProfile - Whether to update auth profile displayName/photoURL
 * @returns {boolean} - Success status
 */
export const updateUserProfile = async (userId, profileData, updateAuthProfile = true) => {
  try {
    if (!userId) return false;
    
    // Fields that belong in users collection
    const userFields = [
      'displayName', 
      'email', 
      'username', 
      'phoneNumber',
      'profilePhoto',
      'roles',
      'activeRole', 
      'isFreelancer',
      'isActive',
      'isOnline'
    ];
    
    // Fields that belong in client profile
    const clientFields = [
      'gender', 
      'dateOfBirth',
      'location', 
      'bio',
      'companyName',
      'industry',
      'marketingEmails'
    ];
    
    // Fields that belong in freelancer profile
    const freelancerFields = [
      'skills',
      'education',
      'certifications',
      'experienceLevel',
      'hourlyRate',
      'availability',
      'workingHours',
      'languages',
      'portfolioLinks',
      'website',
      'bio' // Can be in both client and freelancer profiles
    ];
    
    // Separate data for different collections
    const userData = {};
    const clientData = {};
    const freelancerData = {};
    
    // Distribute fields to appropriate objects
    Object.keys(profileData).forEach(key => {
      if (userFields.includes(key)) {
        userData[key] = profileData[key];
      }
      if (clientFields.includes(key)) {
        clientData[key] = profileData[key];
      }
      if (freelancerFields.includes(key) && profileData.isFreelancer) {
        freelancerData[key] = profileData[key];
      }
    });
    
    // Add timestamps
    const timestamp = serverTimestamp();
    if (Object.keys(userData).length > 0) {
      userData.updatedAt = timestamp;
    }
    if (Object.keys(clientData).length > 0) {
      clientData.updatedAt = timestamp;
    }
    if (Object.keys(freelancerData).length > 0) {
      freelancerData.updatedAt = timestamp;
    }
    
    // Update users collection
    if (Object.keys(userData).length > 0) {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, userData);
    }
    
    // Update client profile collection
    if (Object.keys(clientData).length > 0) {
      const clientProfileRef = doc(db, COLLECTIONS.CLIENT_PROFILES, userId);
      await setDoc(clientProfileRef, {
        ...clientData,
        userId // Ensure userId reference is set
      }, { merge: true });
    }
    
    // Update freelancer profile collection if user is freelancer
    if (profileData.isFreelancer && Object.keys(freelancerData).length > 0) {
      const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
      await setDoc(freelancerProfileRef, {
        ...freelancerData,
        userId // Ensure userId reference is set
      }, { merge: true });
    }
    
    // Update auth profile if requested
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

/**
 * Create initial profile documents for new user
 * @param {string} userId - User ID
 * @param {Object} userData - Initial user data
 * @returns {boolean} - Success status
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const timestamp = serverTimestamp();
    
    // Create user document
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Create client profile document (all users start as clients)
    const clientProfileRef = doc(db, COLLECTIONS.CLIENT_PROFILES, userId);
    await setDoc(clientProfileRef, {
      userId,
      marketingEmails: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Create freelancer profile if user is freelancer
    if (userData.isFreelancer) {
      const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
      await setDoc(freelancerProfileRef, {
        userId,
        skills: [],
        education: [],
        certifications: [],
        portfolioLinks: [],
        rating: 0,
        totalReviews: 0,
        totalOrders: 0,
        completedProjects: 0,
        hourlyRate: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

/**
 * Get freelancer performance data (SINGLE SOURCE OF TRUTH)
 * @param {string} freelancerId - Freelancer ID
 * @returns {Object} - Freelancer performance data
 */
export const getFreelancerPerformance = async (freelancerId) => {
  try {
    const freelancerDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId));
    if (freelancerDoc.exists()) {
      const data = freelancerDoc.data();
      return {
        rating: data.rating || 0,
        totalReviews: data.totalReviews || 0,
        totalOrders: data.totalOrders || 0,
        completedProjects: data.completedProjects || 0,
        tier: data.tier || 'bronze'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching freelancer performance:', error);
    return null;
  }
};

/**
 * Update freelancer performance metrics (called when orders/reviews change)
 * @param {string} freelancerId - Freelancer ID
 * @param {Object} metrics - Performance metrics to update
 * @returns {boolean} - Success status
 */
export const updateFreelancerPerformance = async (freelancerId, metrics) => {
  try {
    const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId);
    await updateDoc(freelancerProfileRef, {
      ...metrics,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating freelancer performance:', error);
    return false;
  }
};

/**
 * Calculate and update freelancer rating from reviews
 * @param {string} freelancerId - Freelancer user ID
 * @returns {Promise<Object>} Updated rating data
 */
export const recalculateFreelancerRating = async (freelancerId) => {
  try {
    console.log(`🔢 Recalculating rating for freelancer: ${freelancerId}`);
    
    // Get all published reviews for this freelancer
    const reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('freelancerId', '==', freelancerId),
      where('status', '==', 'published')
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    // Calculate average rating
    let totalRating = 0;
    let reviewCount = 0;
    
    reviewsSnapshot.forEach(reviewDoc => {
      const review = reviewDoc.data();
      totalRating += review.rating || 0;
      reviewCount++;
    });
    
    const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
    
    // Get completed orders count
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('freelancerId', '==', freelancerId),
      where('status', '==', 'completed')
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const completedOrdersCount = ordersSnapshot.size;
    
    // Update freelancer profile
    const freelancerRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId);
    const updateData = {
      rating: averageRating,
      totalReviews: reviewCount,
      totalOrders: completedOrdersCount,
      completedProjects: completedOrdersCount,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(freelancerRef, updateData);
    
    console.log(`✅ Updated freelancer rating: ${averageRating} (${reviewCount} reviews, ${completedOrdersCount} orders)`);
    
    return {
      rating: averageRating,
      totalReviews: reviewCount,
      totalOrders: completedOrdersCount,
      completedProjects: completedOrdersCount
    };
    
  } catch (error) {
    console.error('❌ Error recalculating freelancer rating:', error);
    throw error;
  }
};

/**
 * Recalculate ratings for all freelancers
 * @returns {Promise<void>}
 */
export const recalculateAllFreelancerRatings = async () => {
  try {
    console.log('🔢 Recalculating all freelancer ratings...');
    
    const freelancersSnapshot = await getDocs(collection(db, COLLECTIONS.FREELANCER_PROFILES));
    
    for (const freelancerDoc of freelancersSnapshot.docs) {
      await recalculateFreelancerRating(freelancerDoc.id);
    }
    
    console.log('✅ All freelancer ratings updated successfully!');
    
  } catch (error) {
    console.error('❌ Error recalculating all freelancer ratings:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  getFreelancerPerformance,
  updateFreelancerPerformance,
  recalculateFreelancerRating,
  recalculateAllFreelancerRatings
};
