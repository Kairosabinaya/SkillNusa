/**
 * Custom hook for fixing null profile photos in the database
 * Can be used by admin or triggered automatically
 */

import { useState, useCallback } from 'react';
import { batchFixNullProfilePhotos } from '../services/userProfileService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import { ensureDefaultProfilePhotoInDatabase, isValidProfilePhoto } from '../utils/profilePhotoUtils';

export const useProfilePhotoFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState({
    total: 0,
    processed: 0,
    fixed: 0,
    errors: 0
  });
  const [fixResult, setFixResult] = useState(null);

  /**
   * Get statistics about users with null profile photos
   */
  const getProfilePhotoStats = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      let totalUsers = 0;
      let usersWithValidPhotos = 0;
      let usersWithNullPhotos = 0;
      let usersWithDefaultPhotos = 0;
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        totalUsers++;
        
        if (isValidProfilePhoto(userData.profilePhoto)) {
          usersWithValidPhotos++;
          if (userData.profilePhoto === '/images/default-profile.jpg') {
            usersWithDefaultPhotos++;
          }
        } else {
          usersWithNullPhotos++;
        }
      });
      
      return {
        totalUsers,
        usersWithValidPhotos,
        usersWithNullPhotos,
        usersWithDefaultPhotos,
        needsFix: usersWithNullPhotos > 0
      };
    } catch (error) {
      console.error('Error getting profile photo stats:', error);
      throw error;
    }
  }, []);

  /**
   * Fix all users with null profile photos
   */
  const fixAllNullProfilePhotos = useCallback(async (batchSize = 50) => {
    setIsFixing(true);
    setFixProgress({ total: 0, processed: 0, fixed: 0, errors: 0 });
    setFixResult(null);

    try {
      console.log('🚀 [ProfilePhotoFixer] Starting comprehensive fix for all null profile photos...');
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const usersToFix = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (!isValidProfilePhoto(userData.profilePhoto)) {
          usersToFix.push({
            id: doc.id,
            currentPhoto: userData.profilePhoto,
            displayName: userData.displayName || userData.username || userData.email
          });
        }
      });
      
      const totalToFix = usersToFix.length;
      setFixProgress(prev => ({ ...prev, total: totalToFix }));
      
      if (totalToFix === 0) {
        console.log('✅ [ProfilePhotoFixer] No users found with null profile photos');
        setFixResult({
          success: true,
          message: 'All users already have valid profile photos!',
          totalProcessed: 0,
          totalFixed: 0,
          errors: []
        });
        return;
      }
      
      console.log(`🔧 [ProfilePhotoFixer] Found ${totalToFix} users with null profile photos`);
      
      let fixedCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Process in batches
      for (let i = 0; i < usersToFix.length; i += batchSize) {
        const batch = usersToFix.slice(i, i + batchSize);
        
        console.log(`🔧 [ProfilePhotoFixer] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(usersToFix.length/batchSize)} (${batch.length} users)`);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (user) => {
          try {
            const success = await ensureDefaultProfilePhotoInDatabase(user.id, true);
            if (success) {
              fixedCount++;
              console.log(`✅ Fixed profile photo for: ${user.displayName} (${user.id})`);
            } else {
              errorCount++;
              console.warn(`❌ Failed to fix profile photo for: ${user.displayName} (${user.id})`);
            }
            return { success, userId: user.id, displayName: user.displayName };
          } catch (error) {
            errorCount++;
            const errorMsg = `Error fixing ${user.displayName} (${user.id}): ${error.message}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            return { success: false, userId: user.id, displayName: user.displayName, error: error.message };
          }
        });
        
        await Promise.all(batchPromises);
        
        // Update progress
        const processed = Math.min(i + batchSize, usersToFix.length);
        setFixProgress(prev => ({
          ...prev,
          processed,
          fixed: fixedCount,
          errors: errorCount
        }));
        
        // Small delay between batches to avoid overwhelming Firebase
        if (i + batchSize < usersToFix.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const result = {
        success: true,
        message: `Profile photo fix completed! Fixed ${fixedCount}/${totalToFix} users`,
        totalProcessed: totalToFix,
        totalFixed: fixedCount,
        errors: errors.slice(0, 10) // Limit error list
      };
      
      console.log(`✅ [ProfilePhotoFixer] Comprehensive fix completed:`, result);
      setFixResult(result);
      
    } catch (error) {
      console.error('❌ [ProfilePhotoFixer] Error during comprehensive fix:', error);
      setFixResult({
        success: false,
        message: `Error during fix: ${error.message}`,
        totalProcessed: 0,
        totalFixed: 0,
        errors: [error.message]
      });
    } finally {
      setIsFixing(false);
    }
  }, []);

  /**
   * Fix a single user's profile photo
   */
  const fixSingleUser = useCallback(async (userId) => {
    try {
      return await ensureDefaultProfilePhotoInDatabase(userId, true);
    } catch (error) {
      console.error(`Error fixing profile photo for user ${userId}:`, error);
      return false;
    }
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setFixProgress({ total: 0, processed: 0, fixed: 0, errors: 0 });
    setFixResult(null);
  }, []);

  return {
    // State
    isFixing,
    fixProgress,
    fixResult,
    
    // Actions
    getProfilePhotoStats,
    fixAllNullProfilePhotos,
    fixSingleUser,
    reset
  };
};

export default useProfilePhotoFixer; 