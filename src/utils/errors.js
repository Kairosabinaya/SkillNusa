/**
 * Unified Error Handling System for SkillNusa
 * Provides custom error classes and error handling utilities
 */

import Logger from './logger';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  constructor(message, code = 'AUTH_ERROR') {
    super(message, code, 401);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  constructor(message, code = 'AUTHORIZATION_ERROR') {
    super(message, code, 403);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR', field = null) {
    super(message, code, 400);
    this.field = field;
  }
}

/**
 * Service related errors
 */
export class ServiceError extends AppError {
  constructor(message, code = 'SERVICE_ERROR') {
    super(message, code, 500);
  }
}

/**
 * Network/API related errors
 */
export class NetworkError extends AppError {
  constructor(message, code = 'NETWORK_ERROR') {
    super(message, code, 503);
  }
}

/**
 * File upload related errors
 */
export class UploadError extends AppError {
  constructor(message, code = 'UPLOAD_ERROR') {
    super(message, code, 400);
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle service errors with proper logging and user-friendly messages
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that failed
   * @param {object} context - Additional context
   * @returns {object} - Handled error object
   */
  static handleServiceError(error, operation, context = {}) {
    Logger.operationFailed(operation, error);
    
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          field: error.field || null
        }
      };
    }
    
    // Handle Firebase errors
    if (error.code) {
      const friendlyMessage = this.getFriendlyFirebaseMessage(error.code);
      return {
        success: false,
        error: {
          message: friendlyMessage,
          code: error.code
        }
      };
    }
    
    // Generic error
    return {
      success: false,
      error: {
        message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
        code: 'UNKNOWN_ERROR'
      }
    };
  }

  /**
   * Get user-friendly messages for Firebase error codes
   * @param {string} errorCode - Firebase error code
   * @returns {string} - User-friendly message
   */
  static getFriendlyFirebaseMessage(errorCode) {
    const messages = {
      'auth/user-not-found': 'Email atau username tidak ditemukan',
      'auth/wrong-password': 'Password yang Anda masukkan salah',
      'auth/invalid-credential': 'Kredensial login tidak valid',
      'auth/email-already-in-use': 'Email sudah terdaftar',
      'auth/weak-password': 'Password terlalu lemah',
      'auth/invalid-email': 'Format email tidak valid',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti',
      'permission-denied': 'Anda tidak memiliki izin untuk melakukan tindakan ini',
      'unavailable': 'Layanan sedang tidak tersedia. Silakan coba lagi',
      'deadline-exceeded': 'Permintaan timeout. Silakan coba lagi',
      'not-found': 'Data yang dicari tidak ditemukan',
      'already-exists': 'Data sudah ada',
      'failed-precondition': 'Kondisi prasyarat tidak terpenuhi'
    };
    
    return messages[errorCode] || 'Terjadi kesalahan yang tidak terduga';
  }

  /**
   * Async operation wrapper with error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @param {object} context - Additional context
   * @returns {Promise<object>} - Result or error object
   */
  static async handleAsync(operation, operationName, context = {}) {
    try {
      Logger.operationStart(operationName, context);
      const result = await operation();
      Logger.operationSuccess(operationName, { result });
      return { success: true, data: result };
    } catch (error) {
      return this.handleServiceError(error, operationName, context);
    }
  }

  /**
   * Validate required fields
   * @param {object} data - Data to validate
   * @param {array} requiredFields - Array of required field names
   * @throws {ValidationError} - If validation fails
   */
  static validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        throw new ValidationError(`Field ${field} is required`, 'FIELD_REQUIRED', field);
      }
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @throws {ValidationError} - If email is invalid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Format email tidak valid', 'INVALID_EMAIL', 'email');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {ValidationError} - If password is weak
   */
  static validatePassword(password) {
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
  }
}

export default ErrorHandler; 