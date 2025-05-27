#!/usr/bin/env node

/**
 * Debug Runner Script (CommonJS)
 * 
 * Usage:
 * npm run db:debug
 * atau
 * node src/scripts/runDebug.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  connectFirestoreEmulator 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections constants
const COLLECTIONS = {
  USERS: 'users',
  CLIENT_PROFILES: 'clientProfiles',
  FREELANCER_PROFILES: 'freelancerProfiles',
  GIGS: 'gigs',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  CONVERSATIONS: 'conversations',
  NOTIFICATIONS: 'notifications'
};

/**
 * Check all gigs in database
 */
const checkGigs = async () => {
  console.log('🔍 Checking gigs collection...');
  
  try {
    const gigsRef = collection(db, COLLECTIONS.GIGS);
    const snapshot = await getDocs(gigsRef);
    
    console.log(`📊 Total gigs found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No gigs found in database!');
      return [];
    }
    
    const gigs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      gigs.push({
        id: doc.id,
        ...data
      });
      
      console.log(`📄 Gig ID: ${doc.id}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Category: ${data.category}`);
      console.log(`   Freelancer ID: ${data.freelancerId}`);
      console.log(`   Is Active: ${data.isActive}`);
      console.log(`   Basic Price: ${data.packages?.basic?.price}`);
      console.log(`   Rating: ${data.rating}`);
      console.log('   ---');
    });
    
    return gigs;
  } catch (error) {
    console.error('❌ Error checking gigs:', error);
    return [];
  }
};

/**
 * Check users collection
 */
const checkUsers = async () => {
  console.log('🔍 Checking users collection...');
  
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);
    
    console.log(`📊 Total users found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No users found in database!');
      return [];
    }
    
    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        ...data
      });
      
      console.log(`👤 User ID: ${doc.id}`);
      console.log(`   Display Name: ${data.displayName}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Is Freelancer: ${data.isFreelancer}`);
      console.log(`   Roles: ${JSON.stringify(data.roles)}`);
      console.log('   ---');
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error checking users:', error);
    return [];
  }
};

/**
 * Check freelancer profiles
 */
const checkFreelancerProfiles = async () => {
  console.log('🔍 Checking freelancer profiles collection...');
  
  try {
    const profilesRef = collection(db, COLLECTIONS.FREELANCER_PROFILES);
    const snapshot = await getDocs(profilesRef);
    
    console.log(`📊 Total freelancer profiles found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No freelancer profiles found in database!');
      return [];
    }
    
    const profiles = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({
        id: doc.id,
        ...data
      });
      
      console.log(`💼 Profile ID: ${doc.id}`);
      console.log(`   User ID: ${data.userId}`);
      console.log(`   Skills: ${JSON.stringify(data.skills)}`);
      console.log(`   Rating: ${data.rating}`);
      console.log(`   Tier: ${data.tier}`);
      console.log('   ---');
    });
    
    return profiles;
  } catch (error) {
    console.error('❌ Error checking freelancer profiles:', error);
    return [];
  }
};

/**
 * Check reviews collection
 */
const checkReviews = async () => {
  console.log('🔍 Checking reviews collection...');
  
  try {
    const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
    const snapshot = await getDocs(reviewsRef);
    
    console.log(`📊 Total reviews found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No reviews found in database!');
      return [];
    }
    
    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data
      });
      
      console.log(`⭐ Review ID: ${doc.id}`);
      console.log(`   Gig ID: ${data.gigId}`);
      console.log(`   Freelancer ID: ${data.freelancerId}`);
      console.log(`   Client ID: ${data.clientId}`);
      console.log(`   Rating: ${data.rating}`);
      console.log('   ---');
    });
    
    return reviews;
  } catch (error) {
    console.error('❌ Error checking reviews:', error);
    return [];
  }
};

/**
 * Run comprehensive debug check
 */
const debugAll = async () => {
  console.log('🚀 Starting comprehensive debug check...');
  console.log('=====================================');
  
  try {
    // Check all collections
    const gigs = await checkGigs();
    console.log('\n');
    
    const users = await checkUsers();
    console.log('\n');
    
    const profiles = await checkFreelancerProfiles();
    console.log('\n');
    
    const reviews = await checkReviews();
    console.log('\n');
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log(`   Gigs in database: ${gigs.length}`);
    console.log(`   Users in database: ${users.length}`);
    console.log(`   Freelancer profiles: ${profiles.length}`);
    console.log(`   Reviews in database: ${reviews.length}`);
    
    // Check for issues
    const issues = [];
    
    if (gigs.length === 0) {
      issues.push('No gigs found in database');
    }
    
    if (users.length === 0) {
      issues.push('No users found in database');
    }
    
    if (profiles.length === 0) {
      issues.push('No freelancer profiles found');
    }
    
    // Check for orphaned gigs (gigs without freelancer data)
    const orphanedGigs = gigs.filter(gig => {
      const userExists = users.find(user => user.id === gig.freelancerId);
      const profileExists = profiles.find(profile => profile.userId === gig.freelancerId);
      return !userExists || !profileExists;
    });
    
    if (orphanedGigs.length > 0) {
      issues.push(`${orphanedGigs.length} orphaned gigs (missing user or profile data)`);
      orphanedGigs.forEach(gig => {
        console.log(`   Orphaned gig: ${gig.id} (freelancer: ${gig.freelancerId})`);
      });
    }
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      // Suggest solutions
      console.log('\n💡 SUGGESTED SOLUTIONS:');
      if (gigs.length === 0) {
        console.log('   • Run: npm run db:seed');
      }
      if (orphanedGigs.length > 0) {
        console.log('   • Run: npm run db:seed:users');
        console.log('   • Or run: npm run db:clean:quick && npm run db:seed');
      }
    } else {
      console.log('\n✅ No issues found!');
    }
    
  } catch (error) {
    console.error('❌ Error in debug check:', error);
  }
  
  console.log('\n🏁 Debug check completed!');
};

async function main() {
  console.log('🔬 SkillNusa Database Debug Script');
  console.log('==================================');
  
  try {
    await debugAll();
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

main(); 