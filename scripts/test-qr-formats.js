// Test script to check QR code formats in database
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

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

async function testFormats() {
  console.log('\n=== Testing QR Code Formats ===\n');
  
  // Test regex patterns (updated to match actual format)
  const oldFormatRegex = /^ANGAR-\d{4}-\d{4}$/;
  const newFormatRegex = /^ANGAR-B[A-Z0-9]{5}-[A-Z0-9]+$/;
  
  // Test cases
  const testCodes = [
    'ANGAR-2025-0020',  // Old format
    'ANGAR-BX7K9M-2P8N4Q6R5T7Y9',  // New format
    'https://angarqr.web.app/v/ANGAR-2025-0020',  // URL with old format
    'https://angarqr.web.app/v/ANGAR-BX7K9M-2P8N4Q6R5T7Y9',  // URL with new format
  ];
  
  console.log('Testing regex patterns:');
  testCodes.forEach(code => {
    console.log(`\nTesting: ${code}`);
    
    // Extract code from URL if needed
    let extractedCode = code;
    if (code.includes('/v/')) {
      const match = code.match(/\/v\/([A-Z0-9-]+)/);
      extractedCode = match ? match[1] : code;
      console.log(`Extracted: ${extractedCode}`);
    }
    
    const matchesOld = oldFormatRegex.test(extractedCode);
    const matchesNew = newFormatRegex.test(extractedCode);
    
    console.log(`  Old format match: ${matchesOld}`);
    console.log(`  New format match: ${matchesNew}`);
    console.log(`  Valid: ${matchesOld || matchesNew}`);
  });
  
  // Check actual database codes
  console.log('\n\n=== Checking Database Codes ===\n');
  
  try {
    const invitationsSnapshot = await getDocs(
      query(collection(db, 'invitations'), limit(10))
    );
    
    console.log(`Found ${invitationsSnapshot.size} invitations:\n`);
    
    invitationsSnapshot.forEach(doc => {
      const data = doc.data();
      const code = data.code;
      
      const matchesOld = oldFormatRegex.test(code);
      const matchesNew = newFormatRegex.test(code);
      
      console.log(`Code: ${code}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Old format: ${matchesOld}, New format: ${matchesNew}`);
      console.log(`  Valid: ${matchesOld || matchesNew ? '✅' : '❌'}`);
      console.log('');
    });
    
    // Check scan logs
    const logsSnapshot = await getDocs(
      query(collection(db, 'scanLogs'), limit(5))
    );
    
    if (logsSnapshot.size > 0) {
      console.log(`\n=== Recent Scan Logs ===\n`);
      logsSnapshot.forEach(doc => {
        const log = doc.data();
        console.log(`Code: ${log.code}`);
        console.log(`  Success: ${log.success}`);
        console.log(`  Error: ${log.error || 'none'}`);
        console.log(`  Time: ${log.timestamp?.toDate?.() || log.timestamp}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No scan logs found in database');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
  
  process.exit();
}

testFormats();