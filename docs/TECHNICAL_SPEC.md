# Technical Specification - AngarQR System

## 1. System Overview

AngarQR is a two-part system consisting of an admin web portal for QR code generation and a Telegram Mini App for redemption scanning.

## 2. Technical Architecture

### 2.1 Frontend Architecture

#### Admin Portal (Web App)
- **Framework**: Next.js 14 with App Router
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for global state
- **QR Generation**: qrcode.js with canvas manipulation
- **File Handling**: JSZip for bulk downloads

#### Telegram Mini App
- **Framework**: React with Vite
- **UI Framework**: Tailwind CSS with Telegram-specific theming
- **QR Scanner**: @yudiel/react-qr-scanner
- **Telegram SDK**: @twa-dev/sdk for native features
- **State Management**: React Context + useReducer

### 2.2 Backend Architecture

#### Database Design (Firestore)

Collections:
```
invitations/
├── {invitationId}
│   ├── code: string (ANGAR-2024-0001)
│   ├── status: string (active|redeemed|expired)
│   ├── category: string (returning|vip|friend_of_friend)
│   ├── createdAt: timestamp
│   ├── redeemedAt: timestamp?
│   ├── redeemedBy: object?
│   ├── eventInfo: object
│   └── metadata: object

batches/
├── {batchId}
│   ├── name: string
│   ├── category: string
│   ├── createdAt: timestamp
│   ├── createdBy: string
│   ├── totalCount: number
│   └── redeemedCount: number

users/
├── {userId}
│   ├── telegramId: string
│   ├── username: string
│   ├── role: string (admin|scanner)
│   ├── scanHistory: array
│   └── lastActive: timestamp
```

#### Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Invitations - read by authenticated, write by admin
    match /invitations/{invitation} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null && 
        request.resource.data.status == 'redeemed' &&
        resource.data.status == 'active';
    }
    
    // Batches - admin only
    match /batches/{batch} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users - self read, admin write
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 2.3 API Design

#### QR Code Generation API
```typescript
// POST /api/generate-batch
interface GenerateBatchRequest {
  category: 'returning' | 'vip' | 'friend_of_friend';
  count: number; // 1-5000
  eventInfo: {
    name: string;
    date: string;
    venue: string;
  };
  metadata?: {
    notes?: string;
    customPrefix?: string;
  };
}

interface GenerateBatchResponse {
  batchId: string;
  invitations: Array<{
    id: string;
    code: string;
    qrDataUrl: string;
  }>;
  downloadUrl: string;
}
```

#### Redemption API
```typescript
// POST /api/redeem
interface RedeemRequest {
  code: string;
  scannerId: string;
  scannerUsername: string;
}

interface RedeemResponse {
  success: boolean;
  invitation?: {
    code: string;
    category: string;
    eventInfo: object;
  };
  error?: 'NOT_FOUND' | 'ALREADY_REDEEMED' | 'EXPIRED';
  redeemedAt?: string;
  redeemedBy?: string;
}
```

## 3. QR Code Specification

### 3.1 QR Code Format
- **Type**: QR Code Model 2
- **Error Correction**: Level H (30%)
- **Size**: 1000x1000px for digital, 300DPI for print
- **Data Format**: `https://angarqr.web.app/v/{invitationId}`
- **Logo**: Centered, 20% of QR size with white border

### 3.2 Naming Convention
```
Format: ANGAR-{YEAR}-{SEQUENCE}
Examples:
- ANGAR-2024-0001 (Regular sequence)
- ANGAR-VIP-0001 (VIP category)
- ANGAR-FOF-0001 (Friend of Friend)
```

## 4. Telegram Mini App Integration

### 4.1 Bot Configuration
```javascript
// Bot setup via BotFather
/newbot
/setmenubutton - Configure Mini App button
/setwebapp - Set webapp URL

// Mini App Manifest
{
  "name": "AngarQR Scanner",
  "short_name": "AngarQR",
  "description": "Scan and validate Angar invitations",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a1a",
  "background_color": "#000000"
}
```

### 4.2 Telegram WebApp Features
```typescript
// Initialize Telegram WebApp
import WebApp from '@twa-dev/sdk';

// Configure theme
WebApp.ready();
WebApp.setHeaderColor('#1a1a1a');
WebApp.setBackgroundColor('#000000');

// Enable features
WebApp.enableClosingConfirmation();
WebApp.expand();

// Haptic feedback
WebApp.HapticFeedback.impactOccurred('medium'); // On scan
WebApp.HapticFeedback.notificationOccurred('success'); // On valid
WebApp.HapticFeedback.notificationOccurred('error'); // On invalid
```

## 5. Performance Requirements

### 5.1 Response Times
- QR Generation: <2s for single, <10s for 1000 batch
- QR Scanning: <500ms validation response
- Database queries: <200ms p95
- Page load: <3s on 3G

### 5.2 Scalability
- Support 10,000 concurrent scanner users
- Generate up to 50,000 invitations per day
- Handle 1,000 scans per minute peak

### 5.3 Reliability
- 99.9% uptime SLA
- Offline scanning with queue sync
- Automatic retry with exponential backoff
- Data consistency guarantees

## 6. Security Measures

### 6.1 Authentication
- Firebase Auth for admin portal
- Telegram authentication for Mini App
- JWT tokens with 1-hour expiry
- Rate limiting: 10 scans per minute per user

### 6.2 Data Protection
- HTTPS everywhere
- Encrypted invitation IDs
- No PII in QR codes
- Audit logs for all operations

### 6.3 Anti-Fraud
- One-time redemption enforcement
- IP-based rate limiting
- Suspicious pattern detection
- Admin alerts for anomalies

## 7. Deployment Strategy

### 7.1 Environments
- Development: Local with Firebase emulators
- Staging: Firebase project with test data
- Production: Separate Firebase project

### 7.2 CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - Test
      - Build
      - Deploy to Firebase
      - Smoke tests
      - Rollback on failure
```

### 7.3 Monitoring
- Firebase Performance Monitoring
- Custom analytics events
- Error tracking with Sentry
- Uptime monitoring

## 8. Testing Strategy

### 8.1 Unit Tests
- Component testing with Jest
- API endpoint testing
- QR generation validation
- Security rule testing

### 8.2 Integration Tests
- End-to-end invitation flow
- Telegram Mini App interaction
- Database operations
- Offline sync scenarios

### 8.3 Load Testing
- Simulate 1000 concurrent scanners
- Batch generation stress test
- Database performance testing
- CDN caching validation