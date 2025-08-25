# VNVNC Birthday Event Invitation System

A personalized invitation system for the VNVNC birthday event (August 29-30, 2025) with QR code generation and Telegram-based redemption.

## Features

- 🎫 **Personalized Invitations**: Generate unique invitation links for Instagram bloggers
- 📱 **QR Code Scanner**: Telegram Mini App for venue entry validation
- 🎨 **Custom Branding**: VNVNC red and black theme throughout
- 📊 **Admin Dashboard**: Manage invitations, track status, and export links
- 🔐 **One-Time Redemption**: Each QR code can only be used once

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Scanner**: Telegram Mini App integration
- **Deployment**: Vercel

## Setup

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Storage
5. Copy your Firebase config to `src/lib/firebase-config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 2. Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Add bot token to Firebase config

### 3. Installation

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Deployment

Deploy to Vercel:

```bash
npm run build
vercel
```

## Project Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── dashboard.tsx    # Admin overview
│   │   ├── invitations.tsx  # Manage invitations
│   │   └── login.tsx        # Admin authentication
│   ├── invite/
│   │   └── [code].tsx      # Dynamic invitation page
│   └── telegram/
│       └── index.tsx       # QR scanner app
├── lib/
│   ├── firebase.ts          # Firebase initialization
│   └── invitation-manager.ts # Invitation logic
└── styles/
    └── globals.css         # VNVNC theme styles
```

## Usage

### Creating Invitations

1. Login to admin panel at `/admin`
2. Go to "Приглашения" (Invitations)
3. Enter batch name and Instagram handles
4. Click "Создать приглашения"
5. Copy individual links or messages for each blogger

### Manual Instagram Distribution

1. Copy the personalized message template
2. Send via Instagram DM to each blogger
3. Mark as "Отправлено" (Sent) in dashboard
4. Track views and redemptions in real-time

### Scanner Setup

1. Add Telegram bot to venue staff devices
2. Open scanner at `/telegram`
3. Scan QR codes to validate entry
4. Each code can only be redeemed once

## Invitation Format

- **URL**: `https://vnvnc.vercel.app/invite/[CODE]`
- **Code Format**: `VNVNC-2025-XXXXXX`
- **QR Content**: Direct link to invitation URL

## Security

- Firebase Security Rules restrict access
- Admin authentication required for dashboard
- One-time QR code redemption
- Real-time validation via Telegram

## Event Details

- **Dates**: August 29-30, 2025
- **Time**: 23:00 - 8:00
- **Location**: Конюшенная 2В, Санкт-Петербург
- **Age**: 18+ (ID required)

## Support

For technical support or questions about the system, please contact the development team.

---

Built with ❤️ for VNVNC Birthday Event 2025