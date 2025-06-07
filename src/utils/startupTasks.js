/**
 * Startup tasks that run when the application initializes
 * Includes auto-fixing of null profile photos and other maintenance tasks
 */

import React, { useState, useEffect } from 'react';
import { ensureDefaultProfilePhotoInDatabase, isValidProfilePhoto } from './profilePhotoUtils';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from './constants';

/**
 * Configuration for startup tasks
 */
const STARTUP_CONFIG = {
  // Auto-fix profile photos on startup
  AUTO_FIX_PROFILE_PHOTOS: true,
  
  // Maximum users to check/fix on each startup (to avoid overwhelming Firebase)
  MAX_USERS_PER_STARTUP: 100,
  
  // Delay between startup tasks (in milliseconds)
  TASK_DELAY: 1000
};

/**
 * Check and auto-fix null profile photos for a limited number of users
 * This runs in the background and doesn't block app startup
 */
export const autoFixProfilePhotos = async () => {
  if (!STARTUP_CONFIG.AUTO_FIX_PROFILE_PHOTOS) {
    return;
  }

  try {
    // Get a limited sample of users to check
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      limit(STARTUP_CONFIG.MAX_USERS_PER_STARTUP)
    );
    
    const snapshot = await getDocs(usersQuery);
    const usersToCheck = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      if (!isValidProfilePhoto(userData.profilePhoto)) {
        usersToCheck.push({
          id: doc.id,
          displayName: userData.displayName || userData.username || userData.email,
          currentPhoto: userData.profilePhoto
        });
      }
    });
    
    if (usersToCheck.length === 0) {
      return;
    }
    
    // Fix them asynchronously without blocking
    let fixedCount = 0;
    const promises = usersToCheck.map(async (user) => {
      try {
        const success = await ensureDefaultProfilePhotoInDatabase(user.id);
        if (success) {
          fixedCount++;
        }
      } catch (error) {
        // Silent error handling
      }
    });
    
    // Wait for all fixes to complete
    await Promise.allSettled(promises);
    
  } catch (error) {
    // Silent error handling
  }
};

/**
 * Run all startup tasks
 * This function is called when the app initializes
 */
export const runStartupTasks = async () => {
  try {
    // Task 1: Auto-fix profile photos (runs in background)
    setTimeout(() => {
      autoFixProfilePhotos().catch(error => {
        // Silent error handling
      });
    }, STARTUP_CONFIG.TASK_DELAY);
    
    // Add more startup tasks here as needed
    // Task 2: Clean up expired sessions
    // Task 3: Update user statistics
    // etc.
    
  } catch (error) {
    // Silent error handling
  }
};

/**
 * Hook to run startup tasks in React components
 */
export const useStartupTasks = () => {
  const [tasksCompleted, setTasksCompleted] = useState(false);
  
  useEffect(() => {
    runStartupTasks().finally(() => {
      setTasksCompleted(true);
    });
  }, []);
  
  return { tasksCompleted };
};

export default {
  runStartupTasks,
  autoFixProfilePhotos,
  useStartupTasks,
  STARTUP_CONFIG
}; 