import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { logger } from '../utils/logger';

/**
 * Check if email already exists in the database
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email exists, false otherwise
 */
export const checkEmailExists = async (email) => {
  try {
    logger.info('checkEmailExists', 'Checking email availability', { email });
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    const exists = !querySnapshot.empty;
    
    logger.info('checkEmailExists', `Email ${exists ? 'exists' : 'available'}`, { email, exists });
    return exists;
  } catch (error) {
    logger.error('checkEmailExists', 'Error checking email', { email, error: error.message });
    throw error;
  }
};

/**
 * Check if username already exists in the database
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} - True if username exists, false otherwise
 */
export const checkUsernameExists = async (username) => {
  try {
    logger.info('checkUsernameExists', 'Checking username availability', { username });
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    const exists = !querySnapshot.empty;
    
    logger.info('checkUsernameExists', `Username ${exists ? 'exists' : 'available'}`, { username, exists });
    return exists;
  } catch (error) {
    logger.error('checkUsernameExists', 'Error checking username', { username, error: error.message });
    throw error;
  }
};

/**
 * Validate username format (lowercase letters and numbers only)
 * @param {string} username - Username to validate
 * @returns {boolean} - True if format is valid, false otherwise
 */
export const isValidUsernameFormat = (username) => {
  // Username should be 3-20 characters, lowercase letters and numbers only
  const usernameRegex = /^[a-z0-9]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if format is valid, false otherwise
 */
export const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indonesian phone number format
 * @param {string} phoneNumber - Phone number to validate (should include +62)
 * @returns {boolean} - True if format is valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber) => {
  // Indonesian phone number: +62 followed by 8-11 digits
  const phoneRegex = /^\+62[0-9]{8,11}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors array
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate full name format
 * @param {string} fullName - Full name to validate
 * @returns {boolean} - True if format is valid, false otherwise
 */
export const isValidFullName = (fullName) => {
  // Full name should be at least 2 characters and contain only letters, spaces, apostrophes, and hyphens
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(fullName.trim());
};

/**
 * Validate date of birth (should be at least 13 years old)
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {object} - Validation result with isValid and error message
 */
export const validateDateOfBirth = (dateOfBirth) => {
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      actualAge--;
    }
    
    if (actualAge < 13) {
      return {
        isValid: false,
        error: 'Usia minimal 13 tahun'
      };
    }
    
    if (birthDate > today) {
      return {
        isValid: false,
        error: 'Tanggal lahir tidak boleh lebih dari hari ini'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Format tanggal tidak valid'
    };
  }
};

/**
 * Real-time validation for registration form fields
 * @param {string} field - Field name to validate
 * @param {string} value - Field value
 * @param {object} allValues - All form values for cross-field validation
 * @returns {Promise<string|null>} - Error message or null if valid
 */
export const validateField = async (field, value, allValues = {}) => {
  try {
    switch (field) {
      case 'email':
        if (!value) return 'Email wajib diisi';
        if (!isValidEmailFormat(value)) return 'Format email tidak valid';
        if (await checkEmailExists(value)) return 'Email ini sudah terdaftar';
        return null;
        
      case 'username':
        if (!value) return 'Username wajib diisi';
        if (!isValidUsernameFormat(value)) return 'Username hanya boleh berisi huruf kecil dan angka (3-20 karakter)';
        if (await checkUsernameExists(value)) return 'Username ini sudah digunakan';
        return null;
        
      case 'password':
        if (!value) return 'Password wajib diisi';
        const passwordValidation = validatePasswordStrength(value);
        if (!passwordValidation.isValid) return passwordValidation.errors[0];
        return null;
        
      case 'confirmPassword':
        if (!value) return 'Konfirmasi password wajib diisi';
        if (value !== allValues.password) return 'Password harus sama';
        return null;
        
      case 'fullName':
        if (!value) return 'Nama lengkap wajib diisi';
        if (!isValidFullName(value)) return 'Nama lengkap tidak valid';
        return null;
        
      case 'phoneNumber':
        if (!value) return 'Nomor telepon wajib diisi';
        if (!isValidPhoneNumber(value)) return 'Format nomor telepon tidak valid';
        return null;
        
      case 'dateOfBirth':
        if (!value) return 'Tanggal lahir wajib diisi';
        const dobValidation = validateDateOfBirth(value);
        if (!dobValidation.isValid) return dobValidation.error;
        return null;
        
      default:
        return null;
    }
  } catch (error) {
    logger.error('validateField', 'Error validating field', { field, error: error.message });
    return 'Terjadi kesalahan saat validasi';
  }
};
