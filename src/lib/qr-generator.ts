import QRCode from 'qrcode';

interface QROptions {
  code: string;
  logoUrl?: string;
}

export async function generateCyberQR({ code, logoUrl }: QROptions): Promise<string> {
  // Generate base QR code with high error correction for logo overlay
  // For better scanning, create a high-contrast QR code first
  const qrDataUrl = await QRCode.toDataURL(`https://angarqr.web.app/v/${code}`, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 800,
    margin: 2, // Add small margin for better scanning
    color: {
      dark: '#000000', // Black on white for better scanning
      light: '#FFFFFF',
    },
  });

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return qrDataUrl; // Return basic QR in server environment
  }

  // Create canvas for styled QR
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 1000;
  canvas.height = 1000;

  // Fill background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 1000, 1000);

  // Draw cyber frame
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00ff00';
  ctx.shadowBlur = 20;
  
  // Outer frame with corner details
  ctx.beginPath();
  ctx.moveTo(50, 100);
  ctx.lineTo(50, 50);
  ctx.lineTo(100, 50);
  ctx.moveTo(900, 50);
  ctx.lineTo(950, 50);
  ctx.lineTo(950, 100);
  ctx.moveTo(950, 900);
  ctx.lineTo(950, 950);
  ctx.lineTo(900, 950);
  ctx.moveTo(100, 950);
  ctx.lineTo(50, 950);
  ctx.lineTo(50, 900);
  ctx.stroke();

  // Inner frame
  ctx.strokeRect(100, 100, 800, 800);

  // Load and draw QR code
  const qrImage = new Image();
  qrImage.src = qrDataUrl;
  
  return new Promise((resolve) => {
    qrImage.onload = async () => {
      // Draw QR code with white background for better contrast
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, 100, 800, 800);
      ctx.drawImage(qrImage, 100, 100, 800, 800);
      
      // Apply green tint overlay while preserving contrast
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fillRect(100, 100, 800, 800);
      ctx.globalCompositeOperation = 'source-over';

      // Add scan lines effect
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(100, 100 + (i * 80));
        ctx.lineTo(900, 100 + (i * 80));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Draw logo if provided
      if (logoUrl) {
        const logo = new Image();
        logo.src = logoUrl;
        logo.onload = () => {
          // Smaller logo size to avoid covering QR data
          const logoSize = 100; // Reduced from 200
          const logoRadius = 60; // Reduced from 120
          const centerX = 500;
          const centerY = 500;
          
          // Logo background circle
          ctx.fillStyle = '#0a0a0a';
          ctx.beginPath();
          ctx.arc(centerX, centerY, logoRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Logo border
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, logoRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw logo centered
          const logoX = centerX - (logoSize / 2);
          const logoY = centerY - (logoSize / 2);
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          
          // Add code text
          addCodeText(ctx, code);
          
          resolve(canvas.toDataURL('image/png'));
        };
      } else {
        // Add code text
        addCodeText(ctx, code);
        resolve(canvas.toDataURL('image/png'));
      }
    };
  });
}

function addCodeText(ctx: CanvasRenderingContext2D, code: string) {
  // Add code at bottom
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 32px Russo One, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ff00';
  ctx.shadowBlur = 10;
  ctx.fillText(code, 500, 980);
}

// Generate a cryptographically secure random string
function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Node.js environment (fallback)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

export async function generateQRBatch(
  count: number,
  prefix: string = 'ANGAR',
  batchId?: string
): Promise<Array<{ code: string; qrDataUrl: string }>> {
  const batch = [];
  const generatedCodes = new Set<string>(); // Ensure uniqueness
  
  // Use first 6 characters of batchId for batch identification
  const batchPrefix = batchId ? `B${batchId.substring(0, 5).toUpperCase()}` : `B${generateSecureRandomString(5)}`;
  
  for (let i = 1; i <= count; i++) {
    let code: string;
    
    // Generate unique code
    do {
      // Format: ANGAR-B{5chars}-{15chars}
      // Example: ANGAR-BX7K9M-2P8N4Q6R5T7Y9
      const randomPart = generateSecureRandomString(15);
      code = `${prefix}-${batchPrefix}-${randomPart}`;
    } while (generatedCodes.has(code));
    
    generatedCodes.add(code);
    
    const qrDataUrl = await generateCyberQR({ 
      code, 
      logoUrl: '/images/angar_logo.svg' 
    });
    
    batch.push({ code, qrDataUrl });
  }
  
  return batch;
}