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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, username, role) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        username,
        displayName: username,
        role,
        profilePhoto: null,
        bio: '',
        isActive: true,
        emailVerified: result.user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create profile document
      await setDoc(doc(db, 'profiles', result.user.uid), {
        userId: result.user.uid,
        skills: [],
        isOnline: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update auth profile
      await updateProfile(result.user, {
        displayName: username
      });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // New user, create profile
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          username: result.user.displayName || result.user.email.split('@')[0],
          displayName: result.user.displayName || result.user.email.split('@')[0],
          role: 'client', // Default role for OAuth users
          profilePhoto: result.user.photoURL || null,
          bio: '',
          isActive: true,
          emailVerified: result.user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Create profile document
        await setDoc(doc(db, 'profiles', result.user.uid), {
          userId: result.user.uid,
          skills: [],
          isOnline: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function fetchUserProfile() {
    if (!currentUser) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile();
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 