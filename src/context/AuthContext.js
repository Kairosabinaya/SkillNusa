import { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import firebaseService from '../services/firebaseService';
import { COLLECTIONS, USER_ROLES } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createUserDocument = async (userId, userData) => {
    try {
      return await firebaseService.setDocument(COLLECTIONS.USERS, userId, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating user document:", error);
      setError(error.message);
      throw error;
    }
  };

  const createProfileDocument = async (userId) => {
    try {
      return await firebaseService.setDocument(COLLECTIONS.PROFILES, userId, {
        userId,
        skills: [],
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
      
      // Create user profile in Firestore
      await createUserDocument(user.uid, {
        uid: user.uid,
        email,
        username,
        displayName: username,
        role,
        profilePhoto: null,
        bio: '',
        isActive: true,
        emailVerified: user.emailVerified
      });
      
      // Create profile document
      await createProfileDocument(user.uid);
      
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

  const login = async (email, password) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
      
      if (!userDoc.exists()) {
        // New user, create profile
        await createUserDocument(user.uid, {
          uid: user.uid,
          email: user.email,
          username: user.displayName || user.email.split('@')[0],
          displayName: user.displayName || user.email.split('@')[0],
          role: USER_ROLES.CLIENT, // Default role for OAuth users
          profilePhoto: user.photoURL || null,
          bio: '',
          isActive: true,
          emailVerified: user.emailVerified
        });
        
        // Create profile document
        await createProfileDocument(user.uid);
      }
      
      return user;
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    setError(null);
    try {
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

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          await fetchUserProfile();
        } else {
          setUserProfile(null);
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
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 