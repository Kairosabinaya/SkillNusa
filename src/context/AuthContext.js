import { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
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
import { COLLECTIONS, USER_ROLES } from '../utils/constants';
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
      
      // Add multi-role fields if not provided
      const multiRoleData = {
        ...userData,
        roles: userData.roles || [USER_ROLES.CLIENT],
        activeRole: userData.activeRole || USER_ROLES.CLIENT,
        isFreelancer: userData.isFreelancer || false,
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
      // Create client profile in the new structure
      return await firebaseService.setDocument(COLLECTIONS.CLIENT_PROFILES, userId, {
        userId,
        isOnline: false,
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
      
      // Create user profile in Firestore with multi-role support
      await createUserDocument(user.uid, {
        uid: user.uid,
        email,
        username,
        displayName: username,
        // Multi-role architecture
        roles: [role],
        activeRole: role,
        isFreelancer: role === USER_ROLES.FREELANCER,
        profilePhoto: null,
        bio: '',
        isActive: true,
        emailVerified: user.emailVerified
      });
      
      // Create profile document (client profile by default)
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
      
      // Send verification email
      await sendEmailVerification(user);
      
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

  const fetchUserProfile = async () => {
    if (!currentUser) return null;
    
    try {
      const userData = await firebaseService.getUser(currentUser.uid);
      
      if (userData) {
        console.log('AuthContext DEBUG: userData loaded successfully');
        console.log('AuthContext DEBUG: userData.isFreelancer:', userData.isFreelancer);
        
        // Set active role and available roles for the multi-role architecture
        if (userData.roles && userData.roles.length > 0) {
          setAvailableRoles(userData.roles);
          setActiveRole(userData.activeRole || userData.roles[0]);
        }
        
        setUserProfile(userData);
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
      
      // Get current user data from Firestore
      const userData = await firebaseService.getUser(currentUser.uid);
      
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
   * Delete user account and all associated data
   * @returns {Promise<{success: boolean, message: string}>}
   */
  const deleteUserAccount = async () => {
    setError(null);
    
    if (!currentUser || !userProfile) {
      setError('No authenticated user found');
      return { success: false, message: 'No authenticated user found' };
    }

    try {
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
        
        console.log('User account deleted successfully');
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
      const errorMessage = `Failed to delete account: ${error.message}`;
      setError(errorMessage);
      console.error('AuthContext: Account deletion error:', error);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          // Fetch user profile from Firestore
          const userData = await fetchUserProfile();
          
          // Sync emailVerified status from Firebase Auth to Firestore if different
          if (userData && userData.emailVerified !== user.emailVerified) {
            try {
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
          setUserProfile(null);
          setActiveRole(USER_ROLES.CLIENT);
          setAvailableRoles([USER_ROLES.CLIENT]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
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
    deleteUserAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 