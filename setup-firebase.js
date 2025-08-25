// Firebase setup script for VNVNC Birthday Event
// This creates the admin account directly in the app

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForVNVNC2025",
  authDomain: "vnvnc-invites.firebaseapp.com",
  projectId: "vnvnc-invites",
  storageBucket: "vnvnc-invites.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:vnvnc2025birthday"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminAccount() {
  const email = 'admin@vnvnc.ru';
  const password = 'VNVNC2025';
  
  try {
    // Create the admin user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Admin account created:', user.uid);
    
    // Add admin role to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: 'admin',
      name: 'VNVNC Admin',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Admin role assigned in Firestore');
    
    // Test sign in
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login test successful');
    
    console.log('\n🎉 Setup complete!');
    console.log('📧 Email: admin@vnvnc.ru');
    console.log('🔑 Password: VNVNC2025');
    console.log('🔗 Admin URL: https://vnvnc-invites-1w14z9k03-kirniys-projects.vercel.app/admin');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  Admin account already exists');
      // Try to sign in
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login successful with existing account');
        console.log('\n📧 Email: admin@vnvnc.ru');
        console.log('🔑 Password: VNVNC2025');
      } catch (loginError) {
        console.log('❌ Password may be different. Please reset it in Firebase Console.');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  process.exit(0);
}

createAdminAccount();