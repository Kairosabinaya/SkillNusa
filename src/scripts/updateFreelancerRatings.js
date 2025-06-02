/**
 * Script to update all freelancer ratings based on their gigs' reviews
 * This script should be run after implementing the new rating system
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  setDoc,
  query,
  where
} = require('firebase/firestore');

// Load environment variables first
require('dotenv').config();

// Firebase configuration - you may need to adjust this
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase config
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required Firebase configuration:');
  missingFields.forEach(field => console.error(`  - ${field}`));
  console.error('Please set the required environment variables in .env file');
  process.exit(1);
}

// Initialize Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

// Constants
const COLLECTIONS = {
  USERS: 'users',
  FREELANCER_PROFILES: 'freelancerProfiles',
  GIGS: 'gigs',
  REVIEWS: 'reviews'
};

// Simplified freelancer rating calculation for the script
const calculateFreelancerRatingStats = async (freelancerId) => {
  try {
    console.log('🔍 Calculating rating stats for freelancer:', freelancerId);
    
    // Try both freelancerId and userId fields for gigs
    const gigsQueries = [
      query(
        collection(db, COLLECTIONS.GIGS),
        where('freelancerId', '==', freelancerId),
        where('isActive', '==', true)
      ),
      query(
        collection(db, COLLECTIONS.GIGS),
        where('userId', '==', freelancerId),
        where('isActive', '==', true)
      )
    ];
    
    let allGigs = [];
    const processedGigIds = new Set();
    
    for (const gigQuery of gigsQueries) {
      try {
        const gigsSnapshot = await getDocs(gigQuery);
        gigsSnapshot.docs.forEach(doc => {
          if (!processedGigIds.has(doc.id)) {
            processedGigIds.add(doc.id);
            allGigs.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
      } catch (queryError) {
        console.log(`Query failed for freelancer ${freelancerId}:`, queryError.message);
      }
    }
    
    console.log(`📊 Found ${allGigs.length} gigs for freelancer ${freelancerId}`);
    
    if (allGigs.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        gigRatings: []
      };
    }
    
    // Get reviews for each gig
    let totalRatingSum = 0;
    let totalReviewsCount = 0;
    const gigRatings = [];
    
    for (const gig of allGigs) {
      try {
        const reviewsQuery = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('gigId', '==', gig.id)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        
        const gigReviewCount = reviews.length;
        const gigAverageRating = gigReviewCount > 0 
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / gigReviewCount
          : 0;
        
        gigRatings.push({
          gigId: gig.id,
          gigTitle: gig.title || 'Unknown Gig',
          averageRating: gigAverageRating,
          totalReviews: gigReviewCount
        });
        
        if (gigReviewCount > 0) {
          totalRatingSum += gigAverageRating * gigReviewCount;
          totalReviewsCount += gigReviewCount;
        }
        
        console.log(`  📊 Gig "${gig.title}": ${gigAverageRating.toFixed(1)} stars (${gigReviewCount} reviews)`);
        
      } catch (error) {
        console.error(`Error processing gig ${gig.id}:`, error.message);
      }
    }
    
    const averageRating = totalReviewsCount > 0 
      ? Math.round((totalRatingSum / totalReviewsCount) * 10) / 10
      : 0;
    
    console.log(`📊 Freelancer ${freelancerId} rating stats: ${averageRating} (${totalReviewsCount} total reviews)`);
    
    return {
      averageRating,
      totalReviews: totalReviewsCount,
      gigRatings
    };
  } catch (error) {
    console.error('Error calculating freelancer rating stats:', error.message);
    return {
      averageRating: 0,
      totalReviews: 0,
      gigRatings: []
    };
  }
};

// Find all freelancers from various sources
const findAllFreelancers = async () => {
  const freelancers = new Map(); // Use Map to avoid duplicates
  
  try {
    console.log('🔍 Looking for freelancers in different ways...');
    
    // Method 1: From freelancerProfiles collection
    try {
      console.log('📊 Method 1: Checking freelancerProfiles collection...');
      const profilesSnapshot = await getDocs(collection(db, COLLECTIONS.FREELANCER_PROFILES));
      console.log(`Found ${profilesSnapshot.size} freelancer profiles`);
      
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        freelancers.set(doc.id, {
          id: doc.id,
          source: 'freelancerProfiles',
          hasProfile: true,
          profileData: data
        });
      });
    } catch (error) {
      console.log('Failed to query freelancerProfiles:', error.message);
    }
    
    // Method 2: From users with freelancer role
    try {
      console.log('📊 Method 2: Checking users with freelancer role...');
      const freelancerQueries = [
        query(collection(db, COLLECTIONS.USERS), where('role', '==', 'freelancer')),
        query(collection(db, COLLECTIONS.USERS), where('isFreelancer', '==', true)),
        query(collection(db, COLLECTIONS.USERS), where('roles', 'array-contains', 'freelancer'))
      ];
      
      for (const userQuery of freelancerQueries) {
        try {
          const usersSnapshot = await getDocs(userQuery);
          console.log(`Found ${usersSnapshot.size} freelancer users with this query`);
          
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!freelancers.has(doc.id)) {
              freelancers.set(doc.id, {
                id: doc.id,
                source: 'users',
                hasProfile: false,
                userData: data
              });
            }
          });
        } catch (queryError) {
          console.log('One user query failed:', queryError.message);
        }
      }
    } catch (error) {
      console.log('Failed to query freelancer users:', error.message);
    }
    
    // Method 3: Find users who have created gigs
    try {
      console.log('📊 Method 3: Checking users who created gigs...');
      const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
      console.log(`Found ${gigsSnapshot.size} total gigs`);
      
      const gigCreators = new Set();
      gigsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.freelancerId) gigCreators.add(data.freelancerId);
        if (data.userId) gigCreators.add(data.userId);
      });
      
      console.log(`Found ${gigCreators.size} unique gig creators`);
      
      gigCreators.forEach(userId => {
        if (!freelancers.has(userId)) {
          freelancers.set(userId, {
            id: userId,
            source: 'gigCreators',
            hasProfile: false
          });
        }
      });
    } catch (error) {
      console.log('Failed to analyze gig creators:', error.message);
    }
    
    console.log(`🎉 Found ${freelancers.size} total unique freelancers`);
    return Array.from(freelancers.values());
    
  } catch (error) {
    console.error('Error finding freelancers:', error.message);
    return [];
  }
};

const updateAllFreelancerRatings = async () => {
  try {
    console.log('🔄 Starting freelancer ratings update...');
    
    // Find all freelancers
    const freelancers = await findAllFreelancers();
    
    if (freelancers.length === 0) {
      console.log('⚠️ No freelancers found to update');
      return;
    }
    
    console.log(`📊 Found ${freelancers.length} freelancers to process`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each freelancer
    for (const freelancer of freelancers) {
      const freelancerId = freelancer.id;
      
      try {
        console.log(`\n🔍 Processing freelancer: ${freelancerId} (source: ${freelancer.source})`);
        
        // Calculate new rating stats
        const ratingStats = await calculateFreelancerRatingStats(freelancerId);
        
        if (ratingStats.totalReviews === 0) {
          console.log(`⏭️ Skipping ${freelancerId} - no reviews found`);
          skippedCount++;
          continue;
        }
        
        // Update or create freelancer profile
        if (freelancer.hasProfile) {
          // Update existing profile
          const updateData = {
            rating: ratingStats.averageRating,
            totalReviews: ratingStats.totalReviews,
            lastRatingUpdate: new Date()
          };
          
          await updateDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId), updateData);
          console.log(`✅ Updated existing profile for ${freelancerId}: Rating ${ratingStats.averageRating} (${ratingStats.totalReviews} reviews)`);
        } else {
          // Create new profile
          const newProfile = {
            userId: freelancerId,
            rating: ratingStats.averageRating,
            totalReviews: ratingStats.totalReviews,
            tier: 'bronze',
            skills: [],
            experienceLevel: 'beginner',
            hourlyRate: 0,
            completedProjects: 0,
            education: [],
            certifications: [],
            createdAt: new Date(),
            lastRatingUpdate: new Date()
          };
          
          await setDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId), newProfile);
          console.log(`✅ Created new profile for ${freelancerId}: Rating ${ratingStats.averageRating} (${ratingStats.totalReviews} reviews)`);
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing freelancer ${freelancerId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Finished updating freelancer ratings!`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️ Skipped (no reviews): ${skippedCount}`);
    console.log(`❌ Failed updates: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in updateAllFreelancerRatings:', error.message);
  }
};

// Quick stats function
const showDatabaseStats = async () => {
  try {
    console.log('\n📊 Database Statistics:');
    
    const collections = [
      { name: 'users', collection: COLLECTIONS.USERS },
      { name: 'freelancerProfiles', collection: COLLECTIONS.FREELANCER_PROFILES },
      { name: 'gigs', collection: COLLECTIONS.GIGS },
      { name: 'reviews', collection: COLLECTIONS.REVIEWS }
    ];
    
    for (const col of collections) {
      try {
        const snapshot = await getDocs(collection(db, col.collection));
        console.log(`  ${col.name}: ${snapshot.size} documents`);
      } catch (error) {
        console.log(`  ${col.name}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error getting database stats:', error.message);
  }
};

// Main execution
(async () => {
  try {
    console.log('🚀 Starting freelancer rating update script...');
    
    // Show database stats first
    await showDatabaseStats();
    
    // Process freelancer ratings
    await updateAllFreelancerRatings();
    
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
})();

// Export functions for potential use in other scripts
module.exports = {
  updateAllFreelancerRatings,
  calculateFreelancerRatingStats,
  findAllFreelancers,
  showDatabaseStats
}; 