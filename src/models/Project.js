import BaseModel from './BaseModel';
import { PROJECT_STATUSES } from '../utils/constants';

/**
 * Project model representing a project in the system
 */
export default class Project extends BaseModel {
  /**
   * Create a new Project instance
   * @param {Object} data - Project data
   */
  constructor(data = {}) {
    super(data);
    this.title = data.title || '';
    this.description = data.description || '';
    this.clientId = data.clientId || null;
    this.freelancerId = data.freelancerId || null;
    this.budget = data.budget || null;
    this.deadline = data.deadline || null;
    this.status = data.status || PROJECT_STATUSES.DRAFT;
    this.skills = data.skills || [];
    this.attachments = data.attachments || [];
    this.category = data.category || null;
    this.proposals = data.proposals || [];
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
  }

  /**
   * Check if the project is draft
   * @returns {boolean} True if project is draft
   */
  isDraft() {
    return this.status === PROJECT_STATUSES.DRAFT;
  }

  /**
   * Check if the project is open
   * @returns {boolean} True if project is open
   */
  isOpen() {
    return this.status === PROJECT_STATUSES.OPEN;
  }

  /**
   * Check if the project is in progress
   * @returns {boolean} True if project is in progress
   */
  isInProgress() {
    return this.status === PROJECT_STATUSES.IN_PROGRESS;
  }

  /**
   * Check if the project is completed
   * @returns {boolean} True if project is completed
   */
  isCompleted() {
    return this.status === PROJECT_STATUSES.COMPLETED;
  }

  /**
   * Check if the project is cancelled
   * @returns {boolean} True if project is cancelled
   */
  isCancelled() {
    return this.status === PROJECT_STATUSES.CANCELLED;
  }

  /**
   * Update project status
   * @param {string} status - New status
   * @returns {Project} Updated project instance
   */
  updateStatus(status) {
    if (Object.values(PROJECT_STATUSES).includes(status)) {
      this.status = status;
    }
    return this;
  }

  /**
   * Assign a freelancer to the project
   * @param {string} freelancerId - Freelancer ID
   * @returns {Project} Updated project instance
   */
  assignFreelancer(freelancerId) {
    this.freelancerId = freelancerId;
    this.status = PROJECT_STATUSES.IN_PROGRESS;
    return this;
  }

  /**
   * Complete the project
   * @returns {Project} Updated project instance
   */
  complete() {
    this.status = PROJECT_STATUSES.COMPLETED;
    return this;
  }

  /**
   * Cancel the project
   * @returns {Project} Updated project instance
   */
  cancel() {
    this.status = PROJECT_STATUSES.CANCELLED;
    return this;
  }
} 