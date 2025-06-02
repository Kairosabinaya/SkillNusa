import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import reviewService from './reviewService';

/**
 * Service for calculating freelancer ratings based on all their gigs
 */
class FreelancerRatingService {
  
  /**
   * Calculate freelancer rating stats based on all their gigs
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Object>} Rating statistics
   */
  async calculateFreelancerRatingStats(freelancerId) {
    try {
      console.log('🔍 Calculating rating stats for freelancer:', freelancerId);
      
      // Get all gigs for this freelancer with fallback query
      let allGigs = [];
      try {
        // Try compound query first
        const gigsQuery = query(
          collection(db, COLLECTIONS.GIGS),
          where('freelancerId', '==', freelancerId),
          where('isActive', '==', true)
        );
        
        const gigsSnapshot = await getDocs(gigsQuery);
        gigsSnapshot.docs.forEach(doc => {
          allGigs.push({
            id: doc.id,
            ...doc.data()
          });
        });
      } catch (error) {
        console.log('Error with freelancerId query, trying userId...', error.message);
        
        // Try with userId field if freelancerId fails
        try {
          const gigsQuery = query(
            collection(db, COLLECTIONS.GIGS),
            where('userId', '==', freelancerId),
            where('isActive', '==', true)
          );
          
          const gigsSnapshot = await getDocs(gigsQuery);
          gigsSnapshot.docs.forEach(doc => {
            allGigs.push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (userIdError) {
          console.log('Error with userId query, trying simple queries...', userIdError.message);
          
          // Final fallback: separate simple queries
          try {
            const freelancerGigsQuery = query(
              collection(db, COLLECTIONS.GIGS),
              where('freelancerId', '==', freelancerId)
            );
            const userGigsQuery = query(
              collection(db, COLLECTIONS.GIGS),
              where('userId', '==', freelancerId)
            );
            
            const [freelancerSnapshot, userSnapshot] = await Promise.all([
              getDocs(freelancerGigsQuery),
              getDocs(userGigsQuery)
            ]);
            
            const processedGigIds = new Set();
            
            // Process freelancer gigs
            freelancerSnapshot.docs.forEach(doc => {
              const gigData = doc.data();
              if (gigData.isActive && !processedGigIds.has(doc.id)) {
                processedGigIds.add(doc.id);
                allGigs.push({
                  id: doc.id,
                  ...gigData
                });
              }
            });
            
            // Process user gigs (avoid duplicates)
            userSnapshot.docs.forEach(doc => {
              const gigData = doc.data();
              if (gigData.isActive && !processedGigIds.has(doc.id)) {
                processedGigIds.add(doc.id);
                allGigs.push({
                  id: doc.id,
                  ...gigData
                });
              }
            });
          } catch (fallbackError) {
            console.error('All gig queries failed:', fallbackError.message);
          }
        }
      }
      
      console.log(`📊 Found ${allGigs.length} gigs for freelancer`);
      
      if (allGigs.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          gigRatings: []
        };
      }
      
      // Get reviews for each gig using reviewService with fallback
      let totalRatingSum = 0;
      let totalReviewsCount = 0;
      const gigRatings = [];
      
      for (const gig of allGigs) {
        try {
          const gigRatingStats = await reviewService.getGigRatingStats(gig.id);
          
          gigRatings.push({
            gigId: gig.id,
            gigTitle: gig.title || 'Unknown Gig',
            averageRating: gigRatingStats.averageRating,
            totalReviews: gigRatingStats.totalReviews
          });
          
          if (gigRatingStats.totalReviews > 0) {
            totalRatingSum += gigRatingStats.averageRating * gigRatingStats.totalReviews;
            totalReviewsCount += gigRatingStats.totalReviews;
          }
          
          console.log(`  📊 Gig "${gig.title}": ${gigRatingStats.averageRating.toFixed(1)} stars (${gigRatingStats.totalReviews} reviews)`);
          
        } catch (error) {
          console.error(`Error processing gig ${gig.id}:`, error.message);
        }
      }
      
      const averageRating = totalReviewsCount > 0 
        ? Math.round((totalRatingSum / totalReviewsCount) * 10) / 10
        : 0;
      
      console.log(`📊 Freelancer ${freelancerId} rating stats: ${averageRating} (${totalReviewsCount} total reviews)`);
      
      return {
        averageRating,
        totalReviews: totalReviewsCount,
        gigRatings
      };
    } catch (error) {
      console.error('Error calculating freelancer rating stats:', error.message);
      return {
        averageRating: 0,
        totalReviews: 0,
        gigRatings: []
      };
    }
  }
  
  /**
   * Get all reviews for a freelancer (from all their gigs)
   * @param {string} freelancerId - Freelancer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  async getAllFreelancerReviews(freelancerId, options = {}) {
    try {
      console.log('🔍 Getting all reviews for freelancer:', freelancerId);
      
      // Get all gigs for this freelancer
      const gigsQuery = query(
        collection(db, COLLECTIONS.GIGS),
        where('freelancerId', '==', freelancerId),
        where('isActive', '==', true)
      );
      
      const gigsSnapshot = await getDocs(gigsQuery);
      const gigIds = gigsSnapshot.docs.map(doc => doc.id);
      
      console.log(`📊 Found ${gigIds.length} gigs for freelancer`);
      
      if (gigIds.length === 0) {
        return [];
      }
      
      // Get reviews for all gigs
      const reviewPromises = gigIds.map(gigId => 
        reviewService.getGigReviews(gigId, options)
      );
      
      const reviewArrays = await Promise.all(reviewPromises);
      
      // Flatten all reviews into one array
      const allReviews = reviewArrays.flat();
      
      // Sort by date (newest first)
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply limit if specified
      if (options.limit) {
        return allReviews.slice(0, options.limit);
      }
      
      console.log(`📊 Returning ${allReviews.length} total reviews for freelancer`);
      return allReviews;
      
    } catch (error) {
      console.error('Error getting all freelancer reviews:', error);
      return [];
    }
  }
  
  /**
   * Update freelancer profile with calculated rating stats
   * @param {string} freelancerId - Freelancer ID
   * @returns {Promise<Object>} Updated rating stats
   */
  async updateFreelancerRatingInProfile(freelancerId) {
    try {
      const ratingStats = await this.calculateFreelancerRatingStats(freelancerId);
      
      // Update freelancer profile with new rating stats
      const freelancerProfileRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId);
      await updateDoc(freelancerProfileRef, {
        rating: ratingStats.averageRating,
        totalReviews: ratingStats.totalReviews,
        lastRatingUpdate: new Date()
      });
      
      console.log(`✅ Updated freelancer ${freelancerId} rating to ${ratingStats.averageRating}`);
      
      return ratingStats;
    } catch (error) {
      console.error('Error updating freelancer rating in profile:', error);
      throw error;
    }
  }
}

export default new FreelancerRatingService(); 