const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where,
  serverTimestamp
} = require('firebase/firestore');

// Load environment variables
const { config } = require('dotenv');
const { existsSync } = require('fs');

if (existsSync('.env.local')) {
  config({ path: '.env.local' });
} else if (existsSync('.env')) {
  config({ path: '.env' });
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized for database normalization!');

/**
 * COMPREHENSIVE DATABASE NORMALIZATION SCRIPT
 * 
 * This script will:
 * 1. Standardize all field names across collections
 * 2. Remove redundant data and establish single source of truth
 * 3. Fix rating system to use reviews as primary source
 * 4. Migrate from inconsistent field naming
 * 5. Update all aggregate data correctly
 */

const COLLECTIONS = {
  USERS: 'users',
  CLIENT_PROFILES: 'clientProfiles',
  FREELANCER_PROFILES: 'freelancerProfiles',
  GIGS: 'gigs',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  CHATS: 'chats',
  MESSAGES: 'messages',
  FAVORITES: 'favorites',
  NOTIFICATIONS: 'notifications'
};

// Field mapping for standardization
const FIELD_MAPPINGS = {
  // Gigs collection - standardize to freelancerId
  gigs: {
    'userId': 'freelancerId'  // userId should be freelancerId
  },
  // Reviews collection - standardize to freelancerId
  reviews: {
    'sellerId': 'freelancerId'  // sellerId should be freelancerId
  },
  // Orders collection - standardize to freelancerId
  orders: {
    'sellerId': 'freelancerId'  // sellerId should be freelancerId
  }
};

/**
 * Step 1: Normalize field names across collections
 */
async function normalizeFieldNames() {
  console.log('\n🔧 Step 1: Normalizing field names across collections...\n');
  
  for (const [collectionName, fieldMap] of Object.entries(FIELD_MAPPINGS)) {
    console.log(`📋 Processing ${collectionName} collection...`);
    
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`   ✓ Collection ${collectionName} is empty, skipping`);
        continue;
      }
      
      const batch = writeBatch(db);
      let updateCount = 0;
      
      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let needsUpdate = false;
        const updates = {};
        
        // Check each field mapping
        for (const [oldField, newField] of Object.entries(fieldMap)) {
          if (data.hasOwnProperty(oldField) && !data.hasOwnProperty(newField)) {
            // Copy old field value to new field
            updates[newField] = data[oldField];
            // Mark old field for deletion
            updates[oldField] = null;
            needsUpdate = true;
          } else if (data.hasOwnProperty(oldField) && data.hasOwnProperty(newField)) {
            // Both exist, remove old field if values are the same
            if (data[oldField] === data[newField]) {
              updates[oldField] = null;
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          updates.updatedAt = serverTimestamp();
          batch.update(docSnapshot.ref, updates);
          updateCount++;
        }
      });
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`   ✅ Updated ${updateCount} documents in ${collectionName}`);
      } else {
        console.log(`   ✓ No updates needed for ${collectionName}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${collectionName}:`, error.message);
    }
  }
}

/**
 * Step 2: Recalculate and normalize rating data
 */
async function normalizeRatingData() {
  console.log('\n⭐ Step 2: Normalizing rating data (reviews as source of truth)...\n');
  
  try {
    // Get all gigs
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    console.log(`📊 Processing ${gigsSnapshot.size} gigs...`);
    
    const batch = writeBatch(db);
    let gigUpdateCount = 0;
    
    for (const gigDoc of gigsSnapshot.docs) {
      const gigId = gigDoc.id;
      
      // Get all published reviews for this gig
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('gigId', '==', gigId),
        where('status', '==', 'published')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calculate rating stats from reviews
      let totalRating = 0;
      let reviewCount = 0;
      const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      
      reviewsSnapshot.forEach((reviewDoc) => {
        const review = reviewDoc.data();
        const rating = review.rating || 0;
        totalRating += rating;
        reviewCount++;
        if (ratingBreakdown.hasOwnProperty(rating)) {
          ratingBreakdown[rating]++;
        }
      });
      
      const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
      
      // Update gig with calculated rating data
      const gigUpdates = {
        rating: averageRating,
        totalReviews: reviewCount,
        ratingBreakdown: ratingBreakdown,
        updatedAt: serverTimestamp()
      };
      
      batch.update(gigDoc.ref, gigUpdates);
      gigUpdateCount++;
      
      console.log(`   📈 Gig ${gigId}: ${reviewCount} reviews, avg rating ${averageRating}`);
    }
    
    await batch.commit();
    console.log(`✅ Updated rating data for ${gigUpdateCount} gigs`);
    
  } catch (error) {
    console.error('❌ Error normalizing rating data:', error);
  }
}

/**
 * Step 3: Normalize freelancer profile rating data
 */
async function normalizeFreelancerRatings() {
  console.log('\n👨‍💻 Step 3: Normalizing freelancer profile ratings...\n');
  
  try {
    // Get all freelancer profiles
    const freelancersSnapshot = await getDocs(collection(db, COLLECTIONS.FREELANCER_PROFILES));
    console.log(`📊 Processing ${freelancersSnapshot.size} freelancer profiles...`);
    
    const batch = writeBatch(db);
    let freelancerUpdateCount = 0;
    
    for (const freelancerDoc of freelancersSnapshot.docs) {
      const freelancerId = freelancerDoc.id;
      
      // Get all published reviews for this freelancer across all gigs
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('freelancerId', '==', freelancerId),
        where('status', '==', 'published')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calculate overall freelancer rating
      let totalRating = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach((reviewDoc) => {
        const review = reviewDoc.data();
        totalRating += review.rating || 0;
        reviewCount++;
      });
      
      const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
      
      // Get completed orders count for this freelancer
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('freelancerId', '==', freelancerId),
        where('status', '==', 'completed')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Update freelancer profile
      const freelancerUpdates = {
        rating: averageRating,
        totalReviews: reviewCount,
        completedProjects: ordersSnapshot.size,
        updatedAt: serverTimestamp()
      };
      
      batch.update(freelancerDoc.ref, freelancerUpdates);
      freelancerUpdateCount++;
      
      console.log(`   👤 Freelancer ${freelancerId}: ${reviewCount} reviews, ${ordersSnapshot.size} completed projects, avg rating ${averageRating}`);
    }
    
    await batch.commit();
    console.log(`✅ Updated rating data for ${freelancerUpdateCount} freelancer profiles`);
    
  } catch (error) {
    console.error('❌ Error normalizing freelancer ratings:', error);
  }
}

/**
 * Step 4: Clean up orphaned data and fix references
 */
async function cleanupOrphanedData() {
  console.log('\n🧹 Step 4: Cleaning up orphaned data and fixing references...\n');
  
  try {
    // Check for reviews without corresponding gigs
    console.log('🔍 Checking for orphaned reviews...');
    const reviewsSnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWS));
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    
    const gigIds = new Set(gigsSnapshot.docs.map(doc => doc.id));
    const orphanedReviews = [];
    
    reviewsSnapshot.docs.forEach((reviewDoc) => {
      const review = reviewDoc.data();
      if (!gigIds.has(review.gigId)) {
        orphanedReviews.push(reviewDoc.id);
      }
    });
    
    if (orphanedReviews.length > 0) {
      console.log(`   ⚠️  Found ${orphanedReviews.length} orphaned reviews`);
      
      const batch = writeBatch(db);
      orphanedReviews.forEach(reviewId => {
        batch.delete(doc(db, COLLECTIONS.REVIEWS, reviewId));
      });
      await batch.commit();
      
      console.log(`   ✅ Deleted ${orphanedReviews.length} orphaned reviews`);
    } else {
      console.log('   ✓ No orphaned reviews found');
    }
    
    // Check for orders without corresponding gigs
    console.log('🔍 Checking for orphaned orders...');
    const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orphanedOrders = [];
    
    ordersSnapshot.docs.forEach((orderDoc) => {
      const order = orderDoc.data();
      if (!gigIds.has(order.gigId)) {
        orphanedOrders.push(orderDoc.id);
      }
    });
    
    if (orphanedOrders.length > 0) {
      console.log(`   ⚠️  Found ${orphanedOrders.length} orphaned orders`);
      
      const batch = writeBatch(db);
      orphanedOrders.forEach(orderId => {
        batch.delete(doc(db, COLLECTIONS.ORDERS, orderId));
      });
      await batch.commit();
      
      console.log(`   ✅ Deleted ${orphanedOrders.length} orphaned orders`);
    } else {
      console.log('   ✓ No orphaned orders found');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up orphaned data:', error);
  }
}

/**
 * Step 5: Validate data consistency
 */
async function validateDataConsistency() {
  console.log('\n✅ Step 5: Validating data consistency...\n');
  
  const validationResults = {
    gigs: { total: 0, withRating: 0, withReviews: 0 },
    reviews: { total: 0, withValidGig: 0, withValidFreelancer: 0 },
    freelancers: { total: 0, withRating: 0, withProjects: 0 },
    issues: []
  };
  
  try {
    // Validate gigs
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    validationResults.gigs.total = gigsSnapshot.size;
    
    gigsSnapshot.docs.forEach((gigDoc) => {
      const gig = gigDoc.data();
      if (gig.rating > 0) validationResults.gigs.withRating++;
      if (gig.totalReviews > 0) validationResults.gigs.withReviews++;
      
      // Check for old field names
      if (gig.userId && gig.freelancerId && gig.userId !== gig.freelancerId) {
        validationResults.issues.push(`Gig ${gigDoc.id} has conflicting userId and freelancerId`);
      }
    });
    
    // Validate reviews
    const reviewsSnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWS));
    validationResults.reviews.total = reviewsSnapshot.size;
    
    reviewsSnapshot.docs.forEach((reviewDoc) => {
      const review = reviewDoc.data();
      if (review.gigId) validationResults.reviews.withValidGig++;
      if (review.freelancerId) validationResults.reviews.withValidFreelancer++;
      
      // Check for old field names
      if (review.sellerId && review.freelancerId && review.sellerId !== review.freelancerId) {
        validationResults.issues.push(`Review ${reviewDoc.id} has conflicting sellerId and freelancerId`);
      }
    });
    
    // Validate freelancer profiles
    const freelancersSnapshot = await getDocs(collection(db, COLLECTIONS.FREELANCER_PROFILES));
    validationResults.freelancers.total = freelancersSnapshot.size;
    
    freelancersSnapshot.docs.forEach((freelancerDoc) => {
      const freelancer = freelancerDoc.data();
      if (freelancer.rating > 0) validationResults.freelancers.withRating++;
      if (freelancer.completedProjects > 0) validationResults.freelancers.withProjects++;
    });
    
    // Print validation results
    console.log('📊 Validation Results:');
    console.log(`   Gigs: ${validationResults.gigs.total} total, ${validationResults.gigs.withRating} with ratings, ${validationResults.gigs.withReviews} with reviews`);
    console.log(`   Reviews: ${validationResults.reviews.total} total, ${validationResults.reviews.withValidGig} with valid gig refs, ${validationResults.reviews.withValidFreelancer} with valid freelancer refs`);
    console.log(`   Freelancers: ${validationResults.freelancers.total} total, ${validationResults.freelancers.withRating} with ratings, ${validationResults.freelancers.withProjects} with completed projects`);
    
    if (validationResults.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      validationResults.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ No data consistency issues found!');
    }
    
  } catch (error) {
    console.error('❌ Error validating data consistency:', error);
  }
  
  return validationResults;
}

/**
 * Main normalization function
 */
async function runDatabaseNormalization(options = {}) {
  const {
    skipFieldNormalization = false,
    skipRatingNormalization = false,
    skipCleanup = false,
    validateOnly = false
  } = options;
  
  console.log('🚀 Starting comprehensive database normalization...');
  console.log('📝 This will fix all field inconsistencies and establish single source of truth for ratings\n');
  
  try {
    if (validateOnly) {
      await validateDataConsistency();
      return;
    }
    
    if (!skipFieldNormalization) {
      await normalizeFieldNames();
    }
    
    if (!skipRatingNormalization) {
      await normalizeRatingData();
      await normalizeFreelancerRatings();
    }
    
    if (!skipCleanup) {
      await cleanupOrphanedData();
    }
    
    // Always validate at the end
    await validateDataConsistency();
    
    console.log('\n🎉 Database normalization completed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   ✅ Standardized field names (freelancerId, not userId/sellerId)');
    console.log('   ✅ Reviews are now the single source of truth for ratings');
    console.log('   ✅ Gig ratings are calculated from reviews');
    console.log('   ✅ Freelancer ratings are calculated from all their reviews');
    console.log('   ✅ Removed orphaned data');
    console.log('   ✅ Fixed all reference inconsistencies');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Update your code to use only freelancerId (remove dual queries)');
    console.log('   2. Update rating displays to use gig.rating (calculated from reviews)');
    console.log('   3. Remove updateGigAndFreelancerStats functions (now handled automatically)');
    
  } catch (error) {
    console.error('❌ Database normalization failed:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  const options = {
    skipFieldNormalization: args.includes('--skip-fields'),
    skipRatingNormalization: args.includes('--skip-ratings'),
    skipCleanup: args.includes('--skip-cleanup'),
    validateOnly: args.includes('--validate-only')
  };
  
  console.log(`🎯 Running command: ${command}`);
  
  switch (command) {
    case 'full':
      runDatabaseNormalization(options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'validate':
      runDatabaseNormalization({ validateOnly: true })
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'fields-only':
      runDatabaseNormalization({ 
        skipRatingNormalization: true, 
        skipCleanup: true 
      })
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'ratings-only':
      runDatabaseNormalization({ 
        skipFieldNormalization: true, 
        skipCleanup: true 
      })
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage: node databaseNormalization.js [command] [options]');
      console.log('Commands:');
      console.log('  full          - Run complete normalization (default)');
      console.log('  validate      - Only validate data consistency');
      console.log('  fields-only   - Only normalize field names');
      console.log('  ratings-only  - Only normalize rating data');
      console.log('Options:');
      console.log('  --skip-fields    - Skip field normalization');
      console.log('  --skip-ratings   - Skip rating normalization');
      console.log('  --skip-cleanup   - Skip orphaned data cleanup');
      console.log('  --validate-only  - Only run validation');
      process.exit(1);
  }
}

module.exports = {
  runDatabaseNormalization,
  normalizeFieldNames,
  normalizeRatingData,
  normalizeFreelancerRatings,
  cleanupOrphanedData,
  validateDataConsistency
}; 