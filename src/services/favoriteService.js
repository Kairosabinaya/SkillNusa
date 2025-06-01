/**
 * Favorite Service - Handles user favorites/wishlist functionality
 * Updated to use new database structure with proper references
 */

import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

class FavoriteService {
  constructor() {
    this.collectionName = COLLECTIONS.FAVORITES;
  }

  // Add gig to favorites
  async addToFavorites(userId, gigId) {
    try {
      // Check if already in favorites
      const existingFavorite = await this.checkIfFavorite(userId, gigId);
      if (existingFavorite) {
        throw new Error('Gig already in favorites');
      }

      // Add to favorites with reference only (no embedded data)
      const favoriteData = {
        userId,
        gigId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), favoriteData);
      return { id: docRef.id, ...favoriteData };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId, gigId) {
    try {
      const favorite = await this.checkIfFavorite(userId, gigId);
      if (!favorite) {
        throw new Error('Gig not in favorites');
      }

      await deleteDoc(doc(db, this.collectionName, favorite.id));
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Check if gig is in user's favorites
  async checkIfFavorite(userId, gigId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('gigId', '==', gigId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return null;
    }
  }

  // Subscribe to user's favorites count with real-time updates
  subscribeToFavoritesCount(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const count = querySnapshot.size;
        callback(count);
      }, (error) => {
        console.error('Error in favorites count subscription:', error);
        // Call callback with 0 on error to prevent app crash
        callback(0);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up favorites count subscription:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  // Get user's favorite gigs with complete gig data
  async getUserFavorites(userId, options = {}) {
    try {
      const { limit: queryLimit = 20, orderBy: orderField = 'createdAt' } = options;

      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy(orderField, 'desc'),
        limit(queryLimit)
      );

      const querySnapshot = await getDocs(q);
      const favorites = [];

      // Get complete gig data for each favorite
      for (const doc of querySnapshot.docs) {
        const favoriteData = { id: doc.id, ...doc.data() };
        
        // Get gig data using reference
        const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, favoriteData.gigId));
        if (gigDoc.exists()) {
          const gigData = gigDoc.data();
          
          // Get freelancer data for the gig
          const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
          let freelancerData = null;
          if (freelancerDoc.exists()) {
            const userData = freelancerDoc.data();
            
            // Get freelancer profile for performance data
            const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
            const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
            
            freelancerData = {
              id: gigData.userId,
              displayName: userData.displayName,
              profilePhoto: userData.profilePhoto,
              rating: profileData.rating || 0,
              totalReviews: profileData.totalReviews || 0
            };
          }

          favorites.push({
            ...favoriteData,
            gig: {
              id: favoriteData.gigId,
              ...gigData,
              freelancer: freelancerData
            }
          });
        }
      }

      return favorites;
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }

  // Get favorite count for a gig
  async getGigFavoriteCount(gigId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('gigId', '==', gigId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting gig favorite count:', error);
      return 0;
    }
  }

  // Get user's favorite gig IDs (for quick checking)
  async getUserFavoriteGigIds(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data().gigId);
    } catch (error) {
      console.error('Error getting user favorite gig IDs:', error);
      return [];
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId, gigId) {
    try {
      const existingFavorite = await this.checkIfFavorite(userId, gigId);
      
      if (existingFavorite) {
        await this.removeFromFavorites(userId, gigId);
        return { isFavorite: false, action: 'removed' };
      } else {
        await this.addToFavorites(userId, gigId);
        return { isFavorite: true, action: 'added' };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Get popular gigs (most favorited)
  async getPopularGigs(options = {}) {
    try {
      const { limit: queryLimit = 10 } = options;

      // Get all favorites
      const favoritesQuery = query(collection(db, this.collectionName));
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      // Count favorites per gig
      const gigFavoriteCounts = {};
      favoritesSnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        gigFavoriteCounts[data.gigId] = (gigFavoriteCounts[data.gigId] || 0) + 1;
      });

      // Sort by favorite count and get top gigs
      const sortedGigs = Object.entries(gigFavoriteCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, queryLimit);

      // Get complete gig data
      const popularGigs = [];
      for (const [gigId, favoriteCount] of sortedGigs) {
        const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
        if (gigDoc.exists()) {
          const gigData = gigDoc.data();
          
          // Get freelancer data
          const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
          let freelancerData = null;
          if (freelancerDoc.exists()) {
            const userData = freelancerDoc.data();
            const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
            const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
            
            freelancerData = {
              id: gigData.userId,
              displayName: userData.displayName,
              profilePhoto: userData.profilePhoto,
              rating: profileData.rating || 0,
              totalReviews: profileData.totalReviews || 0
            };
          }

          popularGigs.push({
            id: gigId,
            ...gigData,
            favoriteCount,
            freelancer: freelancerData
          });
        }
      }

      return popularGigs;
    } catch (error) {
      console.error('Error getting popular gigs:', error);
      return [];
    }
  }

  // Get user's favorite statistics
  async getUserFavoriteStats(userId) {
    try {
      const favorites = await this.getUserFavorites(userId);
      
      const stats = {
        totalFavorites: favorites.length,
        categoryCounts: {},
        averagePrice: 0,
        totalValue: 0
      };

      let totalPrice = 0;
      favorites.forEach(favorite => {
        const gig = favorite.gig;
        
        // Count by category
        if (gig.category) {
          stats.categoryCounts[gig.category] = (stats.categoryCounts[gig.category] || 0) + 1;
        }
        
        // Calculate price statistics
        const basicPrice = gig.packages?.basic?.price || 0;
        totalPrice += basicPrice;
      });

      stats.totalValue = totalPrice;
      stats.averagePrice = favorites.length > 0 ? totalPrice / favorites.length : 0;

      return stats;
    } catch (error) {
      console.error('Error getting user favorite stats:', error);
      return {
        totalFavorites: 0,
        categoryCounts: {},
        averagePrice: 0,
        totalValue: 0
      };
    }
  }

  // Subscribe to user's favorites with real-time updates (provides complete gig data)
  subscribeToUserFavorites(userId, callback) {
    try {
      // Remove orderBy to avoid index requirements for now
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        try {
          const favorites = [];

          // Get complete gig data for each favorite
          for (const docSnapshot of querySnapshot.docs) {
            const favoriteData = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // Get gig data using reference
            const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, favoriteData.gigId));
            if (gigDoc.exists()) {
              const gigData = gigDoc.data();
              
              // Get freelancer data for the gig
              const freelancerDoc = await getDoc(doc(db, COLLECTIONS.USERS, gigData.userId));
              let freelancerData = null;
              if (freelancerDoc.exists()) {
                const userData = freelancerDoc.data();
                
                // Get freelancer profile for performance data
                const freelancerProfileDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, gigData.userId));
                const profileData = freelancerProfileDoc.exists() ? freelancerProfileDoc.data() : {};
                
                freelancerData = {
                  id: gigData.userId,
                  displayName: userData.displayName,
                  profilePhoto: userData.profilePhoto,
                  rating: profileData.rating || 0,
                  totalReviews: profileData.totalReviews || 0
                };
              }

              favorites.push({
                ...favoriteData,
                gig: {
                  id: favoriteData.gigId,
                  ...gigData,
                  freelancer: freelancerData
                }
              });
            }
          }

          // Sort favorites by createdAt in JavaScript instead of Firestore query
          favorites.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime; // Descending order (newest first)
          });

          callback(favorites);
        } catch (error) {
          console.error('Error processing favorites snapshot:', error);
          // Call callback with empty array on error to prevent app crash
          callback([]);
        }
      }, (error) => {
        console.error('Error in favorites subscription:', error);
        // Call callback with empty array on error to prevent app crash
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up favorites subscription:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }
}

export default new FavoriteService();