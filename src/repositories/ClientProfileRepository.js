import BaseRepository from './BaseRepository';
import ClientProfile from '../models/ClientProfile';
import { COLLECTIONS } from '../utils/constants';

/**
 * ClientProfile repository for client profile-related database operations
 */
export default class ClientProfileRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.CLIENT_PROFILES, ClientProfile);
  }

  /**
   * Find a client profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<ClientProfile|null>} Client profile or null if not found
   */
  async findByUserId(userId) {
    try {
      return await this.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new client profile for a user
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<string>} Profile ID
   */
  async createForUser(userId, profileData = {}) {
    try {
      const defaultProfile = {
        userID: userId,
        bio: profileData.bio || '',
      };
      
      return await this.create(userId, defaultProfile);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update client preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences object
   * @returns {Promise<void>}
   */
  async updatePreferences(userId, preferences) {
    try {
      return await this.update(userId, { preferences });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add hired freelancer to the list
   * @param {string} userId - User ID
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<void>}
   */
  async addHiredFreelancer(userId, freelancerId) {
    try {
      const profile = await this.findByUserId(userId);
      if (profile && !profile.hiredFreelancers.includes(freelancerId)) {
        const updatedList = [...profile.hiredFreelancers, freelancerId];
        return await this.update(userId, { hiredFreelancers: updatedList });
      }
    } catch (error) {
      throw error;
    }
  }
} 