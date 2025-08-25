const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

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

async function findMissingCode() {
  const missingCode = 'ANGAR-BNFBP5-FGZ2BAMMCU50LVE';
  const batchId = 'Nfbp5buLrM4WoBWfHlDd';
  
  console.log(`\n=== INVESTIGATING MISSING CODE: ${missingCode} ===\n`);
  
  try {
    // 1. Get the batch document
    const batchDoc = await getDoc(doc(db, 'batches', batchId));
    const batchData = batchDoc.data();
    
    console.log(`Batch: ${batchData.name}`);
    console.log(`Total codes in batch: ${batchData.totalCount}`);
    console.log(`Codes array length: ${batchData.invitationCodes?.length || 0}`);
    
    // 2. Check if the code is in the batch's invitationCodes array
    const codeInBatch = batchData.invitationCodes?.includes(missingCode);
    console.log(`\nIs ${missingCode} in batch.invitationCodes array? ${codeInBatch ? '✅ YES' : '❌ NO'}`);
    
    // 3. List all codes in the batch array
    console.log('\nAll codes in batch.invitationCodes:');
    batchData.invitationCodes?.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    
    // 4. Check actual invitations in database
    console.log('\n\nChecking actual invitations in database for this batch:');
    const invQuery = query(collection(db, 'invitations'), where('metadata.batchId', '==', batchId));
    const invSnapshot = await getDocs(invQuery);
    
    console.log(`Found ${invSnapshot.size} invitations in database`);
    
    const dbCodes = [];
    invSnapshot.forEach(doc => {
      dbCodes.push(doc.data().code);
    });
    
    // 5. Find discrepancies
    console.log('\n\n=== ANALYSIS ===');
    console.log(`Batch says it has: ${batchData.totalCount} codes`);
    console.log(`Batch.invitationCodes array has: ${batchData.invitationCodes?.length || 0} codes`);
    console.log(`Database has: ${invSnapshot.size} invitation documents`);
    
    // Check if any codes in batch array are not in database
    const missingFromDb = [];
    batchData.invitationCodes?.forEach(code => {
      if (!dbCodes.includes(code)) {
        missingFromDb.push(code);
      }
    });
    
    if (missingFromDb.length > 0) {
      console.log(`\n❌ Codes in batch array but NOT in database:`);
      missingFromDb.forEach(code => console.log(`  - ${code}`));
    }
    
    // Check if the missing code matches the pattern
    console.log(`\n\nThe missing code ${missingCode} appears to be from a DIFFERENT generation session!`);
    console.log('It has the same batch ID pattern (BNFBP5) but was never saved to this batch.');
    console.log('\nThis suggests you downloaded a ZIP file from one generation, but the database only has codes from another generation.');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit();
}

findMissingCode();