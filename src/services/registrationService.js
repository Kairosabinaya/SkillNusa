/**
 * Registration Service - Centralized user registration with data consistency
 * This service ensures all user registrations follow the same standardized process
 */

import { 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';
import firebaseService from './firebaseService';
import { COLLECTIONS, USER_ROLES } from '../utils/constants';
import { 
  validateUserData, 
  createClientProfileData, 
  createFreelancerProfileData 
} from '../schemas/userSchema';
import Logger from '../utils/logger';

class RegistrationService {
  /**
   * Register a new user with standardized data structure
   * @param {Object} registrationData - Registration form data
   * @returns {Promise<Object>} Created user object
   */
  async registerUser(registrationData) {
    try {
      Logger.operationStart('registerUser', { email: registrationData.email });

      // Step 1: Create Firebase Auth user
      const authResult = await createUserWithEmailAndPassword(
        auth, 
        registrationData.email, 
        registrationData.password
      );
      const { user } = authResult;

      try {
        // Step 2: Validate and sanitize user data according to schema
        const sanitizedUserData = validateUserData(registrationData, user.uid);
        sanitizedUserData.emailVerified = user.emailVerified;

        // Step 3: Create user document with standardized structure
        await firebaseService.setDocument(COLLECTIONS.USERS, user.uid, {
          ...sanitizedUserData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Step 4: Create profile documents based on roles
        await this.createUserProfiles(user.uid, sanitizedUserData, registrationData);

        // Step 5: Update Firebase Auth profile
        await updateProfile(user, { 
          displayName: sanitizedUserData.displayName 
        });

        // Step 6: Send email verification
        await sendEmailVerification(user);

        Logger.operationSuccess('registerUser', { userId: user.uid });
        return user;

      } catch (error) {
        // If user document creation fails, clean up Auth user
        try {
          await user.delete();
        } catch (cleanupError) {
          Logger.error('Failed to cleanup auth user after registration failure', cleanupError);
        }
        throw error;
      }

    } catch (error) {
      Logger.operationFailed('registerUser', error);
      throw this.handleRegistrationError(error);
    }
  }

  /**
   * Create user profile documents based on roles
   * @param {string} userId - User ID
   * @param {Object} userData - Validated user data
   * @param {Object} originalData - Original registration data
   */
  async createUserProfiles(userId, userData, originalData) {
    try {
      // Always create client profile (all users are clients by default)
      const clientProfileData = createClientProfileData(userId, originalData);
      await firebaseService.setDocument(COLLECTIONS.CLIENT_PROFILES, userId, {
        ...clientProfileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create freelancer profile if user has freelancer role
      if (userData.isFreelancer || userData.roles.includes(USER_ROLES.FREELANCER)) {
        const freelancerProfileData = createFreelancerProfileData(userId, originalData);
        await firebaseService.setDocument(COLLECTIONS.FREELANCER_PROFILES, userId, {
          ...freelancerProfileData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

    } catch (error) {
      Logger.error('Failed to create user profiles', error);
      throw error;
    }
  }

  /**
   * Handle registration errors with user-friendly messages
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleRegistrationError(error) {
    let message = 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
          break;
        case 'auth/weak-password':
          message = 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.';
          break;
        case 'auth/invalid-email':
          message = 'Format email tidak valid. Periksa kembali email Anda.';
          break;
        case 'auth/network-request-failed':
          message = 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
          break;
        default:
          message = `Terjadi kesalahan: ${error.code}. Silakan coba lagi.`;
      }
    }

    const formattedError = new Error(message);
    formattedError.code = error.code;
    formattedError.originalError = error;
    return formattedError;
  }

  /**
   * Register user from legacy registration flow (AuthService compatibility)
   * @param {string} email
   * @param {string} password
   * @param {string} username
   * @param {string} role
   * @param {string} bio
   * @param {string} headline
   * @param {Array} skills
   * @param {string} fullName
   * @param {string} phoneNumber
   * @param {string} gender
   * @param {string} birthDate
   */
  async legacyRegister(email, password, username, role, bio = '', headline = '', skills = [], fullName = '', phoneNumber = '', gender = '', birthDate = '') {
    const registrationData = {
      email,
      password,
      username,
      displayName: fullName || username,
      fullName: fullName || username,
      roles: [role],
      activeRole: role,
      isFreelancer: role === USER_ROLES.FREELANCER,
      bio,
      skills,
      phoneNumber,
      gender,
      dateOfBirth: birthDate
    };

    return this.registerUser(registrationData);
  }

  /**
   * Register user from new registration flow (Register.js compatibility)
   * @param {Object} formData - Form data from multi-step registration
   */
  async modernRegister(formData) {
    const registrationData = {
      email: formData.email,
      password: formData.password,
      username: formData.username,
      displayName: formData.fullName,
      fullName: formData.fullName,
      roles: formData.roles || [USER_ROLES.CLIENT],
      activeRole: formData.activeRole || USER_ROLES.CLIENT,
      isFreelancer: formData.roles && formData.roles.includes(USER_ROLES.FREELANCER),
      profilePhoto: formData.profilePhotoURL,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      location: formData.location,
      bio: formData.bio,
      marketingEmails: formData.agreeToMarketing,
      
      // Freelancer specific
      skills: formData.skills,
      experienceLevel: formData.experienceLevel,
      portfolioLinks: formData.portfolioLinks,
      hourlyRate: formData.hourlyRate,
      availability: formData.availability,
      
      // Client specific
      companyName: formData.companyName,
      industry: formData.industry,
      companySize: formData.companySize,
      budgetRange: formData.budgetRange,
      primaryNeeds: formData.primaryNeeds
    };

    return this.registerUser(registrationData);
  }

  /**
   * Migrate existing user to standardized structure
   * @param {string} userId - User ID to migrate
   * @param {Object} currentData - Current user data
   */
  async migrateUser(userId, currentData) {
    try {
      Logger.operationStart('migrateUser', { userId });

      // Validate and sanitize existing data
      const sanitizedData = validateUserData(currentData, userId);
      
      // Update user document with standardized structure
      await firebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      });

      // Ensure profiles exist
      await this.createUserProfiles(userId, sanitizedData, currentData);

      Logger.operationSuccess('migrateUser', { userId });
      return true;

    } catch (error) {
      Logger.operationFailed('migrateUser', error);
      throw error;
    }
  }
}

export default new RegistrationService(); 