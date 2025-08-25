const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

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

async function generateTestQRCodes() {
  console.log('🎯 Testing QR Code Generation...\n');
  
  try {
    // Authenticate
    console.log('1. Authenticating...');
    await signInWithEmailAndPassword(auth, 'admin@angar.club', 'shtaket2025');
    console.log('✅ Authentication successful!\n');
    
    // Create test batch
    console.log('2. Creating test batch in database...');
    const batchDoc = await addDoc(collection(db, 'batches'), {
      name: 'TEST BATCH - ТЕХНИЧЕСКИЕ',
      createdAt: serverTimestamp(),
      createdBy: 'admin@angar.club',
      totalCount: 5,
      redeemedCount: 0,
      prefix: 'ANGAR',
    });
    console.log(`✅ Batch created with ID: ${batchDoc.id}\n`);
    
    // Generate 5 test QR codes
    console.log('3. Generating 5 test QR codes...');
    const testDir = path.join(process.cwd(), 'test-qr-codes');
    await fs.mkdir(testDir, { recursive: true });
    
    const year = new Date().getFullYear();
    const invitations = [];
    
    for (let i = 1; i <= 5; i++) {
      const code = `ANGAR-${year}-${String(i).padStart(4, '0')}`;
      
      // Generate basic QR code (server-side compatible)
      const qrDataUrl = await QRCode.toDataURL(`https://events-test-15e71.web.app/v/${code}`, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 800,
        margin: 0,
        color: {
          dark: '#00ff00', // Cyber green
          light: '#000000', // Black background
        },
      });
      
      // Save to file
      const base64Data = qrDataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(path.join(testDir, `${code}.png`), buffer);
      console.log(`   ✅ Generated: ${code}`);
      
      // Create invitation in database
      const invDoc = await addDoc(collection(db, 'invitations'), {
        code,
        status: 'active',
        createdAt: serverTimestamp(),
        eventInfo: {
          name: 'ТЕХНИЧЕСКИЕ',
          date: new Date('2024-08-22'),
          venue: 'ANGAR NIGHTCLUB',
        },
        metadata: {
          batchId: batchDoc.id,
        },
      });
      
      invitations.push({ id: invDoc.id, code });
    }
    
    console.log(`\n✅ All QR codes generated and saved to: ${testDir}`);
    console.log('✅ All invitations created in database\n');
    
    // Test one redemption
    console.log('4. Testing redemption of first QR code...');
    const testInvitation = invitations[0];
    
    // Simulate redemption through the API
    const response = await fetch('https://events-test-15e71.web.app/api/invitations/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: testInvitation.code,
        scannerId: 'test-scanner',
        scannerUsername: 'Test Scanner',
      }),
    });
    
    if (!response.ok) {
      console.log('⚠️  API endpoint not available (static export limitation)');
      console.log('   Redemption must be tested through the Telegram Mini App\n');
    }
    
    console.log('📱 Test URLs:');
    console.log('   Admin Dashboard: https://events-test-15e71.web.app/admin/dashboard');
    console.log('   Scanner App: https://events-test-15e71.web.app/telegram');
    console.log('\n📋 Test Credentials:');
    console.log('   Email: admin@angar.club');
    console.log('   Password: shtaket2025');
    console.log('\n🎯 Generated QR Codes:');
    invitations.forEach(inv => {
      console.log(`   - ${inv.code}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

generateTestQRCodes();