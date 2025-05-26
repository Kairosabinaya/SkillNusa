import BaseService from './BaseService';
import { userRepository, profileRepository } from '../repositories';
import { ValidationError } from '../utils/errors';

/**
 * User service for handling user-related operations
 * Now extends BaseService for standardized patterns
 */
class UserService extends BaseService {
  constructor() {
    super(userRepository);
    this.profileRepository = profileRepository;
  }

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result object with user data or error
   */
  async getUserById(userId) {
    this.validateRequired({ userId }, ['userId']);
    
    return this.handleOperation(
      () => this.repository.findById(userId),
      'getUserById',
      { userId }
    );
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<object>} Result object with user data or error
   */
  async getUserByEmail(email) {
    this.validateRequired({ email }, ['email']);
    this.validateEmail(email);
    
    return this.handleOperation(
      () => this.repository.findByEmail(email),
      'getUserByEmail',
      { email }
    );
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<object>} Result object with users array or error
   */
  async getUsersByRole(role) {
    this.validateRequired({ role }, ['role']);
    
    const validRoles = ['freelancer', 'client', 'admin'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Invalid role specified', 'INVALID_ROLE', 'role');
    }
    
    return this.handleOperation(
      () => this.repository.findByRole(role),
      'getUsersByRole',
      { role }
    );
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<object>} Result object
   */
  async updateUser(userId, userData) {
    this.validateRequired({ userId, userData }, ['userId', 'userData']);
    
    // Validate email if provided
    if (userData.email) {
      this.validateEmail(userData.email);
    }
    
    return this.handleOperation(
      () => this.repository.update(userId, userData),
      'updateUser',
      { userId, userData }
    );
  }

  /**
   * Update user active status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<object>} Result object
   */
  async updateActiveStatus(userId, isActive) {
    this.validateRequired({ userId }, ['userId']);
    
    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean', 'INVALID_TYPE', 'isActive');
    }
    
    return this.handleOperation(
      () => this.repository.updateActiveStatus(userId, isActive),
      'updateActiveStatus',
      { userId, isActive }
    );
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result object with profile data or error
   */
  async getUserProfile(userId) {
    this.validateRequired({ userId }, ['userId']);
    
    return this.handleOperation(
      () => this.profileRepository.findByUserId(userId),
      'getUserProfile',
      { userId }
    );
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<object>} Result object
   */
  async updateUserProfile(userId, profileData) {
    this.validateRequired({ userId, profileData }, ['userId', 'profileData']);
    
    return this.handleOperation(
      () => this.profileRepository.update(userId, profileData),
      'updateUserProfile',
      { userId, profileData }
    );
  }

  /**
   * Update user skills
   * @param {string} userId - User ID
   * @param {Array<string>} skills - Skills array
   * @returns {Promise<object>} Result object
   */
  async updateUserSkills(userId, skills) {
    this.validateRequired({ userId, skills }, ['userId', 'skills']);
    
    if (!Array.isArray(skills)) {
      throw new ValidationError('Skills must be an array', 'INVALID_TYPE', 'skills');
    }
    
    return this.handleOperation(
      () => this.profileRepository.updateSkills(userId, skills),
      'updateUserSkills',
      { userId, skills }
    );
  }

  /**
   * Update user online status
   * @param {string} userId - User ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<object>} Result object
   */
  async updateOnlineStatus(userId, isOnline) {
    this.validateRequired({ userId }, ['userId']);
    
    if (typeof isOnline !== 'boolean') {
      throw new ValidationError('isOnline must be a boolean', 'INVALID_TYPE', 'isOnline');
    }
    
    return this.handleOperation(
      () => this.profileRepository.updateOnlineStatus(userId, isOnline),
      'updateOnlineStatus',
      { userId, isOnline }
    );
  }
}

// Export singleton instance
export default new UserService(); 