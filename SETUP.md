# Setup Instructions

## Prerequisites

- Node.js v18+
- Firebase account
- Telegram Bot Token

## Quick Setup

1. **Clone and Install**
```bash
git clone [repository-url]
cd angarqr
npm install
```

2. **Firebase Setup**
- Create project at [Firebase Console](https://console.firebase.google.com)
- Enable: Authentication (Email/Password), Firestore, Hosting
- Get configuration from Project Settings

3. **Telegram Bot Setup**
- Create bot via @BotFather: `/newbot`
- Save bot token
- Set up Web App: `/newapp`

4. **Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

5. **Create Admin User**
```bash
npm run setup:admin
```

6. **Development**
```bash
npm run dev
# Admin: http://localhost:3000
# Scanner: http://localhost:3000/telegram-app
```

7. **Deploy**
```bash
npm run build
firebase deploy
```

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    match /invitations/{invitationId} {
      allow read: if true;
      allow update: if request.resource.data.status == 'redeemed' 
                    && resource.data.status == 'active';
    }
  }
}
```

## Post-Deploy

1. Update Telegram bot Web App URL
2. Test QR generation and scanning
3. Share bot link with security staff