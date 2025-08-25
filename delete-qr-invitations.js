const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with service account
const serviceAccount = require('./events-test-15e71-firebase-adminsdk-564yh-ea0a02b35f.json');

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'events-test-15e71'
});

const db = getFirestore();

async function deleteAllQRInvitations() {
  console.log('Deleting all QR invitations...');
  
  try {
    const snapshot = await db.collection('invitations')
      .where('invitationType', '==', 'qr')
      .get();
    
    if (snapshot.empty) {
      console.log('No QR invitations found to delete');
      return;
    }
    
    console.log(`Found ${snapshot.size} QR invitations to delete`);
    
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Successfully deleted ${snapshot.size} QR invitations`);
    
  } catch (error) {
    console.error('Error deleting QR invitations:', error);
  }
  
  process.exit(0);
}

deleteAllQRInvitations();