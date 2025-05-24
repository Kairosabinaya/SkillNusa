import { projectRepository, proposalRepository } from '../repositories';
import { Project, Proposal } from '../models';

/**
 * Project service for handling project-related operations
 */
export default class ProjectService {
  /**
   * Get a project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Project|null>} Project model or null
   */
  async getProjectById(projectId) {
    try {
      return await projectRepository.findById(projectId);
    } catch (error) {
      console.error("Error getting project by ID:", error);
      throw error;
    }
  }

  /**
   * Get projects by client ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async getProjectsByClient(clientId) {
    try {
      return await projectRepository.findByClient(clientId);
    } catch (error) {
      console.error("Error getting projects by client:", error);
      throw error;
    }
  }

  /**
   * Get projects by freelancer ID
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async getProjectsByFreelancer(freelancerId) {
    try {
      return await projectRepository.findByFreelancer(freelancerId);
    } catch (error) {
      console.error("Error getting projects by freelancer:", error);
      throw error;
    }
  }

  /**
   * Get open projects
   * @param {number} limit - Number of projects to return
   * @returns {Promise<Array<Project>>} Array of projects
   */
  async getOpenProjects(limit = 10) {
    try {
      return await projectRepository.findOpenProjects(limit);
    } catch (error) {
      console.error("Error getting open projects:", error);
      throw error;
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<string>} Project ID
   */
  async createProject(projectData) {
    try {
      const project = new Project(projectData);
      return await projectRepository.add(project);
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Project data to update
   * @returns {Promise<void>}
   */
  async updateProject(projectId, projectData) {
    try {
      return await projectRepository.update(projectId, projectData);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  /**
   * Delete project
   * @param {string} projectId - Project ID
   * @returns {Promise<void>}
   */
  async deleteProject(projectId) {
    try {
      return await projectRepository.delete(projectId);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateProjectStatus(projectId, status) {
    try {
      return await projectRepository.updateStatus(projectId, status);
    } catch (error) {
      console.error("Error updating project status:", error);
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
      return await projectRepository.assignFreelancer(projectId, freelancerId);
    } catch (error) {
      console.error("Error assigning freelancer to project:", error);
      throw error;
    }
  }

  /**
   * Create a new proposal
   * @param {Object} proposalData - Proposal data
   * @returns {Promise<string>} Proposal ID
   */
  async createProposal(proposalData) {
    try {
      const proposal = new Proposal(proposalData);
      return await proposalRepository.add(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }
  }

  /**
   * Get proposals by project ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Array<Proposal>>} Array of proposals
   */
  async getProposalsByProject(projectId) {
    try {
      return await proposalRepository.findByProject(projectId);
    } catch (error) {
      console.error("Error getting proposals by project:", error);
      throw error;
    }
  }

  /**
   * Get proposals by freelancer ID
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Array<Proposal>>} Array of proposals
   */
  async getProposalsByFreelancer(freelancerId) {
    try {
      return await proposalRepository.findByFreelancer(freelancerId);
    } catch (error) {
      console.error("Error getting proposals by freelancer:", error);
      throw error;
    }
  }

  /**
   * Accept a proposal and assign freelancer to project
   * @param {string} projectId - Project ID
   * @param {string} proposalId - Proposal ID
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<void>}
   */
  async acceptProposal(projectId, proposalId, freelancerId) {
    try {
      // Accept the proposal
      await proposalRepository.acceptProposal(proposalId);
      
      // Assign freelancer to the project
      await projectRepository.assignFreelancer(projectId, freelancerId);
      
      // Reject all other proposals for this project
      const otherProposals = await proposalRepository.findByProject(projectId);
      
      await Promise.all(otherProposals
        .filter(proposal => proposal.id !== proposalId)
        .map(proposal => proposalRepository.rejectProposal(proposal.id))
      );
    } catch (error) {
      console.error("Error accepting proposal:", error);
      throw error;
    }
  }
} 