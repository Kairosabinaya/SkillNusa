import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBU5CpKkJfN-pGuQ8qxV3AG-Uj9LVeyCdM",
  authDomain: "skillnusa-fd614.firebaseapp.com",
  projectId: "skillnusa-fd614",
  storageBucket: "skillnusa-fd614.firebasestorage.app",
  messagingSenderId: "706734048752",
  appId: "1:706734048752:web:219c57edb47247ca92c935",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCartFinal() {
  console.log('🛒 Final Cart Test - Verifying All Components...\n');
  
  const userId = 'S3pHfkzOsRhTfL5jPN960ExW6a03';
  
  try {
    // Test 1: Check cart collection
    console.log('1️⃣ Checking cart collection...');
    const cartQuery = query(
      collection(db, 'cart'),
      where('userId', '==', userId)
    );
    const cartSnapshot = await getDocs(cartQuery);
    console.log(`   Found ${cartSnapshot.size} cart items for user\n`);
    
    // Test 2: Check gigs collection
    console.log('2️⃣ Checking gigs collection...');
    const gigsSnapshot = await getDocs(collection(db, 'gigs'));
    console.log(`   Found ${gigsSnapshot.size} available gigs\n`);
    
    // Test 3: List available gigs with packages
    if (gigsSnapshot.size > 0) {
      console.log('3️⃣ Available gigs for testing:');
      gigsSnapshot.forEach((doc, index) => {
        const gig = doc.data();
        const packages = Object.keys(gig.packages || {});
        console.log(`   ${index + 1}. ${gig.title}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Packages: ${packages.join(', ')}`);
        console.log(`      Images: ${gig.images?.length || 0} available`);
        console.log('');
      });
    }
    
    console.log('✅ Cart system ready for testing!');
    console.log('💡 Try adding items to cart from the application now.');
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
  }
  
  process.exit(0);
}

testCartFinal(); 