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
import { COLLECTIONS, USER_ROLES, FREELANCER_STATUS } from '../utils/constants';

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
      // Add multi-role fields if not provided
      const multiRoleData = {
        ...userData,
        roles: userData.roles || [USER_ROLES.CLIENT],
        activeRole: userData.activeRole || USER_ROLES.CLIENT,
        isFreelancer: userData.isFreelancer || false,
        freelancerStatus: userData.freelancerStatus || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      return await firebaseService.setDocument(COLLECTIONS.USERS, userId, multiRoleData);
    } catch (error) {
      console.error("Error creating user document:", error);
      setError(error.message);
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
      console.error("Error creating profile document:", error);
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
        freelancerStatus: role === USER_ROLES.FREELANCER ? FREELANCER_STATUS.APPROVED : null,
        // Legacy support
        role,
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
      console.error("Signup error:", error);
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
      console.error("Login error:", error);
      
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
      console.error("Logout error:", error);
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    setError(null);
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.message);
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser) return null;
    
    try {
      const userData = await firebaseService.getUser(currentUser.uid);
      if (userData) {
        // Set active role and available roles for the multi-role architecture
        if (userData.roles && userData.roles.length > 0) {
          setAvailableRoles(userData.roles);
          setActiveRole(userData.activeRole || userData.roles[0]);
        } else if (userData.role) {
          // Legacy support
          setAvailableRoles([userData.role]);
          setActiveRole(userData.role);
        }
        
        setUserProfile(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
      console.error("Error switching role:", error);
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

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          await fetchUserProfile();
        } else {
          setUserProfile(null);
          setActiveRole(USER_ROLES.CLIENT);
          setAvailableRoles([USER_ROLES.CLIENT]);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state observer error:", error);
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
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 