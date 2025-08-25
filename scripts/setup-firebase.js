#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 AngarQR Firebase Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env.local from template...');
  const envExample = fs.readFileSync('.env.example', 'utf8');
  fs.writeFileSync('.env.local', envExample);
  console.log('✅ Created .env.local - Please fill in your Firebase configuration\n');
} else {
  console.log('✅ .env.local already exists\n');
}

// Instructions
console.log('📋 Next Steps:\n');
console.log('1. Go to https://console.firebase.google.com');
console.log('2. Create a new project called "angarqr-production"');
console.log('3. Enable these services:');
console.log('   - Authentication (Email/Password)');
console.log('   - Firestore Database');
console.log('   - Hosting');
console.log('\n4. Get your config from Project Settings → General → Your apps → Add Web app');
console.log('5. Update .env.local with your Firebase configuration');
console.log('\n6. Create a Telegram bot:');
console.log('   - Message @BotFather');
console.log('   - Create bot and get token');
console.log('   - Update .env.local with bot token');
console.log('\n7. Run: firebase login');
console.log('8. Run: firebase use --add (select your project)');
console.log('9. Run: npm run build');
console.log('10. Run: firebase deploy');
console.log('\n🎉 Your AngarQR system will be live!\n');