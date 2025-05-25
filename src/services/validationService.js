import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';

/**
 * Check if an email already exists in the system
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email exists
 */
export const checkEmailExists = async (email) => {
  if (!email) return false;
  
  try {
    // Use where clause to find users with this email
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
};

/**
 * Check if a username already exists in the system
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} - True if username exists
 */
export const checkUsernameExists = async (username) => {
  if (!username) return false;
  
  try {
    // Use where clause to find users with this username
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('username', '==', username.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username existence:', error);
    return false;
  }
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if username format is valid
 */
export const isValidUsernameFormat = (username) => {
  if (!username) return false;
  
  // Only allow lowercase letters and numbers, no special characters
  const usernameRegex = /^[a-z0-9]+$/;
  return usernameRegex.test(username);
};
