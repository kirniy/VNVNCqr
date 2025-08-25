const admin = require('firebase-admin');

// Initialize without service account (will use default credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'events-test-15e71',
  });
}

const db = admin.firestore();

async function debugLogs() {
  console.log('\n=== DEBUGGING FIRESTORE LOGS ===\n');
  
  try {
    // 1. Check if scanLogs collection exists
    console.log('1. Checking scanLogs collection...');
    const scanLogsRef = db.collection('scanLogs');
    const scanLogsSnapshot = await scanLogsRef.limit(10).get();
    
    if (scanLogsSnapshot.empty) {
      console.log('❌ No documents found in scanLogs collection');
    } else {
      console.log(`✅ Found ${scanLogsSnapshot.size} documents in scanLogs`);
      console.log('\nRecent scan logs:');
      scanLogsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n  ID: ${doc.id}`);
        console.log(`  Code: ${data.code}`);
        console.log(`  Success: ${data.success}`);
        console.log(`  Error: ${data.error || 'none'}`);
        console.log(`  Timestamp: ${data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp}`);
        console.log(`  Username: ${data.username || 'unknown'}`);
      });
    }
    
    // 2. Check recent invitations
    console.log('\n\n2. Checking recent invitations...');
    const invitationsRef = db.collection('invitations');
    const invitationsSnapshot = await invitationsRef.limit(5).get();
    
    console.log(`Found ${invitationsSnapshot.size} invitations:`);
    invitationsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n  Code: ${data.code}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Batch ID: ${data.metadata?.batchId || 'none'}`);
    });
    
    // 3. Check batches
    console.log('\n\n3. Checking batches...');
    const batchesRef = db.collection('batches');
    const batchesSnapshot = await batchesRef.limit(3).get();
    
    console.log(`Found ${batchesSnapshot.size} batches:`);
    batchesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n  ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Total: ${data.totalCount}`);
      console.log(`  Redeemed: ${data.redeemedCount}`);
      if (data.invitationCodes && data.invitationCodes.length > 0) {
        console.log(`  Sample codes: ${data.invitationCodes.slice(0, 3).join(', ')}`);
      }
    });
    
    // 4. Test regex patterns
    console.log('\n\n4. Testing regex patterns...');
    const testCodes = [
      'ANGAR-2025-0020',
      'ANGAR-BNFBP5-3UK5KR69KG54TNY',
      'ANGAR-B12345-ABCDEFGHIJKLMNO',
    ];
    
    const oldRegex = /^ANGAR-\d{4}-\d{4}$/;
    const newRegex = /^ANGAR-B[A-Z0-9]{5}-[A-Z0-9]+$/;
    
    testCodes.forEach(code => {
      const oldMatch = oldRegex.test(code);
      const newMatch = newRegex.test(code);
      console.log(`\n  ${code}:`);
      console.log(`    Old format: ${oldMatch}`);
      console.log(`    New format: ${newMatch}`);
      console.log(`    Valid: ${oldMatch || newMatch ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. Make sure you are authenticated with Firebase CLI:');
      console.log('   Run: firebase login');
    }
  }
}

// Run with environment variable to use emulator if needed
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('Using Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST);
}

debugLogs().then(() => process.exit(0));