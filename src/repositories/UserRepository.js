import BaseRepository from './BaseRepository';
import User from '../models/User';
import { COLLECTIONS } from '../utils/constants';

/**
 * User repository for user-related database operations
 */
export default class UserRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.USERS, User);
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User or null if not found
   */
  async findByEmail(email) {
    try {
      const users = await this.find({
        filters: [
          { field: 'email', operator: '==', value: email }
        ]
      });

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array<User>>} Array of users with the role
   */
  async findByRole(role) {
    try {
      return await this.find({
        filters: [
          { field: 'roles', operator: 'array-contains', value: role }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create or update user from Firebase auth user
   * @param {Object} authUser - Firebase auth user
   * @param {Object} additionalData - Additional user data
   * @returns {Promise<string>} User ID
   */
  async createOrUpdateFromAuth(authUser, additionalData = {}) {
    try {
      const { uid, email, displayName, photoURL, emailVerified } = authUser;
      
      const userData = {
        uid,
        email,
        username: displayName || email.split('@')[0],
        displayName: displayName || email.split('@')[0],
        profilePhoto: photoURL || null,
        emailVerified,
        isActive: true,
        ...additionalData
      };
      
      return await this.create(uid, userData, true);
    } catch (error) {
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
      return await this.update(userId, { isActive });
    } catch (error) {
      throw error;
    }
  }
} 