import BaseModel from './BaseModel';

/**
 * FreelancerProfile model representing a freelancer profile in the system
 */
export default class FreelancerProfile extends BaseModel {
  /**
   * Create a new FreelancerProfile instance
   * @param {Object} data - FreelancerProfile data
   */
  constructor(data = {}) {
    super(data);
    this.userId = data.userId || null;
    this.title = data.title || '';
    this.skills = data.skills || [];
    this.categories = data.categories || [];
    this.experienceLevel = data.experienceLevel || 'beginner';
    this.hourlyRate = data.hourlyRate || 0;
    this.availability = data.availability || 'full-time';
    this.education = data.education || [];
    this.workExperience = data.workExperience || [];
    this.portfolio = data.portfolio || [];
    this.services = data.services || [];
    this.languages = data.languages || [];
    this.certifications = data.certifications || [];
    this.bio = data.bio || '';
    this.profilePhoto = data.profilePhoto || null;
    this.completedProjects = data.completedProjects || 0;
    this.orderCount = data.orderCount || 0;
    this.rating = data.rating || 0;
    this.reviews = data.reviews || [];
    this.location = data.location || '';
    this.socialLinks = data.socialLinks || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}
