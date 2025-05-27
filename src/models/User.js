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
    
    // Simplified role architecture
    this.isFreelancer = data.isFreelancer || false; // Quick check flag
    this.roles = data.roles || []; // Keep roles array for admin checking
    
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
    if (role === USER_ROLES.FREELANCER) {
      return this.isFreelancer;
    } else if (role === USER_ROLES.CLIENT) {
      return !this.isFreelancer;
    } else if (role === USER_ROLES.ADMIN) {
      return this.roles.includes(USER_ROLES.ADMIN);
    }
    return false;
  }

  /**
   * Check if the user is an admin
   * @returns {boolean} True if user is admin
   */
  isAdminUser() {
    return this.roles.includes(USER_ROLES.ADMIN);
  }

  /**
   * Check if the user is a freelancer
   * @returns {boolean} True if user is freelancer
   */
  isFreelancerUser() {
    return this.isFreelancer === true;
  }

  /**
   * Check if the user is a client
   * @returns {boolean} True if user is client
   */
  isClientUser() {
    return !this.isFreelancer;
  }
  
  /**
   * Check if user can switch to freelancer role
   * @returns {boolean} True if user can switch to freelancer role
   */
  canSwitchToFreelancer() {
    return this.isFreelancer; // No approval needed
  }
} 