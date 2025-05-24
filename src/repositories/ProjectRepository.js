import BaseRepository from './BaseRepository';
import Project from '../models/Project';
import { COLLECTIONS, PROJECT_STATUSES } from '../utils/constants';

/**
 * Project repository for project-related database operations
 */
export default class ProjectRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.PROJECTS, Project);
  }

  /**
   * Find projects by client
   * @param {string} clientId - Client ID
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async findByClient(clientId) {
    try {
      return await this.find({
        filters: [
          { field: 'clientId', operator: '==', value: clientId }
        ],
        orderByField: 'updatedAt'
      });
    } catch (error) {
      console.error('Error finding projects by client:', error);
      throw error;
    }
  }

  /**
   * Find projects by freelancer
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async findByFreelancer(freelancerId) {
    try {
      return await this.find({
        filters: [
          { field: 'freelancerId', operator: '==', value: freelancerId }
        ],
        orderByField: 'updatedAt'
      });
    } catch (error) {
      console.error('Error finding projects by freelancer:', error);
      throw error;
    }
  }

  /**
   * Find open projects
   * @param {number} limit - Number of projects to return
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async findOpenProjects(limit = 10) {
    try {
      return await this.find({
        filters: [
          { field: 'status', operator: '==', value: PROJECT_STATUSES.OPEN },
          { field: 'isPublic', operator: '==', value: true }
        ],
        orderByField: 'updatedAt',
        limitCount: limit
      });
    } catch (error) {
      console.error('Error finding open projects:', error);
      throw error;
    }
  }

  /**
   * Find projects by required skill
   * @param {string} skill - Required skill
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async findBySkill(skill) {
    try {
      return await this.find({
        filters: [
          { field: 'skills', operator: 'array-contains', value: skill },
          { field: 'status', operator: '==', value: PROJECT_STATUSES.OPEN }
        ],
        orderByField: 'updatedAt'
      });
    } catch (error) {
      console.error('Error finding projects by skill:', error);
      throw error;
    }
  }

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(projectId, status) {
    try {
      // Validate status
      if (!Object.values(PROJECT_STATUSES).includes(status)) {
        throw new Error(`Invalid project status: ${status}`);
      }
      
      return await this.update(projectId, { status });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  /**
   * Assign freelancer to project
   * @param {string} projectId - Project ID
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<void>}
   */
  async assignFreelancer(projectId, freelancerId) {
    try {
      return await this.update(projectId, { 
        freelancerId,
        status: PROJECT_STATUSES.IN_PROGRESS
      });
    } catch (error) {
      console.error('Error assigning freelancer to project:', error);
      throw error;
    }
  }
} 