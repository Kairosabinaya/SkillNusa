import firebaseService from './firebaseService';
import { COLLECTIONS } from '../utils/constants';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { recalculateFreelancerRating } from './userProfileService';

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
   * Create a new review and auto-update freelancer rating
   * @param {Object} reviewData - Review data
   * @returns {Promise<string>} Review ID
   */
  async createReview(reviewData) {
    try {
      console.log('📝 Creating review and updating freelancer rating...');
      
      // Create the review
      const reviewRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...reviewData,
        status: 'published',
        isVisible: true,
        isReported: false,
        helpful: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Review created:', reviewRef.id);
      
      // Auto-recalculate freelancer rating
      if (reviewData.freelancerId) {
        console.log('🔄 Auto-updating freelancer rating...');
        await recalculateFreelancerRating(reviewData.freelancerId);
        console.log('✅ Freelancer rating updated automatically');
      }
      
      return reviewRef.id;
    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  }
  
  /**
   * Update review and recalculate freelancer rating
   * @param {string} reviewId - Review ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateReview(reviewId, updateData) {
    try {
      console.log('📝 Updating review and recalculating rating...');
      
      // Get current review to know which freelancer to update
      const reviewDoc = await getDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const currentReview = reviewDoc.data();
      
      // Update the review
      await updateDoc(doc(db, COLLECTIONS.REVIEWS, reviewId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Review updated');
      
      // Auto-recalculate freelancer rating if rating changed
      if (updateData.rating !== undefined && currentReview.freelancerId) {
        console.log('🔄 Auto-updating freelancer rating due to rating change...');
        await recalculateFreelancerRating(currentReview.freelancerId);
        console.log('✅ Freelancer rating recalculated');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error updating review:', error);
      throw error;
    }
  }
  
  /**
   * Delete review and recalculate freelancer rating
   * @param {string} reviewId - Review ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteReview(reviewId) {
    try {
      console.log('🗑️ Deleting review and recalculating rating...');
      
      // Get review data before deletion
      const reviewDoc = await getDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const reviewData = reviewDoc.data();
      
      // Delete the review
      await deleteDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
      console.log('✅ Review deleted');
      
      // Auto-recalculate freelancer rating
      if (reviewData.freelancerId) {
        console.log('🔄 Auto-updating freelancer rating after deletion...');
        await recalculateFreelancerRating(reviewData.freelancerId);
        console.log('✅ Freelancer rating recalculated');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting review:', error);
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