import BaseModel from './BaseModel';

/**
 * Profile model representing a user's profile
 */
export default class Profile extends BaseModel {
  /**
   * Create a new Profile instance
   * @param {Object} data - Profile data
   */
  constructor(data = {}) {
    super(data);
    this.userId = data.userId || null;
    this.skills = data.skills || [];
    this.isOnline = data.isOnline || false;
    this.headline = data.headline || '';
    this.education = data.education || [];
    this.experience = data.experience || [];
    this.portfolioItems = data.portfolioItems || [];
    this.hourlyRate = data.hourlyRate || null;
    this.availability = data.availability || null;
    this.socialLinks = data.socialLinks || {};
  }

  /**
   * Add a skill to the profile
   * @param {string} skill - Skill to add
   * @returns {Profile} Updated profile instance
   */
  addSkill(skill) {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
    }
    return this;
  }

  /**
   * Remove a skill from the profile
   * @param {string} skill - Skill to remove
   * @returns {Profile} Updated profile instance
   */
  removeSkill(skill) {
    this.skills = this.skills.filter(s => s !== skill);
    return this;
  }

  /**
   * Add an education item to the profile
   * @param {Object} education - Education item to add
   * @returns {Profile} Updated profile instance
   */
  addEducation(education) {
    this.education.push(education);
    return this;
  }

  /**
   * Add an experience item to the profile
   * @param {Object} experience - Experience item to add
   * @returns {Profile} Updated profile instance
   */
  addExperience(experience) {
    this.experience.push(experience);
    return this;
  }

  /**
   * Add a portfolio item to the profile
   * @param {Object} item - Portfolio item to add
   * @returns {Profile} Updated profile instance
   */
  addPortfolioItem(item) {
    this.portfolioItems.push(item);
    return this;
  }

  /**
   * Set hourly rate
   * @param {number} rate - Hourly rate
   * @returns {Profile} Updated profile instance
   */
  setHourlyRate(rate) {
    this.hourlyRate = rate;
    return this;
  }
} 