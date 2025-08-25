const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAz4L_z5hHKycKzaHINu84TQYR6vMeM_Zg",
  authDomain: "events-test-15e71.firebaseapp.com",
  projectId: "events-test-15e71",
  storageBucket: "events-test-15e71.firebasestorage.app",
  messagingSenderId: "466566367519",
  appId: "1:466566367519:web:25a49cf9c69b38e80e02a5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkBatches() {
  console.log('\n=== CHECKING BATCH AND CODE MISMATCH ===\n');
  
  try {
    // Get recent batches
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'), limit(5));
    const batchesSnapshot = await getDocs(batchesQuery);
    
    console.log(`Found ${batchesSnapshot.size} recent batches:\n`);
    
    for (const batchDoc of batchesSnapshot.docs) {
      const batch = batchDoc.data();
      console.log(`\nBatch: ${batch.name}`);
      console.log(`ID: ${batchDoc.id}`);
      console.log(`Total codes: ${batch.totalCount}`);
      console.log(`Created: ${batch.createdAt?.toDate ? batch.createdAt.toDate() : batch.createdAt}`);
      
      // Check first few codes in batch
      if (batch.invitationCodes && batch.invitationCodes.length > 0) {
        console.log(`Sample codes from batch:`);
        batch.invitationCodes.slice(0, 3).forEach(code => {
          console.log(`  - ${code}`);
          // Extract batch ID from code
          const parts = code.split('-');
          if (parts[1] && parts[1].startsWith('B')) {
            console.log(`    Batch ID in code: ${parts[1]}`);
            console.log(`    Expected from batch ID: B${batchDoc.id.substring(0, 5).toUpperCase()}`);
          }
        });
      }
      
      // Check if invitations actually exist for this batch
      const invQuery = query(collection(db, 'invitations'), where('metadata.batchId', '==', batchDoc.id));
      const invSnapshot = await getDocs(invQuery);
      console.log(`\nActual invitations in database for this batch: ${invSnapshot.size}`);
      
      if (invSnapshot.size > 0) {
        console.log('Sample invitation codes from database:');
        invSnapshot.docs.slice(0, 3).forEach(doc => {
          console.log(`  - ${doc.data().code}`);
        });
      }
      
      if (batch.totalCount !== invSnapshot.size) {
        console.log(`\n⚠️  MISMATCH: Batch says ${batch.totalCount} codes, but only ${invSnapshot.size} invitations exist!`);
      }
    }
    
    // Check the specific code pattern
    console.log('\n\n=== CHECKING SPECIFIC CODE PATTERN ===\n');
    const testCode = 'ANGAR-BNFBP5-FGZ2BAMMCU50LVE';
    console.log(`Looking for batch with pattern BNFBP5...`);
    
    // Find batch that should contain this code
    const allBatches = await getDocs(collection(db, 'batches'));
    let foundBatch = null;
    
    allBatches.forEach(doc => {
      const expectedPattern = `B${doc.id.substring(0, 5).toUpperCase()}`;
      if (expectedPattern === 'BNFBP5') {
        foundBatch = { id: doc.id, data: doc.data() };
        console.log(`\n✅ Found matching batch!`);
        console.log(`Batch ID: ${doc.id}`);
        console.log(`Batch name: ${doc.data().name}`);
      }
    });
    
    if (!foundBatch) {
      console.log('\n❌ No batch found with pattern BNFBP5');
      console.log('This might mean the batch was created with different ID generation logic');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit();
}

checkBatches();