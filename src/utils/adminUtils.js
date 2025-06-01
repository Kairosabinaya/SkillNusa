import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Utility to make a user an admin (for testing purposes)
 * This should only be used in development/testing
 */
export const makeUserAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentRoles = userData.roles || [];
    
    if (!currentRoles.includes('admin')) {
      await updateDoc(userRef, {
        roles: [...currentRoles, 'admin'],
        updatedAt: new Date()
      });
      console.log('User successfully made admin');
      return true;
    } else {
      console.log('User is already an admin');
      return false;
    }
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
};

/**
 * Utility to remove admin access from a user
 */
export const removeAdminAccess = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentRoles = userData.roles || [];
    
    if (currentRoles.includes('admin')) {
      const newRoles = currentRoles.filter(role => role !== 'admin');
      await updateDoc(userRef, {
        roles: newRoles,
        updatedAt: new Date()
      });
      console.log('Admin access removed from user');
      return true;
    } else {
      console.log('User is not an admin');
      return false;
    }
  } catch (error) {
    console.error('Error removing admin access:', error);
    throw error;
  }
};

/**
 * Check if a user is an admin
 */
export const checkAdminStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    const roles = userData.roles || [];
    return roles.includes('admin');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Export utility functions to global window for console access in development
if (process.env.NODE_ENV === 'development') {
  window.adminUtils = {
    makeUserAdmin,
    removeAdminAccess,
    checkAdminStatus
  };
} 