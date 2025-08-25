import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import Head from 'next/head';

// Simple, mobile-first scanner with no external dependencies
export default function QRScanner() {
  const [mode, setMode] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize Telegram
  useEffect(() => {
    // Simple approach like straight-outta
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.MainButton.hide();
      window.Telegram.WebApp.setHeaderColor('#00ff00');
      window.Telegram.WebApp.setBackgroundColor('#000000');
      setTelegramUser(window.Telegram.WebApp.initDataUnsafe?.user);
      
      // Set cyber theme
      document.body.style.backgroundColor = '#000000';
    }
  }, []);

  // Log scan attempt
  const logScan = async (code: string, success: boolean, error?: string) => {
    try {
      await addDoc(collection(db, 'scanLogs'), {
        code,
        success,
        error,
        timestamp: serverTimestamp(),
        username: telegramUser?.username || 'unknown',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
    } catch (e) {
      console.error('Log error:', e);
    }
  };

  // Process scanned code
  const processCode = async (scannedData: string) => {
    setMode('result');
    
    try {
      // Extract code from URL or use raw code
      let code = scannedData;
      console.log('Scanner v2 - Raw scanned data:', scannedData);
      
      if (scannedData.includes('/invite/')) {
        const match = scannedData.match(/\/invite\/([A-Z0-9-]+)/);
        code = match ? match[1] : scannedData;
        console.log('Extracted code from URL:', code);
      }

      // Validate format - VNVNC format only
      // Format: VNVNC-2025-XXXXXX
      const vnvncFormatRegex = /^VNVNC-2025-[A-Z0-9]{6}$/;
      console.log('Testing code format:', code, 'against regex:', vnvncFormatRegex.toString());
      
      if (!code.match(vnvncFormatRegex)) {
        console.error('Format validation failed for code:', code);
        setIsSuccess(false);
        setMessage('НЕВЕРНЫЙ ФОРМАТ');
        await logScan(code, false, 'Invalid format');
        return;
      }

      // Check in database
      const q = query(collection(db, 'invitations'), where('code', '==', code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setIsSuccess(false);
        setMessage('КОД НЕ НАЙДЕН');
        await logScan(code, false, 'Not found');
        return;
      }

      const invitation = snapshot.docs[0];
      const data = invitation.data();

      if (data.status === 'redeemed') {
        setIsSuccess(false);
        setMessage('УЖЕ ИСПОЛЬЗОВАН');
        await logScan(code, false, 'Already redeemed');
        return;
      }

      // Redeem
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'redeemed',
        redeemedAt: serverTimestamp(),
        redeemedBy: {
          id: telegramUser?.id || 'unknown',
          username: telegramUser?.username || telegramUser?.first_name || 'Guest',
        },
      });

      // Update batch redemption count
      if (data.metadata?.batchId) {
        const batchRef = doc(db, 'batches', data.metadata.batchId);
        const batchDoc = await getDoc(batchRef);
        if (batchDoc.exists()) {
          await updateDoc(batchRef, {
            redeemedCount: (batchDoc.data().redeemedCount || 0) + 1,
          });
        }
      }

      setIsSuccess(true);
      setMessage('ПРОХОД ОТКРЫТ');
      await logScan(code, true);
      
      // Vibrate on success
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('ОШИБКА СИСТЕМЫ');
      await logScan(scannedData, false, String(error));
    }
  };

  // Camera scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanFromCamera();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setMode('idle');
      alert('Камера недоступна. Используйте загрузку фото.');
    }
  };

  const scanFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFromCamera);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Import and use jsQR
    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        stopCamera();
        processCode(code.data);
      } else {
        animationFrameRef.current = requestAnimationFrame(scanFromCamera);
      }
    });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // File upload scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        import('jsqr').then(({ default: jsQR }) => {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            processCode(code.data);
          } else {
            setMode('result');
            setIsSuccess(false);
            setMessage('QR НЕ НАЙДЕН');
          }
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reset
  const reset = () => {
    setMode('idle');
    setMessage('');
    setIsSuccess(false);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Head>
        <title>ANGAR Scanner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="p-4 text-center border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-wider">ANGAR</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {mode === 'idle' && (
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto mb-4 border-4 border-white rounded-lg flex items-center justify-center">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2l-2-2v2z" />
                  </svg>
                </div>
                <p className="text-gray-400">Выберите способ сканирования</p>
              </div>

              <button
                onClick={() => {
                  setMode('scanning');
                  startCamera();
                }}
                className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                📷 КАМЕРА
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
              >
                📁 ЗАГРУЗИТЬ ФОТО
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {mode === 'scanning' && (
            <div className="w-full max-w-md">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-center mt-4 text-gray-400">Наведите на QR код</p>
              
              <button
                onClick={reset}
                className="w-full mt-4 py-3 bg-gray-800 text-white font-bold rounded-lg"
              >
                ОТМЕНА
              </button>
            </div>
          )}

          {mode === 'result' && (
            <div className="w-full max-w-sm text-center">
              <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isSuccess ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isSuccess ? (
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h2 className={`text-3xl font-bold mb-8 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </h2>

              <button
                onClick={reset}
                className="w-full py-4 bg-white text-black font-bold rounded-lg"
              >
                СКАНИРОВАТЬ ЕЩЁ
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-gray-600">
          {telegramUser?.username || 'Security'} • ANGAR 2025
        </div>
      </div>
    </>
  );
}