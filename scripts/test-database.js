const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit, orderBy } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4LniaD5_pttGam6fUz_8ZZIcdeDO8irg",
  authDomain: "events-test-15e71.firebaseapp.com",
  projectId: "events-test-15e71",
  storageBucket: "events-test-15e71.firebasestorage.app",
  messagingSenderId: "746299244971",
  appId: "1:746299244971:web:5602da2873251e5c4452ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testDatabase() {
  console.log('🔍 Testing AngarQR Database Connection...\n');
  
  try {
    // First authenticate as admin
    console.log('1. Authenticating as admin...');
    await signInWithEmailAndPassword(auth, 'admin@angar.club', 'shtaket2025');
    console.log('✅ Authentication successful!\n');
    
    // Check users collection
    console.log('2. Checking users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ Found ${usersSnapshot.size} users:`);
    usersSnapshot.forEach(doc => {
      console.log(`   - ${doc.id}: ${doc.data().email} (${doc.data().role})`);
    });
    
    // Check batches collection
    console.log('\n3. Checking batches collection...');
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'), limit(5));
    const batchesSnapshot = await getDocs(batchesQuery);
    console.log(`✅ Found ${batchesSnapshot.size} batches:`);
    if (batchesSnapshot.empty) {
      console.log('   No batches created yet');
    } else {
      batchesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name} (${data.totalCount} codes, ${data.redeemedCount} redeemed)`);
      });
    }
    
    // Check invitations collection
    console.log('\n4. Checking invitations collection...');
    const invitationsQuery = query(collection(db, 'invitations'), limit(10));
    const invitationsSnapshot = await getDocs(invitationsQuery);
    console.log(`✅ Found ${invitationsSnapshot.size} invitations:`);
    if (invitationsSnapshot.empty) {
      console.log('   No invitations created yet');
    } else {
      invitationsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.code}: ${data.status} (created: ${data.createdAt?.toDate?.() || 'N/A'})`);
      });
    }
    
    console.log('\n✅ Database test completed successfully!');
    console.log('📌 Admin URL: https://events-test-15e71.web.app/admin/login');
    console.log('📌 Scanner URL: https://events-test-15e71.web.app/telegram');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
  
  process.exit(0);
}

testDatabase();