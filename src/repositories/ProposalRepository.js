import BaseRepository from './BaseRepository';
import Proposal, { PROPOSAL_STATUSES } from '../models/Proposal';
import { COLLECTIONS } from '../utils/constants';

/**
 * Proposal repository for proposal-related database operations
 */
export default class ProposalRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.PROPOSALS, Proposal);
  }

  /**
   * Find proposals by project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array<Proposal>>} Array of proposals
   */
  async findByProject(projectId) {
    try {
      return await this.find({
        filters: [
          { field: 'projectId', operator: '==', value: projectId }
        ],
        orderByField: 'createdAt'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find proposals by freelancer
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Array<Proposal>>} Array of proposals
   */
  async findByFreelancer(freelancerId) {
    try {
      return await this.find({
        filters: [
          { field: 'freelancerId', operator: '==', value: freelancerId }
        ],
        orderByField: 'createdAt'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find pending proposals
   * @returns {Promise<Array<Proposal>>} Array of pending proposals
   */
  async findPendingProposals() {
    try {
      return await this.find({
        filters: [
          { field: 'status', operator: '==', value: PROPOSAL_STATUSES.PENDING }
        ],
        orderByField: 'createdAt'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update proposal status
   * @param {string} proposalId - Proposal ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(proposalId, status) {
    try {
      // Validate status
      if (!Object.values(PROPOSAL_STATUSES).includes(status)) {
        throw new Error(`Invalid proposal status: ${status}`);
      }
      
      return await this.update(proposalId, { status });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accept a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<void>}
   */
  async acceptProposal(proposalId) {
    try {
      return await this.updateStatus(proposalId, PROPOSAL_STATUSES.ACCEPTED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<void>}
   */
  async rejectProposal(proposalId) {
    try {
      return await this.updateStatus(proposalId, PROPOSAL_STATUSES.REJECTED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Withdraw a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<void>}
   */
  async withdrawProposal(proposalId) {
    try {
      return await this.updateStatus(proposalId, PROPOSAL_STATUSES.WITHDRAWN);
    } catch (error) {
      throw error;
    }
  }
} 