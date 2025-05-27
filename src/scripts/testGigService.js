/**
 * Test Gig Service Script
 * 
 * Simple test to check if gigService can fetch data
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug: log config to make sure it's loaded
console.log('🔧 Firebase Config Check:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   API Key: ${firebaseConfig.apiKey ? '✅ Loaded' : '❌ Missing'}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testGigService() {
  console.log('\n🧪 Testing Gig Service...');
  
  try {
    // Test 1: Import gigService and test getGigs
    console.log('\n1️⃣ Testing gigService.getGigs()...');
    
    // We'll manually implement a simple version to test
    const { collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
    
    // Test basic query without filters
    console.log('   Testing basic query (no filters)...');
    const gigsRef = collection(db, 'gigs');
    const snapshot = await getDocs(gigsRef);
    
    console.log(`   📊 Raw gigs in database: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`     • ${doc.id}: ${data.title} (active: ${data.isActive})`);
      });
    }
    
    // Test with isActive filter
    console.log('\n   Testing with isActive filter...');
    const activeGigsQuery = query(
      gigsRef,
      where('isActive', '==', true)
    );
    const activeSnapshot = await getDocs(activeGigsQuery);
    
    console.log(`   📊 Active gigs: ${activeSnapshot.size}`);
    
    if (activeSnapshot.size > 0) {
      activeSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`     • ${doc.id}: ${data.title}`);
      });
    }
    
    // Test with full query (like gigService)
    console.log('\n   Testing full query (like gigService)...');
    const fullQuery = query(
      gigsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    try {
      const fullSnapshot = await getDocs(fullQuery);
      console.log(`   📊 Full query result: ${fullSnapshot.size}`);
      
      if (fullSnapshot.size > 0) {
        fullSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`     • ${doc.id}: ${data.title}`);
        });
      }
    } catch (queryError) {
      console.log(`   ❌ Full query failed: ${queryError.message}`);
      
      // Try without orderBy
      console.log('   Trying without orderBy...');
      const simpleQuery = query(
        gigsRef,
        where('isActive', '==', true),
        limit(50)
      );
      
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log(`   📊 Simple query result: ${simpleSnapshot.size}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n✅ Test completed!');
}

testGigService(); 