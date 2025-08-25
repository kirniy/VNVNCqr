import { db, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import QRCode from 'qrcode';

export interface VNVNCInvitation {
  id?: string;
  code: string;
  instagramHandle: string;
  bloggerName?: string;
  status: 'created' | 'sent' | 'viewed' | 'redeemed';
  inviteUrl: string;
  qrCodeUrl?: string;
  createdAt?: Timestamp;
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  redeemedAt?: Timestamp;
  metadata: {
    eventDate: '2025-08-29' | '2025-08-30' | 'both';
    validForBothDays: boolean;
    batchId?: string;
    batchName?: string;
  };
}

export class InvitationManager {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://vnvnc.vercel.app') {
    this.baseUrl = baseUrl;
  }

  // Generate a unique invitation code
  private generateCode(): string {
    const prefix = 'VNVNC';
    const year = '2025';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  // Generate QR code for an invitation
  private async generateQRCode(inviteUrl: string, code: string): Promise<string> {
    try {
      // Generate QR code with VNVNC branding colors
      const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 800,
        margin: 2,
        color: {
          dark: '#000000',  // Black for QR pattern
          light: '#FFFFFF', // White background
        },
      });

      // Upload to Firebase Storage
      const storageRef = ref(storage, `qr-codes/invitations/${code}.png`);
      await uploadString(storageRef, qrCodeDataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Create a single invitation
  async createInvitation(
    instagramHandle: string,
    bloggerName?: string,
    eventDate: '2025-08-29' | '2025-08-30' | 'both' = 'both',
    batchName?: string
  ): Promise<VNVNCInvitation> {
    try {
      const code = this.generateCode();
      const inviteUrl = `${this.baseUrl}/invite/${code}`;
      const qrCodeUrl = await this.generateQRCode(inviteUrl, code);

      const invitation: Omit<VNVNCInvitation, 'id'> = {
        code,
        instagramHandle: instagramHandle.replace('@', ''), // Remove @ if present
        bloggerName,
        status: 'created',
        inviteUrl,
        qrCodeUrl,
        createdAt: serverTimestamp() as Timestamp,
        metadata: {
          eventDate,
          validForBothDays: eventDate === 'both',
          batchName,
        },
      };

      const docRef = await addDoc(collection(db, 'invitations'), invitation);
      
      return {
        ...invitation,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  // Create batch invitations from Instagram list
  async createBatchInvitations(
    instagramHandles: string[],
    batchName: string,
    eventDate: '2025-08-29' | '2025-08-30' | 'both' = 'both'
  ): Promise<VNVNCInvitation[]> {
    const invitations: VNVNCInvitation[] = [];
    
    // Create batch document
    const batchRef = await addDoc(collection(db, 'batches'), {
      name: batchName,
      createdAt: serverTimestamp(),
      totalInvitations: instagramHandles.length,
      eventDate,
    });

    for (const handle of instagramHandles) {
      try {
        const invitation = await this.createInvitation(
          handle,
          undefined,
          eventDate,
          batchName
        );
        
        // Update invitation with batch ID
        await updateDoc(doc(db, 'invitations', invitation.id!), {
          'metadata.batchId': batchRef.id,
        });
        
        invitations.push({
          ...invitation,
          metadata: {
            ...invitation.metadata,
            batchId: batchRef.id,
          },
        });
      } catch (error) {
        console.error(`Error creating invitation for ${handle}:`, error);
      }
    }

    return invitations;
  }

  // Mark invitation as sent
  async markAsSent(invitationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'sent',
        sentAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking invitation as sent:', error);
      throw error;
    }
  }

  // Track when invitation page is viewed
  async trackView(code: string): Promise<void> {
    try {
      const q = query(collection(db, 'invitations'), where('code', '==', code));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0];
        const data = docRef.data();
        
        // Only update if not already viewed
        if (data.status === 'created' || data.status === 'sent') {
          await updateDoc(doc(db, 'invitations', docRef.id), {
            status: 'viewed',
            viewedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      throw error;
    }
  }

  // Get all invitations
  async getAllInvitations(): Promise<VNVNCInvitation[]> {
    try {
      const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VNVNCInvitation[];
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  }

  // Get invitation by code
  async getInvitationByCode(code: string): Promise<VNVNCInvitation | null> {
    try {
      const q = query(collection(db, 'invitations'), where('code', '==', code));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as VNVNCInvitation;
    } catch (error) {
      console.error('Error getting invitation by code:', error);
      throw error;
    }
  }

  // Parse Instagram handles from text input
  parseInstagramHandles(text: string): string[] {
    const lines = text.split('\n');
    const handles: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Extract username from Instagram URL
      const urlMatch = trimmed.match(/instagram\.com\/([^/?]+)/);
      if (urlMatch) {
        handles.push(urlMatch[1]);
      } else if (trimmed.startsWith('@')) {
        handles.push(trimmed.substring(1));
      } else if (trimmed.match(/^[a-zA-Z0-9._]+$/)) {
        handles.push(trimmed);
      }
    }
    
    return [...new Set(handles)]; // Remove duplicates
  }
}