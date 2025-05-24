import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { userRepository, profileRepository } from '../repositories';
import { User, Profile } from '../models';
import { USER_ROLES } from '../utils/constants';

/**
 * Authentication service for handling user authentication
 */
export default class AuthService {
  /**
   * Sign up a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} username - User display name
   * @param {string} role - User role
   * @param {string} bio - User bio
   * @param {string} headline - User headline
   * @param {Array} skills - User skills
   * @param {string} fullName - User's full name
   * @param {string} phoneNumber - User's phone number
   * @param {string} gender - User's gender
   * @param {string} birthDate - User's birth date
   * @returns {Promise<Object>} Firebase user object
   */
  async signup(email, password, username, role, bio = '', headline = '', skills = [], fullName = '', phoneNumber = '', gender = '', birthDate = '') {
    try {
      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = result;
      
      // Create user model
      const newUser = new User({
        uid: user.uid,
        email,
        username,
        displayName: username,
        fullName: fullName || username,
        phoneNumber: phoneNumber || '',
        gender: gender || '',
        birthDate: birthDate || '',
        role,
        profilePhoto: null,
        bio: bio || '',
        isActive: true,
        emailVerified: user.emailVerified
      });
      
      // Save user to Firestore
      await userRepository.create(user.uid, newUser);
      
      // Create profile
      const newProfile = new Profile({
        userId: user.uid,
        skills: skills || [],
        headline: headline || '',
        isOnline: false
      });
      
      // Save profile
      await profileRepository.create(user.uid, newProfile);
      
      // Update auth profile
      await updateProfile(user, { displayName: username });
      
      // Send verification email
      await sendEmailVerification(user);
      
      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  /**
   * Sign in a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Firebase user object
   */
  async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      return await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Firebase user object or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.getCurrentUser();
  }
} 