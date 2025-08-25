# AngarQR Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Git installed
- Google account for Firebase
- Telegram Bot Token from @BotFather

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "angarqr-production"
4. Enable Google Analytics (optional)

### 1.2 Enable Services

In Firebase Console, enable:
- **Authentication** → Email/Password (for admin) + Custom Token (for Telegram)
- **Firestore Database** → Create in production mode
- **Hosting** → Initialize
- **Storage** → For QR code storage

### 1.3 Get Configuration

1. Go to Project Settings → General
2. Scroll to "Your apps" → Add Web App
3. Register app as "AngarQR Web"
4. Copy the configuration object

## Step 2: Telegram Bot Setup

### 2.1 Create Bot

```bash
# In Telegram, message @BotFather
/newbot
# Follow prompts to create "AngarQR Scanner Bot"
# Save the bot token
```

### 2.2 Configure Mini App

```bash
# Still in @BotFather
/setmenubutton
# Choose your bot
# Select "Configure menu button"
# Enter button text: "Open Scanner"
# Enter Web App URL: https://angarqr.web.app/telegram
```

## Step 3: Local Setup

### 3.1 Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/angarqr.git
cd angarqr

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 3.2 Configure Environment

Edit `.env.local`:
```env
# Firebase Configuration (from Step 1.3)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=angarqr-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=angarqr-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=angarqr-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Telegram Configuration
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your-bot-token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=AngarQRScannerBot

# Application Settings
NEXT_PUBLIC_APP_URL=https://angarqr.web.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### 3.3 Firebase CLI Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore (for database rules)
# - Functions (optional, for server functions)
# - Hosting (for web deployment)
# - Storage (for QR storage)

# Choose existing project: angarqr-production
# Accept default options
```

## Step 4: Database Setup

### 4.1 Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 4.2 Create Initial Admin User

```javascript
// In Firebase Console → Authentication → Users
// Add user with email/password
// Note the User UID

// In Firestore, create document:
// users/{userUID}
{
  "email": "admin@angar.club",
  "role": "admin",
  "createdAt": serverTimestamp()
}
```

### 4.3 Initialize Collections

Run initialization script:
```bash
npm run init:db
```

## Step 5: Build and Deploy

### 5.1 Build Applications

```bash
# Build both admin portal and Telegram app
npm run build:all

# This creates:
# - out/ (Next.js static export)
# - telegram-app/dist/ (Vite build)
```

### 5.2 Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services:
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only storage
```

### 5.3 Verify Deployment

1. Visit https://angarqr.web.app - Should show admin login
2. Visit https://angarqr.web.app/telegram - Should show Telegram app
3. Open Telegram bot and click menu button - Should open Mini App

## Step 6: Post-Deployment

### 6.1 Configure Custom Domain (Optional)

1. In Firebase Hosting → Add custom domain
2. Follow DNS configuration steps
3. Wait for SSL provisioning

### 6.2 Set Up Monitoring

1. Enable Firebase Performance Monitoring
2. Set up error alerts in Firebase Console
3. Configure uptime monitoring

### 6.3 Backup Strategy

```bash
# Set up automated Firestore backups
gcloud firestore export gs://angarqr-backups/$(date +%Y%m%d)

# Create cron job for daily backups
```

## Step 7: Production Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] Admin user created
- [ ] Telegram bot configured
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup automation set up
- [ ] Rate limiting configured
- [ ] Error tracking enabled

## Troubleshooting

### Common Issues

1. **Telegram Mini App not loading**
   - Check Web App URL in @BotFather
   - Ensure HTTPS is working
   - Check browser console for errors

2. **QR codes not generating**
   - Check Storage bucket permissions
   - Verify CORS configuration
   - Check browser console for errors

3. **Database permission errors**
   - Review Firestore security rules
   - Check user authentication
   - Verify user roles in database

### Debug Commands

```bash
# Check Firebase deployment status
firebase hosting:channel:list

# View Firebase logs
firebase functions:log

# Test locally with emulators
firebase emulators:start
```

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Deploy updates
npm run build:all && firebase deploy
```

### Scaling Considerations

1. **High Traffic Events**
   - Pre-scale Firebase resources
   - Enable CDN caching
   - Consider Cloud Functions for heavy operations

2. **Database Optimization**
   - Create composite indexes for common queries
   - Implement data archival for old invitations
   - Monitor query performance

## Support

For deployment issues:
1. Check Firebase Status: https://status.firebase.google.com
2. Review logs in Firebase Console
3. Contact support with deployment ID