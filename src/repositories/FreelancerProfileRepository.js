import BaseRepository from './BaseRepository';
import FreelancerProfile from '../models/FreelancerProfile';
import { COLLECTIONS } from '../utils/constants';

/**
 * FreelancerProfile repository for freelancer profile-related database operations
 */
export default class FreelancerProfileRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.FREELANCER_PROFILES, FreelancerProfile);
  }

  /**
   * Find a freelancer profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<FreelancerProfile|null>} Freelancer profile or null if not found
   */
  async findByUserId(userId) {
    try {
      return await this.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find freelancer profiles by skill
   * @param {string} skill - Skill to search for
   * @returns {Promise<Array<FreelancerProfile>>} Array of freelancer profiles with the skill
   */
  async findBySkill(skill) {
    try {
      return await this.find({
        filters: [
          { field: 'skills', operator: 'array-contains', value: skill }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find freelancer profiles by experience level
   * @param {string} experienceLevel - Experience level to filter by
   * @returns {Promise<Array<FreelancerProfile>>} Array of freelancer profiles
   */
  async findByExperienceLevel(experienceLevel) {
    try {
      return await this.find({
        filters: [
          { field: 'experienceLevel', operator: '==', value: experienceLevel }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find freelancer profiles by hourly rate range
   * @param {number} minRate - Minimum hourly rate
   * @param {number} maxRate - Maximum hourly rate
   * @returns {Promise<Array<FreelancerProfile>>} Array of freelancer profiles
   */
  async findByHourlyRateRange(minRate, maxRate) {
    try {
      return await this.find({
        filters: [
          { field: 'hourlyRate', operator: '>=', value: minRate },
          { field: 'hourlyRate', operator: '<=', value: maxRate }
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new freelancer profile for a user
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<string>} Profile ID
   */
  async createForUser(userId, profileData = {}) {
    try {
      const defaultProfile = {
        userId,
        title: '',
        skills: [],
        categories: [],
        experienceLevel: 'beginner',
        hourlyRate: 0,
        availability: 'full-time',
        education: [],
        workExperience: [],
        portfolio: [],
        services: [],
        languages: [],
        certifications: [],
        bio: '',
        profilePhoto: null,
        completedProjects: 0,
        rating: 0,
        reviews: [],
        location: '',
        socialLinks: {}
      };
      
      return await this.create(userId, { 
        ...defaultProfile,
        ...profileData 
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update freelancer skills
   * @param {string} userId - User ID
   * @param {Array<string>} skills - Skills array
   * @returns {Promise<void>}
   */
  async updateSkills(userId, skills) {
    try {
      return await this.update(userId, { skills });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update freelancer hourly rate
   * @param {string} userId - User ID
   * @param {number} hourlyRate - New hourly rate
   * @returns {Promise<void>}
   */
  async updateHourlyRate(userId, hourlyRate) {
    try {
      return await this.update(userId, { hourlyRate });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add portfolio item
   * @param {string} userId - User ID
   * @param {Object} portfolioItem - Portfolio item object
   * @returns {Promise<void>}
   */
  async addPortfolioItem(userId, portfolioItem) {
    try {
      const profile = await this.findByUserId(userId);
      if (profile) {
        const updatedPortfolio = [...profile.portfolio, portfolioItem];
        return await this.update(userId, { portfolio: updatedPortfolio });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update completed projects count
   * @param {string} userId - User ID
   * @param {number} count - New completed projects count
   * @returns {Promise<void>}
   */
  async updateCompletedProjects(userId, count) {
    try {
      return await this.update(userId, { completedProjects: count });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update rating
   * @param {string} userId - User ID
   * @param {number} rating - New rating
   * @returns {Promise<void>}
   */
  async updateRating(userId, rating) {
    try {
      return await this.update(userId, { rating });
    } catch (error) {
      throw error;
    }
  }
} 