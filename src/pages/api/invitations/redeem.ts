import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, scannerId, scannerUsername } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    // Find invitation by code
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('code', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Invalid invitation code',
      });
    }

    const invDoc = snapshot.docs[0];
    const invitation = invDoc.data();

    if (invitation.status === 'redeemed') {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_REDEEMED',
        message: 'This invitation has already been used',
        details: {
          redeemedAt: invitation.redeemedAt?.toDate().toISOString(),
          redeemedBy: invitation.redeemedBy?.username || 'Unknown',
        },
      });
    }

    // Redeem the invitation
    await updateDoc(doc(db, 'invitations', invDoc.id), {
      status: 'redeemed',
      redeemedAt: serverTimestamp(),
      redeemedBy: {
        telegramId: scannerId || 'unknown',
        username: scannerUsername || 'Security',
      },
    });

    // Update batch redemption count
    if (invitation.metadata?.batchId) {
      const batchRef = doc(db, 'batches', invitation.metadata.batchId);
      const batchDoc = await getDoc(batchRef);
      if (batchDoc.exists()) {
        await updateDoc(batchRef, {
          redeemedCount: (batchDoc.data().redeemedCount || 0) + 1,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        invitation: {
          code: invitation.code,
          eventInfo: invitation.eventInfo,
        },
        message: 'Welcome! Entry granted.',
      },
    });
  } catch (error) {
    console.error('Error redeeming invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process redemption',
    });
  }
}