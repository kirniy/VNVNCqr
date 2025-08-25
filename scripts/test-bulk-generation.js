const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } = require('firebase/firestore');
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

async function generateBulkQRCodes(count) {
  console.log(`🚀 Starting bulk generation of ${count} QR codes\n`);
  
  try {
    // Authenticate
    await signInWithEmailAndPassword(auth, 'admin@angar.club', 'shtaket2025');
    console.log('✅ Authenticated as admin\n');
    
    // Create batch document
    console.log('📦 Creating batch document...');
    const batchDoc = await addDoc(collection(db, 'batches'), {
      name: `ТЕСТ ПАРТИЯ ${count} КОДОВ`,
      createdAt: serverTimestamp(),
      createdBy: 'admin@angar.club',
      totalCount: count,
      redeemedCount: 0,
      prefix: 'ANGAR',
    });
    console.log(`✅ Batch created with ID: ${batchDoc.id}\n`);
    
    // Generate codes
    console.log(`⚡ Generating ${count} invitation codes...`);
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      const year = new Date().getFullYear();
      const code = `ANGAR-${year}-${(i + 1).toString().padStart(4, '0')}`;
      
      promises.push(
        addDoc(collection(db, 'invitations'), {
          code,
          status: 'active',
          createdAt: serverTimestamp(),
          eventInfo: {
            name: 'ТЕХНИЧЕСКИЕ',
            date: new Date('2025-08-22'),
            venue: 'ANGAR NIGHTCLUB',
          },
          metadata: {
            batchId: batchDoc.id,
          },
        })
      );
      
      // Log progress every 10 codes
      if ((i + 1) % 10 === 0) {
        console.log(`   Generated ${i + 1}/${count} codes...`);
      }
    }
    
    // Save all to database
    console.log('\n💾 Saving to database...');
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Successfully generated ${count} QR codes in ${duration} seconds!`);
    console.log(`   Average: ${(duration / count * 1000).toFixed(2)}ms per code`);
    console.log(`   Batch ID: ${batchDoc.id}`);
    console.log(`   Codes: ANGAR-${new Date().getFullYear()}-0001 to ANGAR-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`);
    
    return {
      batchId: batchDoc.id,
      count,
      duration,
      codesGenerated: count
    };
    
  } catch (error) {
    console.error('❌ Error during bulk generation:', error.message);
    throw error;
  }
}

// Run the test
const count = parseInt(process.argv[2]) || 100;
generateBulkQRCodes(count).then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});