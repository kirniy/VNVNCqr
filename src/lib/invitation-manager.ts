import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc,
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import QRCode from 'qrcode';

export interface VNVNCInvitation {
  id?: string;
  code: string;
  instagramHandle: string;
  bloggerName?: string;
  status: 'created' | 'sent' | 'viewed' | 'redeemed' | 'expired';
  inviteUrl: string;
  qrCodeUrl?: string;
  invitationType: 'link' | 'qr'; // New field for invitation type
  createdAt?: Timestamp;
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  redeemedAt?: Timestamp;
  expiresAt?: Timestamp; // Expiration date
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

  // Generate QR code for an invitation (returns data URL)
  static async generateQRCode(inviteUrl: string): Promise<string> {
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
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Generate QR code with embedded VNVNC logo
  static async generateQRCodeWithLogo(inviteUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // First generate the QR code
        QRCode.toCanvas(inviteUrl, {
          errorCorrectionLevel: 'H', // High error correction for logo overlay
          width: 800,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }, (error, canvas) => {
          if (error) {
            reject(error);
            return;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Load and embed the VNVNC logo
          const logo = new Image();
          logo.onload = () => {
            // Calculate logo position and size (20% of QR code)
            const logoSize = canvas.width * 0.2;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;

            // Create white background circle for logo
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            // Add red border around logo
            ctx.strokeStyle = '#DC2626';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw the logo
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

            // Convert canvas to data URL
            resolve(canvas.toDataURL('image/png'));
          };

          logo.onerror = () => {
            // If logo fails to load, return QR without logo
            resolve(canvas.toDataURL('image/png'));
          };

          // Use the VNVNC logo
          logo.src = '/images/vnvnc-logo.png';
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create a single invitation
  async createInvitation(
    instagramHandle: string,
    bloggerName?: string,
    eventDate: '2025-08-29' | '2025-08-30' | 'both' = 'both',
    batchName?: string,
    invitationType: 'link' | 'qr' = 'link'
  ): Promise<VNVNCInvitation> {
    try {
      const code = this.generateCode();
      const inviteUrl = `${this.baseUrl}/invite/${code}`;
      // We'll generate QR codes on the client side now

      // Calculate expiration date based on event date
      let expirationDate: Date;
      if (eventDate === 'both') {
        // Valid for both days, expires at end of Aug 31
        expirationDate = new Date('2025-08-31T08:00:00');
      } else if (eventDate === '2025-08-29') {
        // Valid for Aug 29 only, expires at end of Aug 30 morning
        expirationDate = new Date('2025-08-30T08:00:00');
      } else {
        // Valid for Aug 30 only, expires at end of Aug 31 morning
        expirationDate = new Date('2025-08-31T08:00:00');
      }

      const invitation: any = {
        code,
        instagramHandle: instagramHandle.replace('@', ''), // Remove @ if present
        status: 'created',
        inviteUrl,
        invitationType,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expirationDate),
        metadata: {
          eventDate,
          validForBothDays: eventDate === 'both',
        },
      };

      // Only add optional fields if they have values
      if (bloggerName !== undefined && bloggerName !== null) {
        invitation.bloggerName = bloggerName;
      }
      if (batchName !== undefined && batchName !== null) {
        invitation.metadata.batchName = batchName;
      }

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

  // Create invitation with specific code (for QR codes)
  async createInvitationWithCode(
    code: string,
    instagramHandle: string,
    eventDate: '2025-08-29' | '2025-08-30' | 'both' = 'both',
    batchName?: string,
    invitationType: 'link' | 'qr' = 'qr'
  ): Promise<VNVNCInvitation> {
    try {
      const inviteUrl = `${this.baseUrl}/invite/${code}`;
      
      // Calculate expiration date based on event date
      let expirationDate: Date;
      if (eventDate === 'both') {
        // Valid for both days, expires at end of Aug 31
        expirationDate = new Date('2025-08-31T08:00:00');
      } else if (eventDate === '2025-08-29') {
        // Valid for Aug 29 only, expires at end of Aug 30 morning
        expirationDate = new Date('2025-08-30T08:00:00');
      } else {
        // Valid for Aug 30 only, expires at end of Aug 31 morning
        expirationDate = new Date('2025-08-31T08:00:00');
      }

      const invitation: any = {
        code,
        instagramHandle: instagramHandle.replace('@', ''),
        status: 'created',
        inviteUrl,
        invitationType,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expirationDate),
        metadata: {
          eventDate,
          validForBothDays: eventDate === 'both',
        },
      };

      // Only add batchName if provided
      if (batchName) {
        invitation.metadata.batchName = batchName;
      }

      const docRef = await addDoc(collection(db, 'invitations'), invitation);
      
      return {
        ...invitation,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating invitation with code:', error);
      throw error;
    }
  }

  // Create batch invitations from Instagram list
  async createBatchInvitations(
    instagramHandles: string[],
    batchName: string,
    eventDate: '2025-08-29' | '2025-08-30' | 'both' = 'both',
    invitationType: 'link' | 'qr' = 'link'
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
          batchName,
          invitationType
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

  // Delete an invitation
  async deleteInvitation(invitationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'invitations', invitationId));
    } catch (error) {
      console.error('Error deleting invitation:', error);
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