# 🚀 VNVNC Deployment Guide

## 📋 Workflow Overview

### How the System Works

1. **Admin Creates Invitations**
   - Login at `/admin`
   - Go to "Приглашения" page
   - Paste Instagram handles from your list (format below)
   - System generates unique invitation links

2. **Each Invitation Contains**
   - Unique URL: `https://your-domain.vercel.app/invite/VNVNC-2025-XXXXX`
   - Personalized page with event details in Russian
   - QR code for venue entry
   - Beautiful VNVNC branding (red/black theme)

3. **Manual Instagram Distribution**
   - Copy individual link for each blogger
   - Copy pre-formatted message template
   - Send via Instagram DM
   - Mark as "Отправлено" in dashboard

4. **Tracking**
   - Real-time status updates
   - View tracking when link is opened
   - QR redemption tracking at venue

5. **Venue Entry**
   - Staff uses Telegram Mini App scanner
   - Guest shows QR code from invitation page
   - One-time redemption (can't be reused)

---

## 🔧 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it: `vnvnc-invites`
4. Disable Google Analytics (not needed)

### 1.2 Enable Services

**Authentication:**
1. Go to Authentication → Get Started
2. Enable "Email/Password" provider
3. Add your admin email

**Firestore Database:**
1. Go to Firestore → Create Database
2. Start in "Production Mode"
3. Choose location: europe-west3 (Frankfurt)

**Storage:**
1. Go to Storage → Get Started
2. Use default rules for now

### 1.3 Get Firebase Config

1. Go to Project Settings → General
2. Scroll to "Your apps" → Add Web App
3. Name: "VNVNC Web"
4. Copy the config object

### 1.4 Create Firebase Config File

Create `src/lib/firebase-config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "vnvnc-invites.firebaseapp.com",
  projectId: "vnvnc-invites",
  storageBucket: "vnvnc-invites.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};

export const telegramConfig = {
  botToken: "YOUR-BOT-TOKEN",
  botUsername: "vnvnc_scanner_bot"
};
```

---

## 📱 Step 2: Telegram Bot Setup

### 2.1 Create Bot

1. Open Telegram, message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Name: "VNVNC Scanner"
4. Username: `vnvnc_scanner_bot`
5. Save the bot token

### 2.2 Configure Web App

1. Send `/mybots` to BotFather
2. Select your bot
3. Bot Settings → Menu Button
4. Set URL: `https://your-domain.vercel.app/telegram`
5. Set title: "Сканер"

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Build Project

```bash
npm run build
```

### 3.3 Deploy

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? vnvnc-invites
# - Directory? ./
# - Override settings? N
```

### 3.4 Set Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add Firebase config as individual variables

---

## 📝 Step 4: Input Format for Instagram Handles

### Supported Formats

The system accepts multiple formats. You can paste directly from your list:

```
https://www.instagram.com/username1?igsh=xxxxx
https://www.instagram.com/username2?igsh=xxxxx
@username3
username4
```

**From your file `info-and-list.txt`:**
- Just copy all Instagram URLs
- Paste into the textarea
- System will extract usernames automatically

### Example Input

```
https://www.instagram.com/mashashatrova?igsh=NHg5Z3Vmbm1jdGx0
https://www.instagram.com/isakovapolina?igsh=MXY1ZHIwcjhkenplbA==
https://www.instagram.com/fialcapeg?igsh=cjFmaW5rYjdkcGhn
```

---

## 🎨 Step 5: What the Invitation Pages Look Like

Each invitation is a personalized web page with:

1. **VNVNC Logo** - Bold red/black branding
2. **Event Details** - Dates, time, location in Russian
3. **Personal QR Code** - Unique for each blogger
4. **Message** - Welcome text in Russian
5. **Venue Info** - Address and entry instructions

**Mobile Optimized:** Looks perfect on Instagram's in-app browser

---

## 📊 Step 6: Admin Workflow

### 6.1 Create Admin Account

1. Deploy first
2. Go to `https://your-domain.vercel.app/admin`
3. Register with your email
4. In Firebase Console: Authentication → Users → Edit user → Add custom claim: `{"role": "admin"}`

### 6.2 Create Invitations

1. Login to admin panel
2. Go to "Приглашения"
3. Enter batch name: "Блогеры Instagram Август 2025"
4. Select dates: "29-30 августа (оба дня)"
5. Paste Instagram handles from your list
6. Click "Создать приглашения"

### 6.3 Send Invitations

For each invitation:
1. Click "Сообщение" - copies pre-formatted message
2. Click "Ссылка" - copies invitation URL
3. Open Instagram DM
4. Paste and send
5. Click "Отправлено" to mark as sent

---

## 🔗 Important URLs

After deployment, you'll have:

- **Main Site:** `https://vnvnc-invites.vercel.app`
- **Admin Panel:** `https://vnvnc-invites.vercel.app/admin`
- **Telegram Scanner:** `https://vnvnc-invites.vercel.app/telegram`
- **Invitation Example:** `https://vnvnc-invites.vercel.app/invite/VNVNC-2025-XXXXX`

---

## 📱 Step 7: Scanner Setup for Venue

### For Venue Staff:

1. Open Telegram
2. Search for your bot: @vnvnc_scanner_bot
3. Click "Сканер" button
4. Scanner opens automatically
5. Scan QR codes from guest phones

### Scanner Features:
- One-time redemption
- Real-time validation
- Offline QR display support
- Russian interface

---

## ⚡ Quick Start Commands

```bash
# 1. Install
npm install

# 2. Add Firebase config
cp src/lib/firebase-config.example.ts src/lib/firebase-config.ts
# Edit with your credentials

# 3. Build
npm run build

# 4. Deploy
vercel

# 5. Set domain (optional)
vercel domains add vnvnc.club
```

---

## 🎯 Checklist Before Going Live

- [ ] Firebase project created
- [ ] Firebase config added to `src/lib/firebase-config.ts`
- [ ] Telegram bot created
- [ ] Deployed to Vercel
- [ ] Admin account created
- [ ] Test invitation created
- [ ] Test QR scan successful
- [ ] Instagram message template reviewed

---

## 📞 Support

If you encounter issues:

1. **Firebase Errors:** Check Firebase Console → Functions → Logs
2. **Vercel Errors:** Check Vercel Dashboard → Functions → Logs
3. **Scanner Issues:** Ensure Telegram bot is configured correctly
4. **QR Not Working:** Check browser console for errors

---

## 🎉 Ready to Launch!

Once deployed, the system is ready for:
- Creating personalized invitations
- Manual Instagram distribution
- Real-time tracking
- Venue QR validation

The entire flow is in Russian and optimized for mobile viewing!