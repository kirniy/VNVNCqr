const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } = require('firebase/firestore');

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

async function checkFirestore() {
  console.log('\n=== CHECKING FIRESTORE DATA ===\n');
  
  try {
    // 1. Check scanLogs
    console.log('1. Checking scanLogs collection...');
    const scanLogsQuery = query(collection(db, 'scanLogs'), orderBy('timestamp', 'desc'), limit(10));
    const scanLogsSnapshot = await getDocs(scanLogsQuery);
    
    console.log(`Found ${scanLogsSnapshot.size} scan logs\n`);
    
    if (scanLogsSnapshot.size === 0) {
      console.log('❌ No scan logs found! This explains why "Нет логов для отображения"\n');
      
      // Try to create a test log
      console.log('Creating a test scan log...');
      try {
        const testLog = await addDoc(collection(db, 'scanLogs'), {
          code: 'TEST-CODE',
          success: false,
          error: 'Test log creation',
          timestamp: serverTimestamp(),
          username: 'test-script',
          userAgent: 'Node.js',
          platform: 'test'
        });
        console.log('✅ Test log created with ID:', testLog.id);
      } catch (error) {
        console.error('❌ Failed to create test log:', error.message);
        console.log('This suggests a permissions issue with writing to scanLogs');
      }
    } else {
      scanLogsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Log ${doc.id}:`);
        console.log(`  Code: ${data.code}`);
        console.log(`  Success: ${data.success}`);
        console.log(`  Error: ${data.error || 'none'}`);
        console.log(`  Username: ${data.username}`);
        console.log('');
      });
    }
    
    // 2. Check a sample of invitations
    console.log('\n2. Checking invitation codes...');
    const invitationsQuery = query(collection(db, 'invitations'), limit(5));
    const invitationsSnapshot = await getDocs(invitationsQuery);
    
    const oldRegex = /^ANGAR-\d{4}-\d{4}$/;
    const newRegex = /^ANGAR-B[A-Z0-9]{5}-[A-Z0-9]+$/;
    
    console.log('Sample invitation codes and their format validity:\n');
    invitationsSnapshot.forEach(doc => {
      const code = doc.data().code;
      const oldMatch = oldRegex.test(code);
      const newMatch = newRegex.test(code);
      
      console.log(`Code: ${code}`);
      console.log(`  Old format: ${oldMatch}, New format: ${newMatch}`);
      console.log(`  Would scanner accept? ${oldMatch || newMatch ? '✅ YES' : '❌ NO - Would show НЕВЕРНЫЙ ФОРМАТ'}`);
      console.log('');
    });
    
    // 3. Check what happens with URL extraction
    console.log('\n3. Testing URL extraction logic...');
    const testUrls = [
      'https://angarqr.web.app/v/ANGAR-2025-0020',
      'https://angarqr.web.app/v/ANGAR-BNFBP5-3UK5KR69KG54TNY',
      'ANGAR-2025-0020',
      'ANGAR-BNFBP5-3UK5KR69KG54TNY'
    ];
    
    testUrls.forEach(url => {
      let code = url;
      if (url.includes('/v/')) {
        const match = url.match(/\/v\/([A-Z0-9-]+)/);
        code = match ? match[1] : url;
      }
      
      const oldMatch = oldRegex.test(code);
      const newMatch = newRegex.test(code);
      
      console.log(`\nInput: ${url}`);
      console.log(`Extracted: ${code}`);
      console.log(`Valid: ${oldMatch || newMatch ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Full error:', error.stack);
  }
  
  process.exit();
}

checkFirestore();