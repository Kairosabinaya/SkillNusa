import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch,
  where,
  getDoc
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import firebaseService from './firebaseService';
import userDeletionService from './userDeletionService';
import { deleteProfilePhoto } from './cloudinaryService';

/**
 * Admin service for managing users and gigs
 * Provides comprehensive CRUD operations with cascade deletion
 */
class AdminService {
  
  /**
   * Get all users with pagination
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers(options = {}) {
    try {
      const { limit = 50, orderField = 'createdAt', orderDirection = 'desc' } = options;
      
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        orderBy(orderField, orderDirection)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = [];
      
      for (const doc of snapshot.docs) {
        const userData = { id: doc.id, ...doc.data() };
        
        // Get additional profile data
        const clientProfile = await this.getClientProfile(doc.id);
        const freelancerProfile = await this.getFreelancerProfile(doc.id);
        
        users.push({
          ...userData,
          clientProfile,
          freelancerProfile,
          userType: userData.isFreelancer ? 'freelancer' : 'client',
          accountStatus: userData.isActive ? 'active' : 'inactive'
        });
      }
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get client profile for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Client profile or null
   */
  async getClientProfile(userId) {
    try {
      const docRef = doc(db, COLLECTIONS.CLIENT_PROFILES, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get freelancer profile for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Freelancer profile or null
   */
  async getFreelancerProfile(userId) {
    try {
      const docRef = doc(db, COLLECTIONS.FREELANCER_PROFILES, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all gigs with pagination
   * @param {Object} options - Pagination and filtering options
   * @returns {Promise<Array>} Array of gigs
   */
  async getAllGigs(options = {}) {
    try {
      const { limit = 50, orderField = 'createdAt', orderDirection = 'desc' } = options;
      
      const gigsQuery = query(
        collection(db, COLLECTIONS.GIGS),
        orderBy(orderField, orderDirection)
      );
      
      const snapshot = await getDocs(gigsQuery);
      const gigs = [];
      
      for (const gigDoc of snapshot.docs) {
        const gigData = { id: gigDoc.id, ...gigDoc.data() };
        
        // Get freelancer information
        const freelancerId = gigData.freelancerId || gigData.userId;
        if (freelancerId) {
          const freelancerData = await this.getUserById(freelancerId);
          gigData.freelancer = freelancerData;
        }
        
        // Get review count and average rating
        const reviewsQuery = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('gigId', '==', gigDoc.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        
        gigData.reviewCount = reviews.length;
        gigData.averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;
        
        gigs.push(gigData);
      }
      
      return gigs;
    } catch (error) {
      console.error('Error getting all gigs:', error);
      throw new Error('Failed to fetch gigs');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete user account with cascade deletion
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUser(userId) {
    try {
      // Get user data first
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Create a mock auth user object for the deletion service
      const mockAuthUser = {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName
      };
      
      // Use the existing user deletion service for cascade deletion
      const deletionResult = await userDeletionService.deleteUserAccount(mockAuthUser, userData);
      
      return {
        success: true,
        message: 'User account deleted successfully',
        deletedData: deletionResult.deletedData,
        errors: deletionResult.errors
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Delete gig with cascade deletion
   * @param {string} gigId - Gig ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteGig(gigId) {
    try {
      const deletedData = [];
      const errors = [];
      
      // Get gig data first
      const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
      if (!gigDoc.exists()) {
        throw new Error('Gig not found');
      }
      
      const gigData = gigDoc.data();
      
      // Create a batch for atomic operations
      const batch = writeBatch(db);
      
      // 1. Delete gig images from Cloudinary
      if (gigData.images && Array.isArray(gigData.images)) {
        for (const image of gigData.images) {
          if (image.publicId) {
            try {
              await deleteProfilePhoto(image.publicId);
              deletedData.push({
                type: 'cloudinary_image',
                id: image.publicId,
                collection: 'gig_images'
              });
            } catch (error) {
              errors.push({
                operation: 'deleteGigImage',
                error: error.message,
                publicId: image.publicId
              });
            }
          }
        }
      }
      
      // 2. Delete related reviews
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('gigId', '==', gigId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      for (const reviewDoc of reviewsSnapshot.docs) {
        batch.delete(doc(db, COLLECTIONS.REVIEWS, reviewDoc.id));
        deletedData.push({
          type: 'document',
          id: reviewDoc.id,
          collection: COLLECTIONS.REVIEWS
        });
      }
      
      // 3. Delete related orders
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('gigId', '==', gigId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      for (const orderDoc of ordersSnapshot.docs) {
        batch.delete(doc(db, COLLECTIONS.ORDERS, orderDoc.id));
        deletedData.push({
          type: 'document',
          id: orderDoc.id,
          collection: COLLECTIONS.ORDERS
        });
      }
      
      // 4. Delete related favorites
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('gigId', '==', gigId)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      for (const favoriteDoc of favoritesSnapshot.docs) {
        batch.delete(doc(db, 'favorites', favoriteDoc.id));
        deletedData.push({
          type: 'document',
          id: favoriteDoc.id,
          collection: 'favorites'
        });
      }
      
      // 5. Delete related cart items
      const cartQuery = query(
        collection(db, 'cart_items'),
        where('gigId', '==', gigId)
      );
      const cartSnapshot = await getDocs(cartQuery);
      
      for (const cartDoc of cartSnapshot.docs) {
        batch.delete(doc(db, 'cart_items', cartDoc.id));
        deletedData.push({
          type: 'document',
          id: cartDoc.id,
          collection: 'cart_items'
        });
      }
      
      // 6. Delete the main gig document
      batch.delete(doc(db, COLLECTIONS.GIGS, gigId));
      deletedData.push({
        type: 'document',
        id: gigId,
        collection: COLLECTIONS.GIGS
      });
      
      // Commit the batch
      await batch.commit();
      
      return {
        success: true,
        message: 'Gig deleted successfully with all related data',
        deletedData,
        errors
      };
    } catch (error) {
      console.error('Error deleting gig:', error);
      throw new Error(`Failed to delete gig: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const totalUsers = usersSnapshot.size;
      
      // Get total freelancers
      const freelancersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('isFreelancer', '==', true)
      );
      const freelancersSnapshot = await getDocs(freelancersQuery);
      const totalFreelancers = freelancersSnapshot.size;
      
      // Get total clients
      const totalClients = totalUsers - totalFreelancers;
      
      // Get total gigs
      const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
      const totalGigs = gigsSnapshot.size;
      
      // Get active gigs
      const activeGigsQuery = query(
        collection(db, COLLECTIONS.GIGS),
        where('isActive', '==', true)
      );
      const activeGigsSnapshot = await getDocs(activeGigsQuery);
      const activeGigs = activeGigsSnapshot.size;
      
      // Get total orders
      const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
      const totalOrders = ordersSnapshot.size;
      
      // Get total reviews
      const reviewsSnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWS));
      const totalReviews = reviewsSnapshot.size;
      
      return {
        totalUsers,
        totalFreelancers,
        totalClients,
        totalGigs,
        activeGigs,
        inactiveGigs: totalGigs - activeGigs,
        totalOrders,
        totalReviews
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Search users by email or username
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      const users = await this.getAllUsers();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return users.filter(user => 
        user.email.toLowerCase().includes(lowercaseSearch) ||
        user.username.toLowerCase().includes(lowercaseSearch) ||
        user.displayName.toLowerCase().includes(lowercaseSearch) ||
        user.fullName?.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Search gigs by title or description
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching gigs
   */
  async searchGigs(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      const gigs = await this.getAllGigs();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return gigs.filter(gig => 
        gig.title.toLowerCase().includes(lowercaseSearch) ||
        gig.description.toLowerCase().includes(lowercaseSearch) ||
        gig.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching gigs:', error);
      throw new Error('Failed to search gigs');
    }
  }
}

const adminService = new AdminService();
export default adminService; 