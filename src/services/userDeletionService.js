import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import firebaseService from './firebaseService';
import { deleteProfilePhoto } from './cloudinaryService';

/**
 * Comprehensive user account deletion service
 * Handles cascade deletion of all user-related data
 */
class UserDeletionService {
  /**
   * Delete user account and all associated data
   * @param {Object} user - Firebase Auth user object
   * @param {Object} userProfile - User profile data from Firestore
   * @returns {Promise<{success: boolean, deletedData: Array, errors: Array}>}
   */
  async deleteUserAccount(user, userProfile) {
    const deletedData = [];
    const errors = [];
    
    if (!user || !user.uid) {
      throw new Error('Valid user object is required');
    }

    console.log(`Starting deletion process for user: ${user.uid}`);

    try {
      // 1. Delete user profile photos from Cloudinary
      await this.deleteUserMedia(user.uid, userProfile, deletedData, errors);
      
      // 2. Delete user-generated content (gigs, orders, reviews, etc.)
      await this.deleteUserGeneratedContent(user.uid, deletedData, errors);
      
      // 3. Delete user profiles (client & freelancer)
      await this.deleteUserProfiles(user.uid, deletedData, errors);
      
      // 4. Delete main user document
      await this.deleteUserDocument(user.uid, deletedData, errors);
      
      // 5. Delete user from Firebase Auth (do this last)
      await this.deleteAuthUser(user, deletedData, errors);
      
      console.log('User deletion completed successfully', { deletedData, errors });
      
      return {
        success: true,
        deletedData,
        errors
      };
      
    } catch (error) {
      console.error('Critical error during user deletion:', error);
      errors.push({
        operation: 'deleteUserAccount',
        error: error.message
      });
      
      return {
        success: false,
        deletedData,
        errors
      };
    }
  }

  /**
   * Delete user media files (profile photos, portfolio images)
   */
  async deleteUserMedia(userId, userProfile, deletedData, errors) {
    try {
      // Delete profile photo from Cloudinary
      if (userProfile?.profilePhotoPublicId) {
        try {
          await deleteProfilePhoto(userProfile.profilePhotoPublicId);
          deletedData.push({
            type: 'cloudinary_image',
            id: userProfile.profilePhotoPublicId,
            collection: 'profile_photos'
          });
        } catch (error) {
          errors.push({
            operation: 'deleteProfilePhoto',
            error: error.message,
            publicId: userProfile.profilePhotoPublicId
          });
        }
      }
      
      // Delete portfolio images (if freelancer)
      if (userProfile?.portfolioImages && Array.isArray(userProfile.portfolioImages)) {
        for (const portfolioImage of userProfile.portfolioImages) {
          if (portfolioImage.publicId) {
            try {
              await deleteProfilePhoto(portfolioImage.publicId);
              deletedData.push({
                type: 'cloudinary_image',
                id: portfolioImage.publicId,
                collection: 'portfolio_images'
              });
            } catch (error) {
              errors.push({
                operation: 'deletePortfolioImage',
                error: error.message,
                publicId: portfolioImage.publicId
              });
            }
          }
        }
      }
      
    } catch (error) {
      errors.push({
        operation: 'deleteUserMedia',
        error: error.message
      });
    }
  }

  /**
   * Delete user-generated content across all collections
   */
  async deleteUserGeneratedContent(userId, deletedData, errors) {
    const contentCollections = [
      { name: COLLECTIONS.GIGS, field: 'freelancerId' },
      { name: COLLECTIONS.ORDERS, field: 'clientId' },
      { name: COLLECTIONS.ORDERS, field: 'freelancerId' },
      { name: COLLECTIONS.REVIEWS, field: 'userId' },
      { name: COLLECTIONS.REVIEWS, field: 'reviewerId' },
      { name: 'messages', field: 'senderId' },
      { name: 'messages', field: 'receiverId' },
      { name: 'favorites', field: 'userId' },
      { name: 'notifications', field: 'userId' },
      { name: 'reports', field: 'reporterId' },
      { name: 'reports', field: 'reportedUserId' }
    ];

    for (const collectionInfo of contentCollections) {
      try {
        await this.deleteFromCollection(
          collectionInfo.name, 
          collectionInfo.field, 
          userId, 
          deletedData, 
          errors
        );
      } catch (error) {
        errors.push({
          operation: `delete_${collectionInfo.name}_${collectionInfo.field}`,
          error: error.message
        });
      }
    }
  }

  /**
   * Delete user profiles (client and freelancer)
   */
  async deleteUserProfiles(userId, deletedData, errors) {
    const profileCollections = [
      COLLECTIONS.CLIENT_PROFILES,
      COLLECTIONS.FREELANCER_PROFILES
    ];

    for (const collection of profileCollections) {
      try {
        const docRef = doc(db, collection, userId);
        await deleteDoc(docRef);
        deletedData.push({
          type: 'document',
          id: userId,
          collection
        });
      } catch (error) {
        // Don't log error if document doesn't exist
        if (error.code !== 'not-found') {
          errors.push({
            operation: `delete_${collection}`,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Delete main user document
   */
  async deleteUserDocument(userId, deletedData, errors) {
    try {
      await firebaseService.deleteDocument(COLLECTIONS.USERS, userId);
      deletedData.push({
        type: 'document',
        id: userId,
        collection: COLLECTIONS.USERS
      });
    } catch (error) {
      errors.push({
        operation: 'deleteUserDocument',
        error: error.message
      });
    }
  }

  /**
   * Delete user from Firebase Auth
   */
  async deleteAuthUser(user, deletedData, errors) {
    try {
      await deleteUser(user);
      deletedData.push({
        type: 'auth_user',
        id: user.uid,
        collection: 'firebase_auth'
      });
    } catch (error) {
      errors.push({
        operation: 'deleteAuthUser',
        error: error.message
      });
      throw error; // Re-throw auth deletion errors as they're critical
    }
  }

  /**
   * Delete documents from a collection based on field matching userId
   */
  async deleteFromCollection(collectionName, fieldName, userId, deletedData, errors) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where(fieldName, '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return; // No documents to delete
      }

      // Use batch delete for efficiency
      const batch = writeBatch(db);
      
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      
      // Log successful deletions
      querySnapshot.forEach((docSnap) => {
        deletedData.push({
          type: 'document',
          id: docSnap.id,
          collection: collectionName,
          field: fieldName
        });
      });
      
    } catch (error) {
      // Collection might not exist, don't treat as error
      if (error.code !== 'not-found') {
        errors.push({
          operation: `deleteFromCollection_${collectionName}_${fieldName}`,
          error: error.message
        });
      }
    }
  }

  /**
   * Admin function to cleanup orphaned data
   * Use this to clean up data for users that might have been deleted from Auth but not from Firestore
   */
  async cleanupOrphanedData() {
    console.log('Starting orphaned data cleanup...');
    const deletedData = [];
    const errors = [];

    try {
      // Get all user IDs from Firestore
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const firestoreUserIds = new Set();
      
      usersSnapshot.forEach(doc => {
        firestoreUserIds.add(doc.id);
      });

      // Check each collection for orphaned data
      const collectionsToCheck = [
        COLLECTIONS.CLIENT_PROFILES,
        COLLECTIONS.FREELANCER_PROFILES,
        COLLECTIONS.GIGS,
        COLLECTIONS.ORDERS,
        COLLECTIONS.REVIEWS
      ];

      for (const collectionName of collectionsToCheck) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          const batch = writeBatch(db);
          let batchCount = 0;

          snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId || data.freelancerId || data.clientId;
            
            if (userId && !firestoreUserIds.has(userId)) {
              batch.delete(doc.ref);
              batchCount++;
              deletedData.push({
                type: 'orphaned_document',
                id: doc.id,
                collection: collectionName,
                orphanedUserId: userId
              });
            }
          });

          if (batchCount > 0) {
            await batch.commit();
            console.log(`Deleted ${batchCount} orphaned documents from ${collectionName}`);
          }
          
        } catch (error) {
          errors.push({
            operation: `cleanup_${collectionName}`,
            error: error.message
          });
        }
      }

      console.log('Orphaned data cleanup completed', { deletedData, errors });
      
      return {
        success: true,
        deletedData,
        errors
      };
      
    } catch (error) {
      console.error('Error during orphaned data cleanup:', error);
      return {
        success: false,
        deletedData,
        errors: [...errors, { operation: 'cleanupOrphanedData', error: error.message }]
      };
    }
  }
}

const userDeletionService = new UserDeletionService();
export default userDeletionService; 