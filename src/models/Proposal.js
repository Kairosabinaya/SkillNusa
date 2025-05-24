import BaseModel from './BaseModel';

/**
 * Proposal statuses
 */
export const PROPOSAL_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

/**
 * Proposal model representing a project proposal
 */
export default class Proposal extends BaseModel {
  /**
   * Create a new Proposal instance
   * @param {Object} data - Proposal data
   */
  constructor(data = {}) {
    super(data);
    this.projectId = data.projectId || null;
    this.freelancerId = data.freelancerId || null;
    this.coverLetter = data.coverLetter || '';
    this.bidAmount = data.bidAmount || 0;
    this.estimatedDuration = data.estimatedDuration || null;
    this.status = data.status || PROPOSAL_STATUSES.PENDING;
    this.attachments = data.attachments || [];
  }

  /**
   * Check if the proposal is pending
   * @returns {boolean} True if proposal is pending
   */
  isPending() {
    return this.status === PROPOSAL_STATUSES.PENDING;
  }

  /**
   * Check if the proposal is accepted
   * @returns {boolean} True if proposal is accepted
   */
  isAccepted() {
    return this.status === PROPOSAL_STATUSES.ACCEPTED;
  }

  /**
   * Check if the proposal is rejected
   * @returns {boolean} True if proposal is rejected
   */
  isRejected() {
    return this.status === PROPOSAL_STATUSES.REJECTED;
  }

  /**
   * Check if the proposal is withdrawn
   * @returns {boolean} True if proposal is withdrawn
   */
  isWithdrawn() {
    return this.status === PROPOSAL_STATUSES.WITHDRAWN;
  }

  /**
   * Accept the proposal
   * @returns {Proposal} Updated proposal instance
   */
  accept() {
    this.status = PROPOSAL_STATUSES.ACCEPTED;
    return this;
  }

  /**
   * Reject the proposal
   * @returns {Proposal} Updated proposal instance
   */
  reject() {
    this.status = PROPOSAL_STATUSES.REJECTED;
    return this;
  }

  /**
   * Withdraw the proposal
   * @returns {Proposal} Updated proposal instance
   */
  withdraw() {
    this.status = PROPOSAL_STATUSES.WITHDRAWN;
    return this;
  }
} 