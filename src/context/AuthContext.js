import { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import firebaseService from '../services/firebaseService';
import { getUserProfile } from '../services/userProfileService';
import { COLLECTIONS, USER_ROLES } from '../utils/constants';
import { DEFAULT_PROFILE_PHOTO } from '../utils/profilePhotoUtils';
import Logger from '../utils/logger';
import { AuthError, ValidationError, ErrorHandler } from '../utils/errors';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState(USER_ROLES.CLIENT);
  const [availableRoles, setAvailableRoles] = useState([USER_ROLES.CLIENT]);

  const createUserDocument = async (userId, userData) => {
    try {
      Logger.operationStart('createUserDocument', { userId });
      
      // Ensure profile photo is never null - always set to default if not provided
      const profilePhotoToSave = userData.profilePhoto && 
                                userData.profilePhoto !== null && 
                                userData.profilePhoto !== '' && 
                                userData.profilePhoto !== 'null' 
        ? userData.profilePhoto 
        : DEFAULT_PROFILE_PHOTO;

      console.log(`🖼️ [AuthContext] createUserDocument - Setting profile photo for ${userId}:`, {
        provided: userData.profilePhoto,
        saving: profilePhotoToSave
      });
      
      // Add multi-role fields if not provided - only include the 15 required fields
      const multiRoleData = {
        uid: userData.uid || userId,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber || '',
        gender: userData.gender || '',
        dateOfBirth: userData.dateOfBirth || '',
        location: userData.location || '',
        roles: userData.roles || [USER_ROLES.CLIENT],
        isFreelancer: userData.isFreelancer || false,
        hasInteractedWithSkillBot: userData.hasInteractedWithSkillBot || false,
        profilePhoto: profilePhotoToSave, // Always ensure this is never null
        emailVerified: userData.emailVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const result = await firebaseService.setDocument(COLLECTIONS.USERS, userId, multiRoleData);
      Logger.operationSuccess('createUserDocument', result);
      return result;
    } catch (error) {
      Logger.operationFailed('createUserDocument', error);
      const errorResult = ErrorHandler.handleServiceError(error, 'createUserDocument');
      setError(errorResult.error.message);
      throw error;
    }
  };

  const createProfileDocument = async (userId) => {
    try {
      // Create client profile with only the 4 required fields
      return await firebaseService.setDocument(COLLECTIONS.CLIENT_PROFILES, userId, {
        userID: userId,
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signup = async (email, password, username, role) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = result;
      
      // Ensure profile photo is always set to default, never null
      const profilePhotoToSave = DEFAULT_PROFILE_PHOTO;
      
      console.log(`🖼️ [AuthContext] Creating user ${user.uid} with default profile photo: ${profilePhotoToSave}`);
      
      // Create user profile in Firestore with only the 15 required fields
      await createUserDocument(user.uid, {
        uid: user.uid,
        email,
        username,
        displayName: username,
        phoneNumber: '',
        gender: '',
        dateOfBirth: '',
        location: '',
        roles: [role],
        isFreelancer: role === USER_ROLES.FREELANCER,
        hasInteractedWithSkillBot: false,
        profilePhoto: profilePhotoToSave, // Always set default, never null
        emailVerified: user.emailVerified
      });
      
      // Create profile document (client profile with only 4 fields)
      await createProfileDocument(user.uid);
      
      // If user is a freelancer (in admin flow), create freelancer profile too
      if (role === USER_ROLES.FREELANCER) {
        await firebaseService.setDocument(COLLECTIONS.FREELANCER_PROFILES, user.uid, {
          userId: user.uid,
          skills: [],
          experienceLevel: '',
          bio: '',
          portfolioLinks: [],
          hourlyRate: 0,
          availability: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Update auth profile
      await updateProfile(user, { displayName: username });
      
      // Send verification email with custom settings
      const actionCodeSettings = {
        url: `${window.location.origin}/auth-action?continueUrl=${encodeURIComponent(window.location.origin + '/login')}`,
        handleCodeInApp: true
      };
      
      console.log('📧 [AuthContext] Attempting to send email verification to:', user.email);
      console.log('🔐 [AuthContext] User authenticated:', !!user);
      console.log('📍 [AuthContext] Action URL:', actionCodeSettings.url);
      
      try {
        await sendEmailVerification(user, actionCodeSettings);
        console.log('✅ [AuthContext] Email verification sent successfully to:', user.email);
      } catch (emailError) {
        console.error('❌ [AuthContext] Email verification failed:', emailError);
        console.error('Email error code:', emailError.code);
        console.error('Email error message:', emailError.message);
        
        // Don't throw the error here - registration should still complete
        // but log it for debugging
        Logger.operationFailed('sendEmailVerification', emailError);
      }
      
      console.log(`✅ [AuthContext] User signup completed successfully for ${user.uid}`);
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const login = async (emailOrUsername, password) => {
    setError(null);
    try {
      let email = emailOrUsername;
      
      // Check if input is a username or email
      const isEmail = emailOrUsername.includes('@');
      
      // If it's a username, fetch the corresponding email
      if (!isEmail) {
        // Get the user with this username
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, where('username', '==', emailOrUsername.toLowerCase()));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          throw new Error('auth/user-not-found');
        }
        
        // Get the email from the user document
        const userData = snapshot.docs[0].data();
        email = userData.email;
        
        if (!email) {
          throw new Error('auth/invalid-credential');
        }
      }
      
      // Now sign in with the email
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!result.user.emailVerified) {
        // Sign out the user immediately
        await signOut(auth);
        throw new Error('email-not-verified');
      }
      
      return result;
    } catch (error) {
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.message === 'auth/user-not-found') {
        setError('Username atau email tidak ditemukan');
      } else if (error.code === 'auth/wrong-password') {
        setError('Password yang Anda masukkan salah');
      } else if (error.code === 'auth/invalid-credential' || error.message === 'auth/invalid-credential') {
        setError('Kredensial login tidak valid');
      } else if (error.message === 'email-not-verified') {
        setError('Email belum diverifikasi. Silakan cek inbox email Anda untuk link verifikasi');
      } else {
        setError('Gagal login. Silakan coba lagi.');
      }
      
      throw error;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      // Clean up notification subscriptions before logout
      if (currentUser) {
        console.log('🧹 [AuthContext] Cleaning up subscriptions before logout');
        
        // Import notification service and clean up subscriptions
        const { default: notificationService } = await import('../services/notificationService');
        notificationService.cleanup(currentUser.uid);
        
        // Dispatch cleanup event for other services
        window.dispatchEvent(new CustomEvent('forceCleanupSubscriptions', {
          detail: { userId: currentUser.uid, reason: 'logout' }
        }));
      }
      
      // Clear all form data from localStorage
      localStorage.removeItem('skillnusa_register_form');
      
      // Also clear any other app-related data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('skillnusa_')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove keys in a separate loop to avoid index shifting issues
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    setError(null);
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const fetchUserProfile = async (user = null) => {
    const targetUser = user || currentUser;
    if (!targetUser) return null;
    
    try {
      console.log('AuthContext DEBUG: fetchUserProfile starting for user:', targetUser.uid);
      const userData = await getUserProfile(targetUser.uid);
      
      if (userData) {
        console.log('AuthContext DEBUG: userData loaded successfully');
        console.log('AuthContext DEBUG: userData.isFreelancer:', userData.isFreelancer);
        console.log('AuthContext DEBUG: userData.activeRole:', userData.activeRole);
        
        // Set active role and available roles for the multi-role architecture
        if (userData.roles && userData.roles.length > 0) {
          setAvailableRoles(userData.roles);
          setActiveRole(userData.activeRole || userData.roles[0]);
        }
        
        setUserProfile(userData);
        console.log('AuthContext DEBUG: userProfile state updated');
        return userData;
      } else {
        console.log('AuthContext DEBUG: userData is null/undefined');
      }
      return null;
    } catch (error) {
      console.error('AuthContext DEBUG: Error in fetchUserProfile:', error);
      setError(error.message);
      return null;
    }
  };
  
  /**
   * Switch between available roles
   * @param {string} role - Role to switch to
   * @returns {Promise<boolean>} - True if switch was successful
   */
  const switchRole = async (role) => {
    setError(null);
    
    if (!currentUser) {
      setError('User not authenticated');
      return false;
    }
    
    if (!availableRoles.includes(role)) {
      setError(`Role ${role} is not available for this user`);
      return false;
    }
    
    try {
      // Update the activeRole in Firestore
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userRef, {
        activeRole: role,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setActiveRole(role);
      
      // Update userProfile state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          activeRole: role
        });
      }
      
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };
  
  /**
   * Refresh user data from Firestore
   * @returns {Promise<object|null>} - Updated user profile or null
   */
  const refreshUserData = async () => {
    return await fetchUserProfile();
  };

  /**
   * Manually sync emailVerified status from Firebase Auth to Firestore
   * Useful to call after email verification
   * @returns {Promise<boolean>} - True if sync was successful
   */
  const syncEmailVerifiedStatus = async () => {
    if (!currentUser) {
      console.warn('AuthContext: No current user to sync emailVerified status');
      return false;
    }

    try {
      // Reload user from Firebase Auth to get latest emailVerified status
      await currentUser.reload();
      
      // Get current user data from Firestore using currentUser directly
      const userData = await getUserProfile(currentUser.uid);
      
      if (userData && userData.emailVerified !== currentUser.emailVerified) {
        // Update Firestore with current emailVerified status from Auth
        const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
        await updateDoc(userRef, {
          emailVerified: currentUser.emailVerified,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          emailVerified: currentUser.emailVerified
        }));
        
        console.log(`AuthContext: emailVerified manually synced to ${currentUser.emailVerified}`);
        return true;
      }
      
      return false; // No sync needed
    } catch (error) {
      console.error('AuthContext: Failed to manually sync emailVerified status:', error);
      return false;
    }
  };

  /**
   * Re-authenticate user with their current password
   * @param {string} password - User's current password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  const reauthenticateUser = async (password) => {
    setError(null);
    
    if (!currentUser) {
      setError('No authenticated user found');
      return { success: false, message: 'No authenticated user found' };
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      return { success: true, message: 'Re-authentication successful' };
    } catch (error) {
      let errorMessage = 'Re-authentication failed';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Password salah. Silakan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun Anda telah dinonaktifkan.';
          break;
        default:
          errorMessage = error.message || 'Gagal memverifikasi identitas';
      }
      
      setError(errorMessage);
      console.error('AuthContext: Re-authentication error:', error);
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Clean up all active subscriptions before account deletion
   * @returns {Promise<void>}
   */
  const cleanupSubscriptions = async () => {
    try {
      console.log('🧹 [AuthContext] Starting subscription cleanup before account deletion');
      
      // Dispatch a custom event to notify SubscriptionContext to clean up
      window.dispatchEvent(new CustomEvent('forceCleanupSubscriptions', {
        detail: { userId: currentUser.uid, reason: 'account-deletion' }
      }));
      
      // Wait a moment for subscriptions to clean up
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ [AuthContext] Subscription cleanup completed');
    } catch (error) {
      console.error('❌ [AuthContext] Error during subscription cleanup:', error);
      throw error;
    }
  };

  /**
   * Delete user account and all associated data
   * @param {string} password - User's current password for re-authentication
   * @returns {Promise<{success: boolean, message: string}>}
   */
  const deleteUserAccount = async (password = null) => {
    setError(null);
    
    if (!currentUser || !userProfile) {
      setError('No authenticated user found');
      return { success: false, message: 'No authenticated user found' };
    }

    try {
      // Re-authenticate user if password is provided
      if (password) {
        const reauthResult = await reauthenticateUser(password);
        if (!reauthResult.success) {
          return reauthResult;
        }
      }
      
      console.log('🚀 [AuthContext] Starting account deletion process');
      
      // Step 1: Clean up all active subscriptions BEFORE deleting data
      console.log('🧹 [AuthContext] Cleaning up active subscriptions...');
      await cleanupSubscriptions();
      
      // Step 2: Delete user data and auth account
      console.log('🗑️ [AuthContext] Proceeding with data deletion...');
      
      // Import userDeletionService dynamically to avoid circular dependencies
      const { default: userDeletionService } = await import('../services/userDeletionService');
      
      const result = await userDeletionService.deleteUserAccount(currentUser, userProfile);
      
      if (result.success) {
        // Clear local state
        setCurrentUser(null);
        setUserProfile(null);
        setActiveRole(USER_ROLES.CLIENT);
        setAvailableRoles([USER_ROLES.CLIENT]);
        
        // Clear localStorage
        localStorage.clear();
        
        console.log('✅ [AuthContext] User account deleted successfully');
        return { 
          success: true, 
          message: 'Account deleted successfully',
          deletedData: result.deletedData,
          errors: result.errors
        };
      } else {
        setError('Failed to delete account completely. Some data may remain.');
        return { 
          success: false, 
          message: 'Account deletion failed',
          deletedData: result.deletedData,
          errors: result.errors
        };
      }
    } catch (error) {
      // Check if the error is due to requires-recent-login
      if (error.code === 'auth/requires-recent-login') {
        setError('Untuk keamanan, Anda perlu memverifikasi identitas terlebih dahulu.');
        return { 
          success: false, 
          message: 'Verifikasi identitas diperlukan',
          requiresReauth: true
        };
      }
      
      const errorMessage = `Failed to delete account: ${error.message}`;
      setError(errorMessage);
      console.error('❌ [AuthContext] Account deletion error:', error);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          console.log('AuthContext DEBUG: User authenticated, fetching profile...');
          // Fetch user profile from Firestore - pass user directly to avoid race condition
          const userData = await fetchUserProfile(user);
          
          // Sync emailVerified status from Firebase Auth to Firestore if different
          // OPTIMIZED: Only sync if there's a significant difference to prevent loops
          if (userData && userData.emailVerified !== user.emailVerified) {
            try {
              console.log(`AuthContext: emailVerified status differs - Auth: ${user.emailVerified}, Firestore: ${userData.emailVerified}`);
              
              // Only update if this is a meaningful change (not just a minor sync issue)
              const userRef = doc(db, COLLECTIONS.USERS, user.uid);
              await updateDoc(userRef, {
                emailVerified: user.emailVerified,
                updatedAt: serverTimestamp()
              });
              
              // Update local userProfile state with synced emailVerified status
              setUserProfile(prev => ({
                ...prev,
                emailVerified: user.emailVerified
              }));
              
              console.log(`AuthContext: emailVerified synced from ${userData.emailVerified} to ${user.emailVerified}`);
            } catch (error) {
              console.error('AuthContext: Failed to sync emailVerified status:', error);
            }
          }
        } else {
          console.log('AuthContext DEBUG: User not authenticated, clearing profile...');
          setUserProfile(null);
          setActiveRole(USER_ROLES.CLIENT);
          setAvailableRoles([USER_ROLES.CLIENT]);
        }
      } catch (err) {
        console.error('AuthContext DEBUG: Error in auth state change:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('AuthContext DEBUG: Auth state change error:', error);
      setError(error.message);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    activeRole,
    availableRoles,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    switchRole,
    refreshUserData,
    syncEmailVerifiedStatus,
    deleteUserAccount,
    reauthenticateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 