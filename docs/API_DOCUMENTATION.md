# AngarQR API Documentation

## Base URL
```
Production: https://angarqr.web.app/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication via Firebase Auth JWT token.

```http
Authorization: Bearer {firebase-jwt-token}
```

## Endpoints

### 1. Generate Invitation Batch

Create a batch of QR code invitations.

**Endpoint:** `POST /api/invitations/generate-batch`

**Request Body:**
```json
{
  "category": "returning|vip|friend_of_friend",
  "count": 100,
  "eventInfo": {
    "name": "Grand Reopening",
    "date": "2024-12-31T22:00:00Z",
    "venue": "Angar Nightclub"
  },
  "metadata": {
    "notes": "Special VIP batch for investors",
    "customPrefix": "VIP"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_abc123",
    "count": 100,
    "invitations": [
      {
        "id": "inv_xyz789",
        "code": "ANGAR-VIP-0001",
        "qrUrl": "https://angarqr.web.app/qr/inv_xyz789.png",
        "qrDataUrl": "data:image/png;base64,..."
      }
    ],
    "downloadUrl": "https://angarqr.web.app/download/batch_abc123.zip",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid request parameters
- `401` - Unauthorized
- `403` - Insufficient permissions
- `429` - Rate limit exceeded

### 2. Get Invitation Details

Retrieve details of a specific invitation.

**Endpoint:** `GET /api/invitations/{invitationId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv_xyz789",
    "code": "ANGAR-VIP-0001",
    "status": "active",
    "category": "vip",
    "createdAt": "2024-01-15T10:00:00Z",
    "eventInfo": {
      "name": "Grand Reopening",
      "date": "2024-12-31T22:00:00Z",
      "venue": "Angar Nightclub"
    },
    "redemption": null
  }
}
```

### 3. Redeem Invitation

Validate and redeem an invitation via QR code.

**Endpoint:** `POST /api/invitations/redeem`

**Request Body:**
```json
{
  "code": "ANGAR-VIP-0001",
  "scannerId": "telegram_user_123",
  "scannerUsername": "security_john",
  "location": {
    "lat": 55.7558,
    "lng": 37.6173
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "invitation": {
      "code": "ANGAR-VIP-0001",
      "category": "vip",
      "guestName": "John Doe",
      "eventInfo": {
        "name": "Grand Reopening",
        "date": "2024-12-31T22:00:00Z"
      }
    },
    "message": "Welcome! Entry granted."
  }
}
```

**Already Redeemed Response:**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_REDEEMED",
    "message": "This invitation has already been used",
    "details": {
      "redeemedAt": "2024-12-31T22:30:00Z",
      "redeemedBy": "security_jane"
    }
  }
}
```

### 4. Get Batch Statistics

Retrieve statistics for a specific batch.

**Endpoint:** `GET /api/batches/{batchId}/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_abc123",
    "name": "VIP Investors Batch",
    "category": "vip",
    "createdAt": "2024-01-15T10:00:00Z",
    "stats": {
      "total": 100,
      "redeemed": 45,
      "active": 55,
      "expired": 0,
      "redemptionRate": 0.45
    },
    "redemptionTimeline": [
      {
        "hour": "22:00",
        "count": 15
      },
      {
        "hour": "23:00",
        "count": 30
      }
    ]
  }
}
```

### 5. List Batches

Get a paginated list of invitation batches.

**Endpoint:** `GET /api/batches`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (optional: returning|vip|friend_of_friend)
- `sortBy` (default: createdAt)
- `order` (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "batch_abc123",
        "name": "VIP Investors",
        "category": "vip",
        "totalCount": 100,
        "redeemedCount": 45,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### 6. Scanner Authentication

Authenticate a Telegram user as a scanner.

**Endpoint:** `POST /api/auth/telegram`

**Request Body:**
```json
{
  "initData": "query_id=...",
  "hash": "telegram_hash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_123",
      "telegramId": "123456789",
      "username": "john_scanner",
      "role": "scanner"
    }
  }
}
```

### 7. Get Scanner History

Retrieve scanning history for a specific user.

**Endpoint:** `GET /api/scanners/{userId}/history`

**Query Parameters:**
- `date` (optional: YYYY-MM-DD)
- `limit` (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "scans": [
      {
        "invitationCode": "ANGAR-VIP-0001",
        "scannedAt": "2024-12-31T22:30:00Z",
        "category": "vip",
        "result": "success"
      }
    ],
    "stats": {
      "totalScans": 150,
      "successfulScans": 148,
      "duplicateScans": 2
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CODE` | QR code format is invalid |
| `NOT_FOUND` | Invitation not found |
| `ALREADY_REDEEMED` | Invitation already used |
| `EXPIRED` | Invitation has expired |
| `RATE_LIMITED` | Too many requests |
| `UNAUTHORIZED` | Invalid or missing auth token |
| `FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |

## Rate Limiting

- Guest generation: 10 requests per minute
- Scanning: 30 requests per minute per user
- General API: 100 requests per minute

## Webhooks

Configure webhooks to receive real-time updates:

```json
{
  "event": "invitation.redeemed",
  "data": {
    "invitationId": "inv_xyz789",
    "code": "ANGAR-VIP-0001",
    "redeemedAt": "2024-12-31T22:30:00Z",
    "scannerId": "user_123"
  }
}
```

Available events:
- `batch.created`
- `invitation.redeemed`
- `scanner.authenticated`
- `anomaly.detected`