import firebaseService from './firebaseService';
import { COLLECTIONS } from '../utils/constants';

/**
 * Service for managing gigs
 */
class GigService {
  /**
   * Get all gigs with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of gigs
   */
  async getGigs(filters = {}) {
    try {
      const options = {};
      
      if (filters.category) {
        options.filters = [{ field: 'category', operator: '==', value: filters.category }];
      }
      
      if (filters.freelancerId) {
        options.filters = [...(options.filters || []), { field: 'freelancerId', operator: '==', value: filters.freelancerId }];
      }
      
      options.orderByField = 'createdAt';
      options.orderDirection = 'desc';
      
      if (filters.limit) {
        options.limitCount = filters.limit;
      }
      
      return await firebaseService.getDocuments(COLLECTIONS.GIGS, options);
    } catch (error) {
      console.error('Error getting gigs:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific gig by ID
   * @param {string} gigId - Gig ID
   * @returns {Promise<Object|null>} Gig data or null
   */
  async getGig(gigId) {
    try {
      return await firebaseService.getDocument(COLLECTIONS.GIGS, gigId);
    } catch (error) {
      console.error('Error getting gig:', error);
      throw error;
    }
  }
  
  /**
   * Create a new gig
   * @param {string} freelancerId - Freelancer ID who creates the gig
   * @param {Object} gigData - Gig data
   * @returns {Promise<string>} New gig ID
   */
  async createGig(freelancerId, gigData) {
    try {
      const gig = {
        ...gigData,
        freelancerId,
        status: 'active',
        totalOrders: 0,
        totalReviews: 0,
        rating: 0
      };
      
      return await firebaseService.addDocument(COLLECTIONS.GIGS, gig);
    } catch (error) {
      console.error('Error creating gig:', error);
      throw error;
    }
  }
  
  /**
   * Update a gig
   * @param {string} gigId - Gig ID
   * @param {Object} updates - Data to update
   * @returns {Promise<void>}
   */
  async updateGig(gigId, updates) {
    try {
      return await firebaseService.updateDocument(COLLECTIONS.GIGS, gigId, updates);
    } catch (error) {
      console.error('Error updating gig:', error);
      throw error;
    }
  }
  
  /**
   * Delete a gig
   * @param {string} gigId - Gig ID
   * @returns {Promise<void>}
   */
  async deleteGig(gigId) {
    try {
      return await firebaseService.deleteDocument(COLLECTIONS.GIGS, gigId);
    } catch (error) {
      console.error('Error deleting gig:', error);
      throw error;
    }
  }
  
  /**
   * Search gigs by title or description
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of matching gigs
   */
  async searchGigs(query, filters = {}) {
    try {
      // For now, get all gigs and filter client-side
      // In production, you'd want to use Firestore's text search or Algolia
      const allGigs = await this.getGigs(filters);
      
      if (!query) return allGigs;
      
      const searchQuery = query.toLowerCase();
      return allGigs.filter(gig => 
        gig.title.toLowerCase().includes(searchQuery) ||
        gig.description.toLowerCase().includes(searchQuery) ||
        gig.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    } catch (error) {
      console.error('Error searching gigs:', error);
      throw error;
    }
  }
  
  /**
   * Get featured/popular gigs
   * @param {number} limit - Number of gigs to return
   * @returns {Promise<Array>} Array of featured gigs
   */
  async getFeaturedGigs(limit = 12) {
    try {
      return await this.getGigs({ 
        limit,
        // You can add additional criteria for featured gigs
      });
    } catch (error) {
      console.error('Error getting featured gigs:', error);
      throw error;
    }
  }
}

export default new GigService(); 