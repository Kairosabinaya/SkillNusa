import BaseModel from './BaseModel';
import { USER_ROLES } from '../utils/constants';

/**
 * User model representing a user in the system
 */
export default class User extends BaseModel {
  /**
   * Create a new User instance
   * @param {Object} data - User data
   */
  constructor(data = {}) {
    super(data);
    this.uid = data.uid || null;
    this.email = data.email || '';
    this.username = data.username || '';
    this.displayName = data.displayName || '';
    this.fullName = data.fullName || '';
    this.phoneNumber = data.phoneNumber || '';
    this.gender = data.gender || '';
    this.birthDate = data.birthDate || '';
    this.role = data.role || USER_ROLES.CLIENT;
    this.profilePhoto = data.profilePhoto || null;
    this.bio = data.bio || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.emailVerified = data.emailVerified || false;
  }

  /**
   * Check if the user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    return this.role === role || this.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if the user is an admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if the user is a freelancer
   * @returns {boolean} True if user is freelancer
   */
  isFreelancer() {
    return this.role === USER_ROLES.FREELANCER;
  }

  /**
   * Check if the user is a client
   * @returns {boolean} True if user is client
   */
  isClient() {
    return this.role === USER_ROLES.CLIENT;
  }
} 