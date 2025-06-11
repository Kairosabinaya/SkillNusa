/**
 * Auth utilities for Firebase Authentication
 * Provides robust handling for continue URLs across different environments
 */

/**
 * Get the appropriate continue URL based on environment
 * @param {string} redirectPath - Path to redirect to after auth action
 * @returns {string} Full continue URL
 */
export const getContinueUrl = (redirectPath = '/login') => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${redirectPath}`;
};

/**
 * Get the base URL for the current environment
 * @returns {string} Base URL (protocol + domain)
 */
export const getBaseUrl = () => {
  // For Vercel deployments, use the deployment URL
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // For development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Fallback to current origin
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

/**
 * Get Firebase Auth action code settings
 * @param {string} redirectPath - Path to redirect after auth action
 * @returns {Object} Action code settings object
 */
export const getActionCodeSettings = (redirectPath = '/login') => {
  const baseUrl = getBaseUrl();
  const continueUrl = getContinueUrl(redirectPath);
  
  return {
    // Use auth-action handler URL
    url: `${baseUrl}/auth-action?continueUrl=${encodeURIComponent(continueUrl)}`,
    handleCodeInApp: false // Prevent unauthorized-continue-uri issues
  };
};

/**
 * Check if running in production environment
 * @returns {boolean} True if production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running on Vercel
 * @returns {boolean} True if on Vercel
 */
export const isVercel = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.endsWith('.vercel.app') || 
          window.location.hostname.endsWith('.vercel.com'));
};

/**
 * Get environment-specific auth domain
 * @returns {string} Auth domain for Firebase
 */
export const getAuthDomain = () => {
  return process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'skillnusa-6b3ad.firebaseapp.com';
};

/**
 * Validate Firebase configuration
 * @returns {boolean} True if all required config is present
 */
export const validateFirebaseConfig = () => {
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];
  
  return requiredVars.every(varName => {
    const value = process.env[varName];
    return value && value.trim() !== '';
  });
};

export default {
  getContinueUrl,
  getBaseUrl,
  getActionCodeSettings,
  isProduction,
  isVercel,
  getAuthDomain,
  validateFirebaseConfig
}; 