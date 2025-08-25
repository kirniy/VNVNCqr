const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

async function createAdminUser() {
  const userId = 'HO08WDxCS1ZZiYVUc7LsJhHRTny2';
  
  try {
    await setDoc(doc(db, 'users', userId), {
      email: 'admin@angar.club',
      role: 'admin',
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@angar.club');
    console.log('🔑 Password: shtaket2025');
    console.log('🌐 Login at: https://events-test-15e71.web.app/admin/login');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();