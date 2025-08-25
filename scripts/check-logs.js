const admin = require('firebase-admin');
const serviceAccount = require('../events-test-15e71-firebase-adminsdk-4dh3w-66c0c77e8b.json');

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://events-test-15e71.firebaseio.com'
});

const db = admin.firestore();

async function checkLogs() {
  try {
    console.log('\n=== CHECKING SCAN LOGS ===\n');
    
    // Get scan logs
    const logsSnapshot = await db.collection('scanLogs')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    console.log(`Found ${logsSnapshot.size} scan logs (showing last 20):\n`);
    
    let errorCount = 0;
    let successCount = 0;
    const errorTypes = {};
    
    logsSnapshot.forEach(doc => {
      const log = doc.data();
      const timestamp = log.timestamp?.toDate?.() || new Date(log.timestamp);
      
      if (log.success) {
        successCount++;
      } else {
        errorCount++;
        errorTypes[log.error || 'Unknown'] = (errorTypes[log.error || 'Unknown'] || 0) + 1;
      }
      
      console.log(`[${timestamp.toLocaleString()}] ${log.success ? '✅' : '❌'} ${log.code?.substring(0, 20)}... ${log.error || ''}`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Error rate: ${logsSnapshot.size > 0 ? (errorCount / logsSnapshot.size * 100).toFixed(1) : 0}%`);
    
    if (Object.keys(errorTypes).length > 0) {
      console.log('\nError types:');
      Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([error, count]) => {
          console.log(`  - ${error}: ${count} times`);
        });
    }
    
    // Check for common issues
    console.log('\n=== CHECKING FOR COMMON ISSUES ===\n');
    
    // Check batches with mismatched counts
    const batchesSnapshot = await db.collection('batches').get();
    console.log(`Checking ${batchesSnapshot.size} batches for count mismatches...\n`);
    
    for (const batchDoc of batchesSnapshot.docs) {
      const batch = batchDoc.data();
      
      // Count actual redeemed invitations
      const redeemedSnapshot = await db.collection('invitations')
        .where('metadata.batchId', '==', batchDoc.id)
        .where('status', '==', 'redeemed')
        .get();
      
      const actualRedeemed = redeemedSnapshot.size;
      const recordedRedeemed = batch.redeemedCount || 0;
      
      if (actualRedeemed !== recordedRedeemed) {
        console.log(`⚠️  Batch "${batch.name}" (${batchDoc.id}):`);
        console.log(`   Recorded: ${recordedRedeemed}, Actual: ${actualRedeemed}`);
        console.log(`   Total: ${batch.totalCount}, Activation: ${(actualRedeemed / batch.totalCount * 100).toFixed(1)}%`);
      }
    }
    
    // Check for orphaned invitations
    const invitationsSnapshot = await db.collection('invitations')
      .where('status', '==', 'redeemed')
      .limit(100)
      .get();
    
    let orphanedCount = 0;
    for (const invDoc of invitationsSnapshot.docs) {
      const inv = invDoc.data();
      if (!inv.metadata?.batchId) {
        orphanedCount++;
      }
    }
    
    if (orphanedCount > 0) {
      console.log(`\n⚠️  Found ${orphanedCount} redeemed invitations without batch IDs`);
    }
    
  } catch (error) {
    console.error('Error checking logs:', error);
  } finally {
    process.exit();
  }
}

checkLogs();