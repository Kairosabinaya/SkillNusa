/**
 * Test utility for debugging gig creation issues
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export const testGigCreation = async () => {
  try {
    if (!auth.currentUser) {
      console.error('❌ No user authenticated');
      return { success: false, error: 'No user authenticated' };
    }

    console.log('🧪 Testing gig creation for user:', auth.currentUser.uid);
    
    const testGigData = {
      title: 'Test Gig Creation',
      category: 'Programming & Tech',
      subcategory: 'Website Development',
      description: 'This is a test gig to verify creation permissions are working correctly.',
      tags: ['test', 'development'],
      packages: {
        basic: {
          name: 'Basic',
          price: 50000,
          description: 'Basic test package',
          deliveryTime: 3,
          revisions: 1,
          features: ['Test feature 1']
        },
        standard: {
          name: 'Standard',
          price: 100000,
          description: 'Standard test package',
          deliveryTime: 5,
          revisions: 2,
          features: ['Test feature 1', 'Test feature 2']
        },
        premium: {
          name: 'Premium',
          price: 200000,
          description: 'Premium test package',
          deliveryTime: 7,
          revisions: 3,
          features: ['Test feature 1', 'Test feature 2', 'Test feature 3']
        }
      },
      images: ['https://picsum.photos/800/600'],
      freelancerId: auth.currentUser.uid,
      userId: auth.currentUser.uid,
      isActive: true,
      rating: 0,
      totalOrders: 0,
      inQueue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('🧪 Attempting to create test gig with data:', testGigData);
    
    const docRef = await addDoc(collection(db, 'gigs'), testGigData);
    
    console.log('✅ Test gig created successfully with ID:', docRef.id);
    
    return { 
      success: true, 
      gigId: docRef.id,
      message: 'Test gig created successfully'
    };
    
  } catch (error) {
    console.error('❌ Test gig creation failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

export const testFirebaseAuth = () => {
  console.log('🧪 Testing Firebase Authentication:');
  console.log('  - Current user:', auth.currentUser?.uid || 'Not authenticated');
  console.log('  - User email:', auth.currentUser?.email || 'No email');
  console.log('  - Email verified:', auth.currentUser?.emailVerified || false);
  
  return {
    isAuthenticated: !!auth.currentUser,
    userId: auth.currentUser?.uid,
    email: auth.currentUser?.email,
    emailVerified: auth.currentUser?.emailVerified
  };
};

// Add to window for browser console testing
if (typeof window !== 'undefined') {
  window.testGigCreation = testGigCreation;
  window.testFirebaseAuth = testFirebaseAuth;
} 