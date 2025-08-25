// Setup script for VNVNC admin account
// Run this after adding Firebase credentials to create admin user

const admin = require('firebase-admin');

// Initialize with your service account (download from Firebase Console)
// Go to Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'admin@vnvnc.club';
  const password = 'VNVNC2025Birthday!';
  
  try {
    // Create user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'VNVNC Admin',
      emailVerified: true
    });
    
    console.log('✅ Admin user created:', userRecord.uid);
    
    // Set admin custom claim
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
    console.log('✅ Admin role assigned');
    
    // Create admin document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      role: 'admin',
      name: 'VNVNC Admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Admin document created in Firestore');
    console.log('\n📧 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🔗 Admin panel URL:');
    console.log('https://vnvnc-invites-1w14z9k03-kirniys-projects.vercel.app/admin');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Admin user already exists');
      // Update password
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password: password });
      console.log('✅ Password updated');
      console.log('\n📧 Login credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('Error creating admin:', error);
    }
  }
}

createAdminUser();