import firebaseService from './firebaseService';
import { COLLECTIONS } from '../utils/constants';

/**
 * Service for managing reviews
 */
class ReviewService {
  /**
   * Get reviews for a specific gig
   * @param {string} gigId - Gig ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  async getGigReviews(gigId, options = {}) {
    try {
      const queryOptions = {
        filters: [{ field: 'gigId', operator: '==', value: gigId }],
        orderByField: 'createdAt',
        orderDirection: 'desc'
      };
      
      if (options.limit) {
        queryOptions.limitCount = options.limit;
      }
      
      return await firebaseService.getDocuments(COLLECTIONS.REVIEWS, queryOptions);
    } catch (error) {
      console.error('Error getting gig reviews:', error);
      throw error;
    }
  }
  
  /**
   * Get reviews for a specific freelancer
   * @param {string} freelancerId - Freelancer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  async getFreelancerReviews(freelancerId, options = {}) {
    try {
      const queryOptions = {
        filters: [{ field: 'freelancerId', operator: '==', value: freelancerId }],
        orderByField: 'createdAt',
        orderDirection: 'desc'
      };
      
      if (options.limit) {
        queryOptions.limitCount = options.limit;
      }
      
      return await firebaseService.getDocuments(COLLECTIONS.REVIEWS, queryOptions);
    } catch (error) {
      console.error('Error getting freelancer reviews:', error);
      throw error;
    }
  }
  
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @returns {Promise<string>} New review ID
   */
  async createReview(reviewData) {
    try {
      const review = {
        ...reviewData,
        status: 'published'
      };
      
      return await firebaseService.addDocument(COLLECTIONS.REVIEWS, review);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }
  
  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {Object} updates - Data to update
   * @returns {Promise<void>}
   */
  async updateReview(reviewId, updates) {
    try {
      return await firebaseService.updateDocument(COLLECTIONS.REVIEWS, reviewId, updates);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }
  
  /**
   * Calculate average rating for a gig
   * @param {string} gigId - Gig ID
   * @returns {Promise<Object>} Rating statistics
   */
  async getGigRatingStats(gigId) {
    try {
      const reviews = await this.getGigReviews(gigId);
      
      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }
      
      const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;
      
      reviews.forEach(review => {
        const rating = review.rating;
        ratingBreakdown[rating]++;
        totalRating += rating;
      });
      
      const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
      
      return {
        averageRating,
        totalReviews: reviews.length,
        ratingBreakdown
      };
    } catch (error) {
      console.error('Error calculating rating stats:', error);
      throw error;
    }
  }
  
  /**
   * Mark review as helpful
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID who marked it helpful
   * @param {boolean} helpful - true for helpful, false for not helpful
   * @returns {Promise<void>}
   */
  async markReviewHelpful(reviewId, userId, helpful) {
    try {
      const review = await firebaseService.getDocument(COLLECTIONS.REVIEWS, reviewId);
      if (!review) throw new Error('Review not found');
      
      const helpfulVotes = review.helpfulVotes || { yes: [], no: [] };
      
      // Remove user from both arrays first
      helpfulVotes.yes = helpfulVotes.yes.filter(id => id !== userId);
      helpfulVotes.no = helpfulVotes.no.filter(id => id !== userId);
      
      // Add to appropriate array
      if (helpful) {
        helpfulVotes.yes.push(userId);
      } else {
        helpfulVotes.no.push(userId);
      }
      
      return await firebaseService.updateDocument(COLLECTIONS.REVIEWS, reviewId, {
        helpfulVotes
      });
    } catch (error) {
      console.error('Error marking review helpful:', error);
      throw error;
    }
  }
}

export default new ReviewService(); 