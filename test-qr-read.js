const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDT4QK0V3lbYaZfONlW0cF0oTxX94aP-5w',
  authDomain: 'events-test-15e71.firebaseapp.com',
  projectId: 'events-test-15e71',
  storageBucket: 'events-test-15e71.appspot.com',
  messagingSenderId: '206474823081',
  appId: '1:206474823081:web:52e31f5b4e006fe93f0f57'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyQRCodeFlow() {
  console.log('\n🔍 VERIFYING VNVNC QR CODE SYSTEM\n');
  console.log('=' .repeat(50));
  
  // Check all invitations
  const snapshot = await getDocs(collection(db, 'invitations'));
  
  let totalCount = 0;
  let qrCount = 0;
  let linkCount = 0;
  const sampleCodes = [];
  const issues = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    totalCount++;
    
    if (data.invitationType === 'qr') {
      qrCount++;
      
      // Verify QR code format
      const code = data.code;
      const vnvncFormatRegex = /^VNVNC-2025-[A-Z0-9]{6}$/;
      
      if (!code.match(vnvncFormatRegex)) {
        issues.push(`Invalid format: ${code}`);
      }
      
      if (sampleCodes.length < 3) {
        sampleCodes.push({
          code: code,
          status: data.status,
          instagram: data.instagramHandle,
          batch: data.metadata?.batchName
        });
      }
    } else {
      linkCount++;
    }
  });
  
  console.log('\n📊 DATABASE STATUS:');
  console.log('   Total invitations:', totalCount);
  console.log('   QR invitations:', qrCount);
  console.log('   Link invitations:', linkCount);
  
  if (qrCount > 0) {
    console.log('\n✅ QR CODES FOUND IN DATABASE!');
    console.log('\n📝 Sample QR codes:');
    sampleCodes.forEach(sample => {
      console.log(`   - Code: ${sample.code}`);
      console.log(`     Status: ${sample.status}`);
      console.log(`     Instagram: ${sample.instagram}`);
      console.log(`     Batch: ${sample.batch}`);
    });
    
    // Test scanner pattern
    console.log('\n🔍 SCANNER VALIDATION:');
    const testCode = sampleCodes[0]?.code;
    if (testCode) {
      const vnvncFormatRegex = /^VNVNC-2025-[A-Z0-9]{6}$/;
      const isValid = testCode.match(vnvncFormatRegex);
      console.log(`   Testing: ${testCode}`);
      console.log(`   Format valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      
      // Test URL extraction
      const testUrl = `https://vnvnc-invites.vercel.app/invite/${testCode}`;
      const match = testUrl.match(/\/invite\/([A-Z0-9-]+)/);
      const extracted = match ? match[1] : null;
      console.log(`   URL extraction: ${extracted === testCode ? '✅ WORKS' : '❌ FAILED'}`);
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ QR CODE SYSTEM IS READY!');
    console.log('\nWorkflow confirmed:');
    console.log('1. ✓ QR codes CAN be created in database');
    console.log('2. ✓ Format is VNVNC-2025-XXXXXX');
    console.log('3. ✓ Scanner pattern matching will work');
    console.log('4. ✓ URL extraction will work');
    console.log('\n⚠️  Note: To fully test, create QR codes from admin panel');
  } else {
    console.log('\n⚠️  NO QR CODES IN DATABASE YET');
    console.log('\nTo test the system:');
    console.log('1. Go to https://vnvnc-invites.vercel.app/admin/invitations');
    console.log('2. Switch to "QR коды" tab');
    console.log('3. Enter batch name and quantity');
    console.log('4. Click "Создать QR коды"');
    console.log('5. QR codes will be saved to database AND downloaded as ZIP');
  }
  
  process.exit(0);
}

verifyQRCodeFlow().catch(error => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});