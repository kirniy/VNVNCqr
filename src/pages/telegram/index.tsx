import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { formatDateTime } from '@/lib/date-utils';
import Head from 'next/head';

// VNVNC mobile-optimized scanner with native feel
export default function VNVNCScanner() {
  const [screen, setScreen] = useState<'welcome' | 'scan' | 'process' | 'success' | 'error'>('welcome');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Telegram Mini App
  useEffect(() => {
    // Simple approach like straight-outta - no import, direct window access
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const WebApp = window.Telegram.WebApp;
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#DC2626');
      WebApp.setBackgroundColor('#000000');
      
      // Get user data
      const user = WebApp.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user);
      }

      // Enable haptic feedback
      if (WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  }, []);

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => {
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(type);
    }
  }, []);

  // Process QR code data
  const processQRCode = useCallback(async (rawData: string) => {
    setIsProcessing(true);
    setScreen('process');
    haptic('light');

    try {
      // Extract code from URL or use raw data
      let extractedCode = rawData;
      console.log('🔥🔥🔥 VNVNC SCANNER V4.0 ACTIVE 🔥🔥🔥');
      console.log('Raw scanned data:', rawData);
      
      if (rawData.includes('/invite/')) {
        const match = rawData.match(/\/invite\/([A-Z0-9-]+)/);
        extractedCode = match ? match[1] : rawData;
        console.log('Extracted code from URL:', extractedCode);
      }

      // Validate format - VNVNC format
      // Format: VNVNC-2025-XXXXXX (6 alphanumeric characters)
      const vnvncFormatRegex = /^VNVNC-2025-[A-Z0-9]{6}$/;
      console.log('Testing code:', extractedCode, 'against regex:', vnvncFormatRegex.toString());
      
      if (!extractedCode.match(vnvncFormatRegex)) {
        console.error('Format validation failed for code:', extractedCode);
        throw new Error('INVALID_FORMAT');
      }

      setCode(extractedCode);
      console.log('Looking for code in database:', extractedCode);

      // Check in database
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('code', '==', extractedCode));
      const snapshot = await getDocs(q);
      
      console.log('Query result:', {
        empty: snapshot.empty,
        size: snapshot.size
      });

      if (snapshot.empty) {
        throw new Error('NOT_FOUND');
      }

      const invDoc = snapshot.docs[0];
      const invitation = invDoc.data();

      if (invitation.status === 'redeemed') {
        const redeemedDate = formatDateTime(invitation.redeemedAt);
        throw new Error(`ALREADY_USED:${redeemedDate}`);
      }

      // Redeem the invitation
      try {
        await updateDoc(doc(db, 'invitations', invDoc.id), {
          status: 'redeemed',
          redeemedAt: serverTimestamp(),
          redeemedBy: {
            id: telegramUser?.id || 'unknown',
            username: telegramUser?.username || telegramUser?.first_name || 'Guest',
            platform: 'telegram'
          }
        });
        
        console.log('✅ Invitation redeemed successfully');
      } catch (updateError) {
        console.error('Failed to update invitation:', updateError);
        throw updateError; // Re-throw if the main update fails
      }

      // Update batch redemption count (optional - don't fail the whole operation)
      try {
        if (invitation.metadata?.batchId || invitation.batchId) {
          const batchId = invitation.metadata?.batchId || invitation.batchId;
          const batchRef = doc(db, 'batches', batchId);
          const batchDoc = await getDoc(batchRef);
          if (batchDoc.exists()) {
            await updateDoc(batchRef, {
              redeemedCount: (batchDoc.data().redeemedCount || 0) + 1,
            });
            console.log('Batch count updated');
          }
        }
      } catch (batchError) {
        console.log('Batch update skipped (this is OK):', batchError);
        // Don't throw - the invitation was already successfully redeemed
      }

      // Success! Show success screen
      console.log('Showing success screen...');
      
      // Force state updates with timeout for mobile Telegram
      setMessage('ДОСТУП РАЗРЕШЕН');
      setScreen('success');
      
      // Double-set with timeout to ensure mobile Telegram updates
      setTimeout(() => {
        setMessage('ДОСТУП РАЗРЕШЕН');
        setScreen('success');
        console.log('Success screen set (delayed)');
      }, 10);
      
      haptic('heavy');

      // Success notification
      try {
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } catch (hapticError) {
        console.log('Haptic feedback error (ignored):', hapticError);
      }

    } catch (error: any) {
      console.error('Process error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Only show error if we haven't already shown success
      if (screen !== 'success') {
        let errorMessage = 'ОШИБКА СКАНИРОВАНИЯ';
        if (error.message === 'INVALID_FORMAT') {
          errorMessage = 'НЕВЕРНЫЙ QR КОД';
        } else if (error.message === 'NOT_FOUND') {
          errorMessage = 'КОД НЕ ЗАРЕГИСТРИРОВАН';
        } else if (error.message.startsWith('ALREADY_USED:')) {
          const dateTime = error.message.split('ALREADY_USED:')[1];
          errorMessage = `УЖЕ ИСПОЛЬЗОВАН\n${dateTime}`;
        } else if (error.code === 'permission-denied') {
          errorMessage = 'НЕТ ДОСТУПА К БАЗЕ ДАННЫХ';
        } else {
          // Show more detailed error for debugging
          errorMessage = `ОШИБКА: ${error.message || 'Неизвестная ошибка'}`;
        }

        setMessage(errorMessage);
        setScreen('error');
        haptic('rigid');

        // Error notification
        try {
          if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          }
        } catch (e) {
          console.log('Haptic error notification failed:', e);
        }
      }
    } finally {
      // Only set processing false if not showing success
      if (screen !== 'success') {
        setIsProcessing(false);
      } else {
        // Delay clearing processing for success to ensure render
        setTimeout(() => setIsProcessing(false), 100);
      }
    }
  }, [telegramUser, haptic]);

  // Native mobile scanner using new approach
  const startScanning = useCallback(async () => {
    setScreen('scan');
    haptic('light');

    try {
      // Clean up any existing scanner first
      const existingScanner = (window as any).currentScanner;
      if (existingScanner && existingScanner.stop) {
        try {
          await existingScanner.stop();
          existingScanner.clear();
        } catch (e) {
          console.log('Existing scanner cleanup error:', e);
        }
        (window as any).currentScanner = null;
      }

      // Check if we have camera permissions
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (result.state === 'denied') {
        setMessage('Доступ к камере запрещен. Разрешите в настройках.');
        setScreen('error');
        return;
      }

      // Dynamic import of QR scanner library optimized for mobile
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      
      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Mobile optimizations
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Stop scanning immediately
          await html5QrCode.stop();
          await processQRCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors, they're normal
        }
      );

      // Store reference for cleanup
      (window as any).currentScanner = html5QrCode;

    } catch (error) {
      console.error('Scanner error:', error);
      setMessage('Не удалось запустить сканер');
      setScreen('error');
    }
  }, [processQRCode, haptic]);

  // Upload image fallback
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScreen('process');
    haptic('light');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader-hidden');
      
      const result = await html5QrCode.scanFile(file, false);
      await processQRCode(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('QR код не найден на изображении');
      setScreen('error');
    }
  }, [processQRCode, haptic]);

  // Reset scanner
  const reset = useCallback(async () => {
    // Clean up any active scanner
    const scanner = (window as any).currentScanner;
    if (scanner && scanner.stop) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (e) {
        console.log('Scanner cleanup error:', e);
      }
      (window as any).currentScanner = null;
    }
    
    setScreen('welcome');
    setMessage('');
    setCode('');
    setIsProcessing(false);
    haptic('soft');
  }, [haptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const scanner = (window as any).currentScanner;
      if (scanner && scanner.stop) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>VNVNC - Сканер доступа</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </Head>

      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-vnvnc-darkred via-black to-vnvnc-darkred animate-gradient" />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="px-6 py-4 flex items-center justify-between border-b border-vnvnc-red/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vnvnc-red rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xl">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">VNVNC</h1>
                <p className="text-xs text-vnvnc-red">Контроль доступа</p>
              </div>
            </div>
            {telegramUser && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Вход как</p>
                <p className="text-sm text-vnvnc-red">@{telegramUser.username || telegramUser.first_name}</p>
              </div>
            )}
          </header>

          {/* Main content */}
          <main className="flex-1 flex items-center justify-center p-6">
            {/* Welcome screen */}
            {screen === 'welcome' && (
              <div className="w-full max-w-sm animate-fadeIn">
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-vnvnc-red rounded-3xl animate-pulse opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-br from-vnvnc-red to-vnvnc-lightred rounded-3xl flex items-center justify-center">
                      <img src="/images/vnvnc-logo.png" alt="VNVNC" className="w-20 h-20 filter brightness-0 invert" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Сканируйте пропуск</h2>
                  <p className="text-gray-400">Покажите ваш QR код для проверки</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={startScanning}
                    className="w-full py-4 bg-vnvnc-red hover:bg-vnvnc-darkred text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>СКАНИРОВАТЬ QR КОД</span>
                    </div>
                  </button>

                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-2xl transition-all cursor-pointer">
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Scanning screen */}
            {screen === 'scan' && (
              <div className="w-full max-w-md animate-fadeIn">
                <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />
                <button
                  onClick={reset}
                  className="w-full mt-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-2xl transition-all"
                >
                  ОТМЕНА
                </button>
              </div>
            )}

            {/* Processing screen */}
            {screen === 'process' && (
              <div className="text-center animate-fadeIn">
                <div className="w-24 h-24 mx-auto mb-6">
                  <svg className="w-full h-full text-vnvnc-red animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-xl">ПРОВЕРКА...</p>
              </div>
            )}

            {/* Success screen */}
            {screen === 'success' && (
              <div className="text-center animate-fadeIn">
                <div className="w-32 h-32 mx-auto mb-6 bg-vnvnc-red rounded-full flex items-center justify-center animate-scaleIn">
                  <svg className="w-20 h-20 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-vnvnc-red mb-2">{message}</h2>
                <p className="text-gray-400 mb-2">Добро пожаловать в VNVNC</p>
                <p className="text-sm text-gray-500 mb-8">{code}</p>
                <button
                  onClick={reset}
                  className="px-8 py-3 bg-vnvnc-red hover:bg-vnvnc-darkred text-white font-bold rounded-2xl transition-all"
                >
                  СКАНИРОВАТЬ ЕЩЕ
                </button>
              </div>
            )}

            {/* Error screen */}
            {screen === 'error' && (
              <div className="text-center animate-fadeIn">
                <div className="w-32 h-32 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center animate-scaleIn">
                  <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-4 whitespace-pre-line">{message}</h2>
                <button
                  onClick={reset}
                  className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all"
                >
                  ПОПРОБОВАТЬ СНОВА
                </button>
              </div>
            )}
          </main>

          {/* Hidden div for file upload scanner */}
          <div id="qr-reader-hidden" className="hidden" />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-5%, -5%) rotate(1deg); }
          50% { transform: translate(5%, -5%) rotate(-1deg); }
          75% { transform: translate(-5%, 5%) rotate(1deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        .animate-gradient {
          animation: gradient 20s ease infinite;
          background-size: 200% 200%;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
}