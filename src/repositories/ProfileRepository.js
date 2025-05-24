import BaseRepository from './BaseRepository';
import Profile from '../models/Profile';
import { COLLECTIONS } from '../utils/constants';

/**
 * Profile repository for profile-related database operations
 */
export default class ProfileRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.PROFILES, Profile);
  }

  /**
   * Find a profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Profile|null>} Profile or null if not found
   */
  async findByUserId(userId) {
    try {
      // In our case, the profile document ID is the same as the user ID
      return await this.findById(userId);
    } catch (error) {
      console.error('Error finding profile by user ID:', error);
      throw error;
    }
  }

  /**
   * Find profiles by skill
   * @param {string} skill - Skill to search for
   * @returns {Promise<Array<Profile>>} Array of profiles with the skill
   */
  async findBySkill(skill) {
    try {
      return await this.find({
        filters: [
          { field: 'skills', operator: 'array-contains', value: skill }
        ]
      });
    } catch (error) {
      console.error('Error finding profiles by skill:', error);
      throw error;
    }
  }

  /**
   * Update online status
   * @param {string} userId - User ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<void>}
   */
  async updateOnlineStatus(userId, isOnline) {
    try {
      return await this.update(userId, { isOnline });
    } catch (error) {
      console.error('Error updating online status:', error);
      throw error;
    }
  }

  /**
   * Update profile skills
   * @param {string} userId - User ID
   * @param {Array<string>} skills - Skills array
   * @returns {Promise<void>}
   */
  async updateSkills(userId, skills) {
    try {
      return await this.update(userId, { skills });
    } catch (error) {
      console.error('Error updating profile skills:', error);
      throw error;
    }
  }

  /**
   * Create a new profile for a user
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<string>} Profile ID
   */
  async createForUser(userId, profileData = {}) {
    try {
      const defaultProfile = {
        userId,
        skills: [],
        isOnline: false,
      };
      
      return await this.create(userId, { 
        ...defaultProfile,
        ...profileData 
      });
    } catch (error) {
      console.error('Error creating profile for user:', error);
      throw error;
    }
  }
} 