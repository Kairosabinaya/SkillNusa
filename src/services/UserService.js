import { userRepository, profileRepository } from '../repositories';

/**
 * User service for handling user-related operations
 */
export default class UserService {
  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User|null>} User model or null
   */
  async getUserById(userId) {
    try {
      return await userRepository.findById(userId);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User model or null
   */
  async getUserByEmail(email) {
    try {
      return await userRepository.findByEmail(email);
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array<User>>} Array of users
   */
  async getUsersByRole(role) {
    try {
      return await userRepository.findByRole(role);
    } catch (error) {
      console.error("Error getting users by role:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<void>}
   */
  async updateUser(userId, userData) {
    try {
      return await userRepository.update(userId, userData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Update user active status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<void>}
   */
  async updateActiveStatus(userId, isActive) {
    try {
      return await userRepository.updateActiveStatus(userId, isActive);
    } catch (error) {
      console.error("Error updating user active status:", error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Profile|null>} Profile model or null
   */
  async getUserProfile(userId) {
    try {
      return await profileRepository.findByUserId(userId);
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, profileData) {
    try {
      return await profileRepository.update(userId, profileData);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Update user skills
   * @param {string} userId - User ID
   * @param {Array<string>} skills - Skills array
   * @returns {Promise<void>}
   */
  async updateUserSkills(userId, skills) {
    try {
      return await profileRepository.updateSkills(userId, skills);
    } catch (error) {
      console.error("Error updating user skills:", error);
      throw error;
    }
  }

  /**
   * Update user online status
   * @param {string} userId - User ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<void>}
   */
  async updateOnlineStatus(userId, isOnline) {
    try {
      return await profileRepository.updateOnlineStatus(userId, isOnline);
    } catch (error) {
      console.error("Error updating user online status:", error);
      throw error;
    }
  }
} 