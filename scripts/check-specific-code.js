const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

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

async function checkCode() {
  const testCode = 'ANGAR-BNFBP5-FGZ2BAMMCU50LVE';
  
  console.log(`\n=== Checking if ${testCode} exists in database ===\n`);
  
  try {
    // Check if this exact code exists
    const q = query(collection(db, 'invitations'), where('code', '==', testCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ Code NOT FOUND in database!');
      console.log('This would show: "КОД НЕ НАЙДЕН"\n');
      
      // Let's check what codes DO exist with this batch ID
      console.log('Checking codes with batch ID BNFBP5...\n');
      
      const batchQuery = query(collection(db, 'invitations'), where('metadata.batchId', '==', 'nFBP5qnz0p5DH3fOa7EI'));
      const batchSnapshot = await getDocs(batchQuery);
      
      if (!batchSnapshot.empty) {
        console.log(`Found ${batchSnapshot.size} codes in same batch:`);
        batchSnapshot.forEach(doc => {
          console.log(`  - ${doc.data().code}`);
        });
      }
      
      // Let's check all codes that start with ANGAR-B
      console.log('\n\nChecking all new format codes...');
      const allInvitations = await getDocs(collection(db, 'invitations'));
      const newFormatCodes = [];
      
      allInvitations.forEach(doc => {
        const code = doc.data().code;
        if (code.startsWith('ANGAR-B')) {
          newFormatCodes.push(code);
        }
      });
      
      console.log(`\nFound ${newFormatCodes.length} new format codes:`);
      newFormatCodes.slice(0, 10).forEach(code => {
        console.log(`  - ${code}`);
      });
      
    } else {
      console.log('✅ Code FOUND in database!');
      const data = snapshot.docs[0].data();
      console.log(`Status: ${data.status}`);
      console.log(`Batch ID: ${data.metadata?.batchId}`);
      console.log(`Created: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit();
}

checkCode();