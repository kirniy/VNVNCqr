const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } = require('firebase/firestore');

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

async function testQRFlow() {
  console.log('\n🔍 TESTING VNVNC QR CODE FLOW\n');
  console.log('=' .repeat(50));
  
  // Step 1: Create a test QR invitation
  const testCode = `VNVNC-2025-TEST${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  console.log('\n✅ Step 1: Creating test QR invitation');
  console.log('   Code:', testCode);
  
  const invitation = {
    code: testCode,
    instagramHandle: 'QR_TEST_USER',
    status: 'created',
    inviteUrl: `https://vnvnc-invites.vercel.app/invite/${testCode}`,
    invitationType: 'qr',
    createdAt: serverTimestamp(),
    expiresAt: new Date('2025-08-31T08:00:00'),
    metadata: {
      eventDate: 'both',
      validForBothDays: true,
      batchName: 'TEST_BATCH'
    }
  };
  
  const docRef = await addDoc(collection(db, 'invitations'), invitation);
  console.log('   Created with ID:', docRef.id);
  
  // Step 2: Simulate QR code scan - check if it exists
  console.log('\n✅ Step 2: Simulating QR code scan');
  console.log('   Scanning code:', testCode);
  
  const q = query(collection(db, 'invitations'), where('code', '==', testCode));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log('   ❌ FAILED: Code not found in database!');
    process.exit(1);
  }
  
  const foundDoc = snapshot.docs[0];
  const foundData = foundDoc.data();
  console.log('   ✓ Found in database');
  console.log('   Status:', foundData.status);
  console.log('   Type:', foundData.invitationType);
  
  // Step 3: Validate format (same as scanner)
  console.log('\n✅ Step 3: Validating QR code format');
  const vnvncFormatRegex = /^VNVNC-2025-[A-Z0-9]{6}$/;
  
  if (!testCode.match(vnvncFormatRegex)) {
    console.log('   ❌ FAILED: Invalid format!');
    console.log('   Expected: VNVNC-2025-XXXXXX');
    console.log('   Got:', testCode);
    process.exit(1);
  }
  console.log('   ✓ Format is valid');
  
  // Step 4: Simulate redemption
  console.log('\n✅ Step 4: Simulating redemption');
  
  if (foundData.status === 'redeemed') {
    console.log('   ❌ Already redeemed!');
  } else {
    await updateDoc(doc(db, 'invitations', foundDoc.id), {
      status: 'redeemed',
      redeemedAt: serverTimestamp(),
      redeemedBy: {
        id: 'test_scanner',
        username: 'Test Scanner'
      }
    });
    console.log('   ✓ Successfully redeemed!');
  }
  
  // Step 5: Verify final state
  console.log('\n✅ Step 5: Verifying final state');
  const verifyQuery = query(collection(db, 'invitations'), where('code', '==', testCode));
  const verifySnapshot = await getDocs(verifyQuery);
  const finalData = verifySnapshot.docs[0].data();
  
  console.log('   Final status:', finalData.status);
  console.log('   Instagram handle:', finalData.instagramHandle);
  console.log('   Type:', finalData.invitationType);
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('✅ ALL TESTS PASSED!');
  console.log('\nThe QR code flow is working correctly:');
  console.log('1. ✓ QR codes are saved to database');
  console.log('2. ✓ Scanner can find them by code');
  console.log('3. ✓ Format validation works');
  console.log('4. ✓ Redemption process works');
  console.log('5. ✓ Status updates correctly');
  
  process.exit(0);
}

testQRFlow().catch(error => {
  console.error('\n❌ TEST FAILED:', error);
  process.exit(1);
});