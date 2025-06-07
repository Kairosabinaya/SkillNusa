import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  getDoc,
  onSnapshot,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { Favorite } from '../models/Favorite';

class FavoriteService {
  constructor() {
    this.collectionName = 'favorites';
  }

  // Add gig to favorites with enhanced data
  async addToFavorites(userId, gigId) {
    try {
      // Check if already favorited
      const existing = await this.isFavorited(userId, gigId);
      if (existing) {
        throw new Error('Gig is already in favorites');
      }

      // Get gig details for denormalization
      const gigDoc = await getDoc(doc(db, 'gigs', gigId));
      if (!gigDoc.exists()) {
        throw new Error('Gig not found');
      }

      const gigData = gigDoc.data();
      
      // Get freelancer details
      let freelancerData = null;
      if (gigData.freelancerId) {
        const freelancerDoc = await getDoc(doc(db, 'users', gigData.freelancerId));
        if (freelancerDoc.exists()) {
          freelancerData = {
            id: freelancerDoc.id,
            displayName: freelancerDoc.data().displayName,
            profilePhoto: freelancerDoc.data().profilePhoto
          };
        }
      }

      const favorite = {
        userId,
        gigId,
        // Denormalized data for quick access - handle undefined values
        gigData: {
          title: gigData.title || 'Untitled Gig',
          images: gigData.images || [],
          rating: gigData.rating || 0,
          totalReviews: gigData.totalReviews || 0, // Default to 0 if undefined
          packages: gigData.packages || {},
          category: gigData.category || 'Other'
        },
        freelancerData: freelancerData || {
          displayName: 'Freelancer',
          profilePhoto: null
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), favorite);
      
      // Return with generated ID
      return { 
        id: docRef.id, 
        ...favorite,
        createdAt: new Date() // Convert for immediate use
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove gig from favorites
  async removeFromFavorites(userId, gigId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('gigId', '==', gigId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Favorite not found');
      }

      // Delete the favorite document
      const favoriteDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, this.collectionName, favoriteDoc.id));
      
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Check if gig is favorited by user
  async isFavorited(userId, gigId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('gigId', '==', gigId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // Get user's favorites with real-time updates
  subscribeToUserFavorites(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const favorites = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          favorites.push({
            id: doc.id,
            ...data
          });
        });

        // Sort by createdAt in JavaScript instead of Firestore
        favorites.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime - aTime; // desc order
        });
        
        callback(favorites);
      }, (error) => {
        console.error('Error in favorites subscription:', error);
        callback([]);
      });
      
      // Return enhanced unsubscribe function that tracks cleanup
      return () => {

        unsubscribe();
      };
    } catch (error) {
      console.error('💥 [FavoriteService] Error subscribing to favorites:', error);
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Get user's favorites (one-time fetch)
  async getUserFavorites(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const favorites = [];
      
      querySnapshot.forEach((doc) => {
        favorites.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by createdAt in JavaScript instead of Firestore
      favorites.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bTime - aTime; // desc order
      });
      
      return favorites;
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }

  // Get user's favorites with fresh gig details (for cases where denormalized data might be stale)
  async getUserFavoritesWithFreshGigs(userId) {
    try {
      const favorites = await this.getUserFavorites(userId);
      
      if (favorites.length === 0) {
        return [];
      }
      
      // Get fresh gig details for each favorite
      const favoritesWithFreshGigs = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            const gigDoc = await getDoc(doc(db, 'gigs', favorite.gigId));
            
            if (gigDoc.exists()) {
              const gigData = gigDoc.data();
              
              // Get fresh freelancer details
              let freelancerData = null;
              if (gigData.freelancerId) {
                const freelancerDoc = await getDoc(doc(db, 'users', gigData.freelancerId));
                if (freelancerDoc.exists()) {
                  freelancerData = {
                    id: freelancerDoc.id,
                    displayName: freelancerDoc.data().displayName,
                    profilePhoto: freelancerDoc.data().profilePhoto,
                    isTopRated: freelancerDoc.data().isTopRated || false,
                    isVerified: freelancerDoc.data().isVerified || false
                  };
                }
              }

              return {
                ...favorite,
                gig: {
                  id: gigDoc.id,
                  ...gigData,
                  freelancer: freelancerData || {
                    displayName: 'Freelancer',
                    profilePhoto: null,
                    isTopRated: false,
                    isVerified: false
                  }
                }
              };
            } else {
              // Gig no longer exists, but keep the favorite with denormalized data
              return {
                ...favorite,
                gig: {
                  id: favorite.gigId,
                  ...favorite.gigData,
                  freelancer: favorite.freelancerData,
                  isDeleted: true
                }
              };
            }
          } catch (error) {
            console.error(`Error getting fresh gig ${favorite.gigId}:`, error);
            // Fall back to denormalized data
            return {
              ...favorite,
              gig: {
                id: favorite.gigId,
                ...favorite.gigData,
                freelancer: favorite.freelancerData
              }
            };
          }
        })
      );
      
      return favoritesWithFreshGigs;
    } catch (error) {
      console.error('Error getting favorites with fresh gigs:', error);
      throw error;
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId, gigId) {
    try {
      const isFav = await this.isFavorited(userId, gigId);
      
      let result;
      if (isFav) {
        await this.removeFromFavorites(userId, gigId);
        result = { isFavorited: false, message: 'Dihapus dari favorit' };
      } else {
        await this.addToFavorites(userId, gigId);
        result = { isFavorited: true, message: 'Ditambahkan ke favorit' };
      }
      
      return result;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Get favorites count for user
  async getFavoritesCount(userId) {
    try {
      const favorites = await this.getUserFavorites(userId);
      return favorites.length;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }

  // Real-time subscription to favorites count
  subscribeToFavoritesCount(userId, callback) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        console.log('Real-time favorites count update:', count);
        callback(count);
      }, (error) => {
        console.error('Error in favorites count subscription:', error);
        callback(0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up favorites count subscription:', error);
      callback(0);
      return null;
    }
  }
}

const favoriteService = new FavoriteService();
export default favoriteService;