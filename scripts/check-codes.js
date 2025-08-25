const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkInvitations() {
  const snapshot = await db.collection('invitations').limit(10).get();
  console.log('Sample invitations in database:');
  console.log('==========================');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Code: ${data.code}`);
    console.log(`Status: ${data.status}`);
    console.log(`Batch ID: ${data.metadata?.batchId || 'N/A'}`);
    console.log('---');
  });
}

checkInvitations().then(() => process.exit(0)).catch(console.error);