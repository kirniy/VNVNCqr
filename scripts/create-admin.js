#!/usr/bin/env node

console.log('\n🚀 AngarQR Admin Setup\n');
console.log('To create an admin user:\n');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/events-test-15e71/authentication/users');
console.log('2. Click "Add user"');
console.log('3. Enter email: admin@angar.club');
console.log('4. Set a secure password');
console.log('5. Click "Add user"');
console.log('6. Copy the User UID that appears');
console.log('\n7. Go to Firestore: https://console.firebase.google.com/project/events-test-15e71/firestore');
console.log('8. Create collection "users" if it doesn\'t exist');
console.log('9. Create document with ID = [User UID from step 6]');
console.log('10. Add these fields:');
console.log('    - email: "admin@angar.club"');
console.log('    - role: "admin"');
console.log('    - createdAt: (click timestamp button)');
console.log('\n✅ Then you can login at: https://events-test-15e71.web.app/admin/login\n');