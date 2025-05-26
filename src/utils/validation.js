/**
 * Comprehensive Validation System for SkillNusa
 * Provides reusable validation functions and schemas
 */

import { ValidationError } from './errors';

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'EMAIL_REQUIRED', 'email');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new ValidationError('Format email tidak valid', 'INVALID_EMAIL', 'email');
  }
  
  return true;
};

/**
 * Password validation
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'PASSWORD_REQUIRED', 'password');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password minimal 8 karakter', 'PASSWORD_TOO_SHORT', 'password');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError(
      'Password harus mengandung huruf besar, huruf kecil, dan angka',
      'PASSWORD_TOO_WEAK',
      'password'
    );
  }
  
  return true;
};

/**
 * Username validation
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    throw new ValidationError('Username is required', 'USERNAME_REQUIRED', 'username');
  }
  
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    throw new ValidationError('Username minimal 3 karakter', 'USERNAME_TOO_SHORT', 'username');
  }
  
  if (trimmed.length > 30) {
    throw new ValidationError('Username maksimal 30 karakter', 'USERNAME_TOO_LONG', 'username');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new ValidationError(
      'Username hanya boleh mengandung huruf, angka, dan underscore',
      'INVALID_USERNAME',
      'username'
    );
  }
  
  return true;
};

/**
 * Phone number validation
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Nomor telepon is required', 'PHONE_REQUIRED', 'phone');
  }
  
  // Indonesian phone number format
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  if (!phoneRegex.test(phone.replace(/\s|-/g, ''))) {
    throw new ValidationError('Format nomor telepon tidak valid', 'INVALID_PHONE', 'phone');
  }
  
  return true;
};

/**
 * Required field validation
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(
      `${fieldName} is required`,
      'FIELD_REQUIRED',
      fieldName.toLowerCase()
    );
  }
  
  if (typeof value === 'string' && !value.trim()) {
    throw new ValidationError(
      `${fieldName} cannot be empty`,
      'FIELD_EMPTY',
      fieldName.toLowerCase()
    );
  }
  
  return true;
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required', 'URL_REQUIRED', 'url');
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    throw new ValidationError('Format URL tidak valid', 'INVALID_URL', 'url');
  }
};

/**
 * File validation
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {boolean} - True if valid
 * @throws {ValidationError} - If invalid
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    required = false
  } = options;
  
  if (!file) {
    if (required) {
      throw new ValidationError('File is required', 'FILE_REQUIRED', 'file');
    }
    return true;
  }
  
  if (file.size > maxSize) {
    throw new ValidationError(
      `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      'FILE_TOO_LARGE',
      'file'
    );
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `File type must be one of: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      'file'
    );
  }
  
  return true;
};

/**
 * Validation schemas for common forms
 */
export const validationSchemas = {
  // User registration schema
  userRegistration: {
    email: validateEmail,
    password: validatePassword,
    username: validateUsername,
    confirmPassword: (value, data) => {
      validateRequired(value, 'Confirm Password');
      if (value !== data.password) {
        throw new ValidationError('Password tidak cocok', 'PASSWORD_MISMATCH', 'confirmPassword');
      }
      return true;
    }
  },
  
  // User login schema
  userLogin: {
    emailOrUsername: (value) => {
      validateRequired(value, 'Email or Username');
      // Allow either email or username format
      if (value.includes('@')) {
        return validateEmail(value);
      } else {
        return validateUsername(value);
      }
    },
    password: (value) => {
      validateRequired(value, 'Password');
      return true; // Don't validate strength on login
    }
  },
  
  // Profile update schema
  profileUpdate: {
    displayName: (value) => {
      if (value) {
        validateRequired(value, 'Display Name');
        if (value.trim().length < 2) {
          throw new ValidationError('Display name minimal 2 karakter', 'NAME_TOO_SHORT', 'displayName');
        }
      }
      return true;
    },
    bio: (value) => {
      if (value && value.length > 500) {
        throw new ValidationError('Bio maksimal 500 karakter', 'BIO_TOO_LONG', 'bio');
      }
      return true;
    },
    phone: (value) => {
      if (value) {
        return validatePhone(value);
      }
      return true;
    }
  },
  
  // Project creation schema
  projectCreation: {
    title: (value) => {
      validateRequired(value, 'Project Title');
      if (value.trim().length < 5) {
        throw new ValidationError('Judul project minimal 5 karakter', 'TITLE_TOO_SHORT', 'title');
      }
      return true;
    },
    description: (value) => {
      validateRequired(value, 'Project Description');
      if (value.trim().length < 20) {
        throw new ValidationError('Deskripsi project minimal 20 karakter', 'DESCRIPTION_TOO_SHORT', 'description');
      }
      return true;
    },
    budget: (value) => {
      validateRequired(value, 'Budget');
      const budget = parseFloat(value);
      if (isNaN(budget) || budget <= 0) {
        throw new ValidationError('Budget harus berupa angka positif', 'INVALID_BUDGET', 'budget');
      }
      return true;
    }
  }
};

/**
 * Validate object against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation result
 */
export const validateSchema = (data, schema) => {
  const errors = {};
  let isValid = true;
  
  for (const [field, validator] of Object.entries(schema)) {
    try {
      validator(data[field], data);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = {
          message: error.message,
          code: error.code
        };
        isValid = false;
      } else {
        throw error;
      }
    }
  }
  
  return {
    isValid,
    errors
  };
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateRequired,
  validateUrl,
  validateFile,
  validationSchemas,
  validateSchema,
  sanitizeInput
}; 