/**
 * Email Verification Service
 * Handles email verification with robust error handling for different environments
 */

import { sendEmailVerification, reload } from 'firebase/auth';
import { getActionCodeSettings, isVercel, isProduction } from '../utils/authUtils';
import { auth } from '../firebase/config';

class EmailVerificationService {
  /**
   * Send email verification with fallback handling
   * @param {Object} user - Firebase user object
   * @param {string} redirectPath - Path to redirect after verification
   * @returns {Promise<boolean>} True if successful
   */
  async sendVerificationEmail(user, redirectPath = '/login') {
    if (!user) {
      throw new Error('User object is required');
    }

    try {
      console.log('📧 [EmailVerification] Sending verification email to:', user.email);
      console.log('🌐 [EmailVerification] Environment:', {
        isProduction: isProduction(),
        isVercel: isVercel(),
        domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
      });

      // Get environment-appropriate action code settings
      const actionCodeSettings = getActionCodeSettings(redirectPath);
      
      console.log('⚙️ [EmailVerification] Action code settings:', {
        url: actionCodeSettings.url,
        handleCodeInApp: actionCodeSettings.handleCodeInApp
      });

      // Send verification email
      await sendEmailVerification(user, actionCodeSettings);
      
      console.log('✅ [EmailVerification] Email sent successfully');
      return true;

    } catch (error) {
      console.error('❌ [EmailVerification] Failed to send email:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-continue-uri') {
        console.warn('🔄 [EmailVerification] Retrying without continue URL...');
        
        // Fallback: Send without action code settings
        try {
          await sendEmailVerification(user);
          console.log('✅ [EmailVerification] Fallback email sent successfully');
          return true;
        } catch (fallbackError) {
          console.error('❌ [EmailVerification] Fallback also failed:', fallbackError);
          throw new Error('Gagal mengirim email verifikasi. Silakan coba lagi nanti.');
        }
      }
      
      // Handle other errors
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Terlalu banyak permintaan. Silakan tunggu beberapa menit sebelum mencoba lagi.');
      }
      
      if (error.code === 'auth/user-disabled') {
        throw new Error('Akun Anda telah dinonaktifkan. Hubungi dukungan untuk bantuan.');
      }
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Pengguna tidak ditemukan. Silakan daftar ulang.');
      }
      
      // Generic error
      throw new Error('Gagal mengirim email verifikasi. Silakan coba lagi.');
    }
  }

  /**
   * Resend verification email
   * @param {string} redirectPath - Path to redirect after verification
   * @returns {Promise<boolean>} True if successful
   */
  async resendVerificationEmail(redirectPath = '/login') {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Tidak ada pengguna yang sedang login');
    }

    if (user.emailVerified) {
      throw new Error('Email sudah terverifikasi');
    }

    return this.sendVerificationEmail(user, redirectPath);
  }

  /**
   * Check if email is verified and reload user
   * @returns {Promise<boolean>} True if email is verified
   */
  async isEmailVerified() {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }

    try {
      // Reload user data from Firebase
      await reload(user);
      return user.emailVerified;
    } catch (error) {
      console.error('❌ [EmailVerification] Error checking verification status:', error);
      return false;
    }
  }

  /**
   * Wait for email verification (polling)
   * @param {number} maxAttempts - Maximum number of attempts
   * @param {number} interval - Polling interval in milliseconds
   * @returns {Promise<boolean>} True if verified within time limit
   */
  async waitForEmailVerification(maxAttempts = 60, interval = 5000) {
    let attempts = 0;
    
    console.log(`⏳ [EmailVerification] Waiting for email verification (max ${maxAttempts} attempts)`);
    
    while (attempts < maxAttempts) {
      const isVerified = await this.isEmailVerified();
      
      if (isVerified) {
        console.log('✅ [EmailVerification] Email verified successfully');
        return true;
      }
      
      attempts++;
      console.log(`🔄 [EmailVerification] Attempt ${attempts}/${maxAttempts} - not verified yet`);
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    console.log('⏰ [EmailVerification] Timeout waiting for verification');
    return false;
  }
}

export default new EmailVerificationService(); 