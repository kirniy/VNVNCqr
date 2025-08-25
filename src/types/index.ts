export interface Invitation {
  id: string;
  code: string;
  status: 'active' | 'redeemed' | 'expired';
  createdAt: Date;
  redeemedAt?: Date;
  redeemedBy?: {
    telegramId: string;
    username: string;
  };
  eventInfo: {
    name: string;
    date: Date;
    venue: string;
  };
  metadata?: {
    batchId: string;
    notes?: string;
  };
}

export interface Batch {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  totalCount: number;
  redeemedCount: number;
  prefix: string;
}

export interface User {
  id: string;
  telegramId: string;
  username: string;
  role: 'admin' | 'scanner';
  scanHistory: ScanRecord[];
  lastActive: Date;
}

export interface ScanRecord {
  invitationCode: string;
  scannedAt: Date;
  result: 'success' | 'already_redeemed' | 'not_found' | 'expired';
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface GenerateBatchRequest {
  count: number;
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

export interface RedeemRequest {
  code: string;
  scannerId: string;
  scannerUsername: string;
}