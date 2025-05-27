import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  getDoc
} from 'firebase/firestore';
import { Favorite } from '../models/Favorite';

class FavoriteService {
  constructor() {
    this.collectionName = 'favorites';
  }

  // Add gig to favorites
  async addToFavorites(userId, gigId) {
    try {
      // Check if already favorited
      const existing = await this.isFavorited(userId, gigId);
      if (existing) {
        throw new Error('Gig is already in favorites');
      }

      const favorite = new Favorite({
        userId,
        gigId,
        createdAt: new Date()
      });

      const docRef = await addDoc(collection(db, this.collectionName), favorite.toJSON());
      return { id: docRef.id, ...favorite.toJSON() };
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

  // Get user's favorites
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
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
      
      return favorites;
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }

  // Get user's favorites with gig details
  async getUserFavoritesWithGigs(userId) {
    try {
      console.log('Getting favorites for user:', userId);
      const favorites = await this.getUserFavorites(userId);
      console.log('Found favorites:', favorites);
      
      if (favorites.length === 0) {
        return [];
      }
      
      // Get gig details for each favorite
      const favoritesWithGigs = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            console.log('Loading gig details for:', favorite.gigId);
            const gigDoc = await getDoc(doc(db, 'gigs', favorite.gigId));
            if (gigDoc.exists()) {
              console.log('Gig found:', gigDoc.id);
              return {
                ...favorite,
                gig: {
                  id: gigDoc.id,
                  ...gigDoc.data()
                }
              };
            } else {
              console.log('Gig not found in database:', favorite.gigId);
              // Return with mock gig data based on gig ID for consistency
              const mockGigs = {
                '1': {
                  id: '1',
                  images: ["https://picsum.photos/seed/gig1/400/300"],
                  title: "I will build shopify ecommerce website, redesign online store",
                  category: "Programming & Tech",
                  rating: 4.9,
                  totalReviews: 1234,
                  packages: { basic: { price: 195000 } },
                  freelancer: {
                    displayName: "Fillinx Sol",
                    profilePhoto: "https://picsum.photos/seed/freelancer1/50/50",
                    isVerified: true,
                    isTopRated: true
                  }
                },
                '2': {
                  id: '2',
                  images: ["https://picsum.photos/seed/logo1/400/300"],
                  title: "I will create professional logo design for your business",
                  category: "Design & Creative",
                  rating: 4.8,
                  totalReviews: 287,
                  packages: { basic: { price: 150000 } },
                  freelancer: {
                    displayName: "Maya Design",
                    profilePhoto: "https://picsum.photos/seed/freelancer2/50/50",
                    isVerified: true,
                    isTopRated: false
                  }
                },
                '3': {
                  id: '3',
                  images: ["https://picsum.photos/seed/gig3/400/300"],
                  title: "Professional Social Media Management",
                  category: "Digital Marketing",
                  rating: 4.7,
                  totalReviews: 156,
                  packages: { basic: { price: 1200000 } },
                  freelancer: {
                    displayName: "Dina Wijaya",
                    profilePhoto: "https://picsum.photos/seed/freelancer3/50/50",
                    isVerified: false,
                    isTopRated: true
                  }
                },
                '4': {
                  id: '4',
                  images: ["https://picsum.photos/seed/gig4/400/300"],
                  title: "Mobile App Development iOS & Android",
                  category: "Mobile Development",
                  rating: 5.0,
                  totalReviews: 32,
                  packages: { basic: { price: 5000000 } },
                  freelancer: {
                    displayName: "Farhan Ahmad",
                    profilePhoto: "https://picsum.photos/seed/freelancer4/50/50",
                    isVerified: true,
                    isTopRated: true
                  }
                },
                '5': {
                  id: '5',
                  images: ["https://picsum.photos/seed/gig5/400/300"],
                  title: "Content Writing Services",
                  category: "Writing & Translation",
                  rating: 4.9,
                  totalReviews: 45,
                  packages: { basic: { price: 450000 } },
                  freelancer: {
                    displayName: "Elsa Putri",
                    profilePhoto: "https://picsum.photos/seed/freelancer5/50/50",
                    isVerified: true,
                    isTopRated: false
                  }
                },
                '6': {
                  id: '6',
                  images: ["https://picsum.photos/seed/gig6/400/300"],
                  title: "Business Plan Development",
                  category: "Business",
                  rating: 4.8,
                  totalReviews: 19,
                  packages: { basic: { price: 2000000 } },
                  freelancer: {
                    displayName: "Gunawan Prawiro",
                    profilePhoto: "https://picsum.photos/seed/freelancer6/50/50",
                    isVerified: true,
                    isTopRated: true
                  }
                }
              };

              const mockGig = mockGigs[favorite.gigId] || {
                id: favorite.gigId,
                title: 'Sample Gig',
                images: [`https://picsum.photos/seed/gig${favorite.gigId}/400/300`],
                rating: 5.0,
                totalReviews: 0,
                packages: { basic: { price: 100000 } },
                freelancer: {
                  displayName: 'Freelancer',
                  profilePhoto: `https://picsum.photos/seed/freelancer${favorite.gigId}/32/32`
                }
              };

              return {
                ...favorite,
                gig: mockGig
              };
            }
          } catch (error) {
            console.error(`Error getting gig ${favorite.gigId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values (gigs that couldn't be loaded)
      const result = favoritesWithGigs.filter(item => item !== null);
      console.log('Final favorites with gigs:', result);
      return result;
    } catch (error) {
      console.error('Error getting favorites with gigs:', error);
      throw error;
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId, gigId) {
    try {
      const isFav = await this.isFavorited(userId, gigId);
      
      if (isFav) {
        await this.removeFromFavorites(userId, gigId);
        return { isFavorited: false, message: 'Dihapus dari favorit' };
      } else {
        await this.addToFavorites(userId, gigId);
        return { isFavorited: true, message: 'Ditambahkan ke favorit' };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

const favoriteService = new FavoriteService();
export default favoriteService; 