import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export class QRGenerator {
  // Generate QR code with embedded VNVNC logo (client-side)
  static async generateQRWithLogo(inviteUrl: string, code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a larger canvas to include text below
      const canvas = document.createElement('canvas');
      const qrSize = 800;
      canvas.width = qrSize;
      canvas.height = qrSize + 100; // Extra space for text below
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill white background for entire canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Generate QR code on a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;
      
      QRCode.toCanvas(tempCanvas, inviteUrl, {
        errorCorrectionLevel: 'H', // High error correction for logo overlay
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        // Draw QR code onto main canvas
        ctx.drawImage(tempCanvas, 0, 0);

        // Load and embed the VNVNC logo
        const logo = new Image();
        logo.onload = () => {
          // Get the actual logo dimensions to maintain aspect ratio
          const logoAspectRatio = logo.width / logo.height;
          
          // Calculate logo size (15% of QR code width to avoid covering too much)
          const maxLogoWidth = qrSize * 0.15;
          const maxLogoHeight = qrSize * 0.15;
          
          let logoWidth, logoHeight;
          
          if (logoAspectRatio > 1) {
            // Logo is wider than tall
            logoWidth = maxLogoWidth;
            logoHeight = logoWidth / logoAspectRatio;
          } else {
            // Logo is taller than wide or square
            logoHeight = maxLogoHeight;
            logoWidth = logoHeight * logoAspectRatio;
          }
          
          // Calculate position to center the logo
          const logoX = (qrSize - logoWidth) / 2;
          const logoY = (qrSize - logoHeight) / 2;

          // Create white background for logo with padding
          const padding = 12;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(
            logoX - padding,
            logoY - padding,
            logoWidth + padding * 2,
            logoHeight + padding * 2
          );

          // Add red border around logo background
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            logoX - padding,
            logoY - padding,
            logoWidth + padding * 2,
            logoHeight + padding * 2
          );

          // Draw the logo with proper aspect ratio
          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

          // Add event info text BELOW the QR code
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('VNVNC BIRTHDAY', canvas.width / 2, qrSize + 35);
          
          ctx.font = 'bold 22px Arial';
          ctx.fillStyle = '#DC2626'; // Red color for date
          ctx.fillText('29-30 AUGUST 2025', canvas.width / 2, qrSize + 65);

          // Convert canvas to data URL
          resolve(canvas.toDataURL('image/png'));
        };

        logo.onerror = () => {
          // If logo fails to load, add text anyway and return
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('VNVNC BIRTHDAY', canvas.width / 2, qrSize + 35);
          
          ctx.font = 'bold 22px Arial';
          ctx.fillStyle = '#DC2626';
          ctx.fillText('29-30 AUGUST 2025', canvas.width / 2, qrSize + 65);
          
          resolve(canvas.toDataURL('image/png'));
        };

        // Use the VNVNC logo
        logo.src = '/images/vnvnc-logo.png';
      });
    });
  }

  // Generate multiple QR codes from existing codes and download as ZIP
  static async generateQRBatchFromCodes(
    codes: string[],
    eventDate: '2025-08-29' | '2025-08-30' | 'both',
    batchName: string,
    onProgress?: (progress: number) => void
  ): Promise<{ zipBlob: Blob }> {
    const zip = new JSZip();
    const baseUrl = 'https://vnvnc-invites.vercel.app';
    
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      
      // Generate QR code with logo
      const inviteUrl = `${baseUrl}/invite/${code}`;
      const qrDataUrl = await this.generateQRWithLogo(inviteUrl, code);
      
      // Convert data URL to blob
      const base64Data = qrDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let j = 0; j < binaryData.length; j++) {
        uint8Array[j] = binaryData.charCodeAt(j);
      }
      
      // Add to ZIP
      zip.file(`qr-${code}.png`, uint8Array, { binary: true });
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / codes.length) * 100));
      }
    }

    // Add info file
    const info = `VNVNC Birthday Event QR Codes
Batch: ${batchName}
Date: ${eventDate === 'both' ? '29-30 August 2025' : eventDate === '2025-08-29' ? '29 August 2025' : '30 August 2025'}
Total QR Codes: ${codes.length}

Codes:
${codes.join('\n')}

Each QR code contains a unique invitation link that can be scanned at the venue.
`;
    
    zip.file('info.txt', info);
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return { zipBlob };
  }

  // Generate multiple QR codes and download as ZIP (DEPRECATED - use generateQRBatchFromCodes instead)
  static async generateQRBatch(
    count: number,
    eventDate: '2025-08-29' | '2025-08-30' | 'both',
    batchName: string,
    onProgress?: (progress: number) => void
  ): Promise<{ codes: string[], zipBlob: Blob }> {
    const zip = new JSZip();
    const codes: string[] = [];
    const baseUrl = 'https://vnvnc-invites.vercel.app';
    
    for (let i = 0; i < count; i++) {
      // Generate unique code
      const code = `VNVNC-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      codes.push(code);
      
      // Generate QR code with logo
      const inviteUrl = `${baseUrl}/invite/${code}`;
      const qrDataUrl = await this.generateQRWithLogo(inviteUrl, code);
      
      // Convert data URL to blob
      const base64Data = qrDataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let j = 0; j < binaryData.length; j++) {
        uint8Array[j] = binaryData.charCodeAt(j);
      }
      
      // Add to ZIP
      zip.file(`qr-${code}.png`, uint8Array, { binary: true });
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / count) * 100));
      }
    }

    // Add info file
    const info = `VNVNC Birthday Event QR Codes
Batch: ${batchName}
Date: ${eventDate === 'both' ? '29-30 August 2025' : eventDate === '2025-08-29' ? '29 August 2025' : '30 August 2025'}
Total QR Codes: ${count}

Codes:
${codes.join('\n')}

Each QR code contains a unique invitation link that can be scanned at the venue.
`;
    
    zip.file('info.txt', info);
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return { codes, zipBlob };
  }

  // Download QR codes as ZIP
  static downloadQRZip(zipBlob: Blob, batchName: string) {
    const fileName = `vnvnc-qr-${batchName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.zip`;
    saveAs(zipBlob, fileName);
  }

  // Generate single QR and download
  static async downloadSingleQR(inviteUrl: string, code: string) {
    const qrDataUrl = await this.generateQRWithLogo(inviteUrl, code);
    
    // Convert to blob and download
    const base64Data = qrDataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    
    const blob = new Blob([uint8Array], { type: 'image/png' });
    saveAs(blob, `vnvnc-qr-${code}.png`);
  }
}