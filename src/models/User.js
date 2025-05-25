import BaseModel from './BaseModel';
import { USER_ROLES, FREELANCER_STATUS } from '../utils/constants';

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
    
    // Multi-role architecture
    this.roles = data.roles || [USER_ROLES.CLIENT]; // Array, default ['client']
    this.activeRole = data.activeRole || USER_ROLES.CLIENT; // Currently active role
    this.isFreelancer = data.isFreelancer || false; // Quick check flag
    this.freelancerStatus = data.freelancerStatus || null; // 'pending', 'approved', 'rejected'
    this.freelancerAppliedAt = data.freelancerAppliedAt || null;
    this.freelancerApprovedAt = data.freelancerApprovedAt || null;
    
    // Legacy support for single-role field (deprecated)
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
    return this.roles.includes(role) || this.roles.includes(USER_ROLES.ADMIN);
  }

  /**
   * Check if the user is an admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.roles.includes(USER_ROLES.ADMIN);
  }

  /**
   * Check if the user is a freelancer
   * @returns {boolean} True if user is freelancer
   */
  isFreelancer() {
    return this.roles.includes(USER_ROLES.FREELANCER);
  }

  /**
   * Check if the user is a client
   * @returns {boolean} True if user is client
   */
  isClient() {
    return this.roles.includes(USER_ROLES.CLIENT);
  }
  
  /**
   * Check if user can switch to freelancer role
   * @returns {boolean} True if user can switch to freelancer role
   */
  canSwitchToFreelancer() {
    return this.isFreelancer && this.freelancerStatus === FREELANCER_STATUS.APPROVED;
  }
} 