import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { CheckCircle, XCircle, Scan, User, Upload, Camera } from 'lucide-react';

interface ScanResult {
  success: boolean;
  message: string;
  code?: string;
  redeemedAt?: string;
  redeemedBy?: string;
}

export default function TelegramScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [WebApp, setWebApp] = useState<any>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload' | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((module) => {
        const twa = module.default;
        setWebApp(twa);
        twa.ready();
        twa.expand();
        twa.setHeaderColor('#00ff00');
        twa.setBackgroundColor('#0a0a0a');
        
        // Get user info
        const user = twa.initDataUnsafe?.user;
        if (user) {
          setUserInfo(user);
        }
      });
    }
  }, []);

  const startCameraScanning = async () => {
    try {
      addDebug('Запрашиваем доступ к камере...');
      
      // Try different constraint combinations with focus settings
      let stream: MediaStream | null = null;
      const constraints = [
        { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        },
        { 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        },
        { 
          video: { 
            facingMode: 'environment',
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          } 
        },
        { video: true } // Simplest constraint as fallback
      ];
      
      for (const constraint of constraints) {
        try {
          addDebug(`Пробуем constraints: ${JSON.stringify(constraint)}`);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) {
            addDebug('Поток получен');
            break;
          }
        } catch (e) {
          addDebug(`Не удалось с этими constraints: ${e}`);
        }
      }
      
      if (!stream) {
        throw new Error('Не удалось получить видео поток');
      }
      
      addDebug(`Треки: ${stream.getTracks().map(t => t.kind + ':' + t.label).join(', ')}`);
      streamRef.current = stream;
      
      // Set states first to show the video element
      setScanning(true);
      setScanMethod('camera');
      setScanResult(null);
      
      // Use a more robust setup
      requestAnimationFrame(() => {
        if (videoRef.current && streamRef.current) {
          const video = videoRef.current;
          video.srcObject = streamRef.current;
          
          // Add multiple event listeners
          video.oncanplay = () => {
            addDebug(`Video can play, размер: ${video.videoWidth}x${video.videoHeight}`);
          };
          
          video.onloadeddata = () => {
            addDebug(`Video data loaded, размер: ${video.videoWidth}x${video.videoHeight}`);
          };
          
          video.onplaying = () => {
            addDebug(`Video playing, размер: ${video.videoWidth}x${video.videoHeight}`);
            // Try to set focus mode if supported
            const track = streamRef.current?.getVideoTracks()[0];
            if (track) {
              const capabilities = track.getCapabilities ? track.getCapabilities() : {};
              addDebug(`Capabilities: ${JSON.stringify(capabilities)}`);
              
              // Check if advanced camera controls are available
              if ('focusMode' in capabilities) {
                addDebug(`Focus modes available: ${capabilities.focusMode}`);
              }
            }
            // Start scanning
            setTimeout(() => scanQRFromVideo(), 500);
          };
          
          // Try to play
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                addDebug('Play started successfully');
              })
              .catch(error => {
                addDebug(`Play error: ${error.message}`);
                // Try muted autoplay
                video.muted = true;
                video.play().catch(e => addDebug(`Muted play error: ${e.message}`));
              });
          }
        }
      });
    } catch (error: any) {
      addDebug(`Ошибка камеры: ${error.message || error}`);
      setScanning(false);
      setScanMethod(null);
    }
  };

  const scanQRFromVideo = async () => {
    if (!videoRef.current || !canvasRef.current) {
      addDebug('Video or canvas ref missing');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      addDebug('Canvas context not available');
      return;
    }
    
    // Debug video state
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanning && scanMethod === 'camera') {
        requestAnimationFrame(scanQRFromVideo);
      }
      return;
    }
    
    // Update canvas dimensions if needed
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Always draw to canvas (this serves as preview too)
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to detect QR code using jsQR
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        addDebug(`QR обнаружен камерой: ${code.data}`);
        stopCamera();
        handleScan(code.data);
      } else {
        // Continue scanning
        if (scanning && scanMethod === 'camera') {
          requestAnimationFrame(scanQRFromVideo);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      if (scanning && scanMethod === 'camera') {
        requestAnimationFrame(scanQRFromVideo);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        image.src = e.target?.result as string;
        
        image.onload = async () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) return;
          
          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const jsQR = (await import('jsqr')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              addDebug(`QR обнаружен в фото: ${code.data}`);
              handleScan(code.data);
            } else {
              addDebug('QR код не найден в изображении');
              setScanResult({
                success: false,
                message: 'QR КОД НЕ НАЙДЕН',
              });
            }
          } catch (error) {
            console.error('Error scanning uploaded image:', error);
            setScanResult({
              success: false,
              message: 'ОШИБКА СКАНИРОВАНИЯ',
            });
          }
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      setScanResult({
        success: false,
        message: 'ОШИБКА ЗАГРУЗКИ',
      });
    }
  };

  const handleScan = async (qrData: string) => {
    addDebug(`Обработка QR: ${qrData}`);
    
    // Prevent multiple scans
    setScanning(false);
    setScanMethod(null);
    
    // Haptic feedback
    if (WebApp?.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      // Extract code from URL or use as-is if it's already a code
      let code = qrData;
      
      // Check if it's a URL - handle both http and https
      if (qrData.includes('angarqr.web.app/v/') || qrData.includes('events-test-15e71.web.app/v/')) {
        const match = qrData.match(/\/v\/([A-Z0-9-]+)/);
        code = match ? match[1] : qrData;
        addDebug(`Извлечен код из URL: ${code}`);
      } else if (qrData.match(/^ANGAR-\d{4}-\d{4}$/)) {
        // Already in correct format
        addDebug(`Код уже в правильном формате: ${code}`);
      } else {
        addDebug(`Неизвестный формат QR, используем как есть: ${code}`);
      }
      
      addDebug(`Финальный код для поиска: ${code}`);

      // Find invitation by code
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('code', '==', code));
      addDebug(`Поиск в базе кода: ${code}`);
      const snapshot = await getDocs(q);
      addDebug(`Результат: пусто=${snapshot.empty}, количество=${snapshot.size}`);

      if (snapshot.empty) {
        addDebug(`КОД НЕ НАЙДЕН В БАЗЕ: ${code}`);
        setScanResult({
          success: false,
          message: 'НЕВЕРНЫЙ КОД',
          code,
        });
        if (WebApp?.HapticFeedback) {
          WebApp.HapticFeedback.notificationOccurred('error');
        }
        return;
      }

      const invDoc = snapshot.docs[0];
      const invitation = invDoc.data();

      if (invitation.status === 'redeemed') {
        setScanResult({
          success: false,
          message: 'УЖЕ ИСПОЛЬЗОВАН',
          code,
          redeemedAt: invitation.redeemedAt?.toDate().toLocaleString('ru-RU'),
          redeemedBy: invitation.redeemedBy?.username || 'Неизвестно',
        });
        if (WebApp?.HapticFeedback) {
          WebApp.HapticFeedback.notificationOccurred('error');
        }
        return;
      }

      // Redeem the invitation
      await updateDoc(doc(db, 'invitations', invDoc.id), {
        status: 'redeemed',
        redeemedAt: serverTimestamp(),
        redeemedBy: {
          telegramId: userInfo?.id?.toString() || 'unknown',
          username: userInfo?.username || userInfo?.first_name || 'Security',
        },
      });

      setScanResult({
        success: true,
        message: 'ВХОД РАЗРЕШЁН',
        code,
      });

      if (WebApp?.HapticFeedback) {
        WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: 'ОШИБКА СКАНИРОВАНИЯ',
      });
      if (WebApp?.HapticFeedback) {
        WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(false);
    setScanMethod(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-green">
      {/* Header */}
      <header className="border-b border-cyber-green/20 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-cyber">АНГАР СКАНЕР</h1>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <span>{userInfo?.username || userInfo?.first_name || 'Охрана'}</span>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {debugInfo.length > 0 && (
        <div className="border border-yellow-500 bg-black/80 p-2 m-2 text-xs font-mono text-yellow-500 max-h-32 overflow-y-auto">
          <div className="font-bold mb-1">Debug Info:</div>
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="p-4">
        {!scanning && !scanResult && !scanMethod && (
          <div className="text-center py-6">
            <div className="cyber-border inline-block p-6 mb-4">
              <Scan className="w-20 h-20 mx-auto mb-3 animate-pulse-green" />
              <h2 className="text-xl font-bold mb-2 font-cyber">ГОТОВ К СКАНИРОВАНИЮ</h2>
              <p className="text-cyber-green/70 mb-4">Выберите способ сканирования</p>
              
              {/* Test buttons at the top */}
              <div className="mb-4 space-y-1">
                <button
                  onClick={async () => {
                    addDebug('Тест камеры...');
                    try {
                      const devices = await navigator.mediaDevices.enumerateDevices();
                      const videoDevices = devices.filter(d => d.kind === 'videoinput');
                      addDebug(`Найдено камер: ${videoDevices.length}`);
                      videoDevices.forEach(d => {
                        addDebug(`Камера: ${d.label || d.deviceId}`);
                      });
                      
                      // Simple stream test
                      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
                      addDebug(`Тест потока успешен, треков: ${testStream.getTracks().length}`);
                      testStream.getTracks().forEach(track => track.stop());
                    } catch (error: any) {
                      addDebug(`Тест камеры ошибка: ${error.message}`);
                    }
                  }}
                  className="text-xs border border-blue-500 text-blue-500 px-3 py-1"
                >
                  TEST: Проверить камеру
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={startCameraScanning}
                  className="cyber-button w-full flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  СКАНИРОВАТЬ КАМЕРОЙ
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="cyber-button w-full flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  ЗАГРУЗИТЬ ФОТО
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="text-sm text-cyber-green/50 max-w-md mx-auto">
              Если камера не работает, сделайте фото QR кода и загрузите его
            </div>
          </div>
        )}

        {scanning && scanMethod === 'camera' && (
          <div className="mt-8">
            <div className="mx-auto max-w-md relative">
              <video
                ref={videoRef}
                className="w-full border-2 border-cyber-green"
                style={{ 
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  opacity: 0
                }}
                playsInline
                muted
                webkit-playsinline="true"
              />
            </div>
            <p className="text-center mt-4 text-cyber-green/70">
              Наведите камеру на QR код
            </p>
            <div className="text-center mt-2 text-xs text-yellow-500">
              Размер видео: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
            </div>
            
            {/* Show canvas as main display */}
            <div className="relative mx-auto max-w-md mt-4">
              <canvas
                ref={canvasRef}
                className="w-full border-2 border-cyber-green"
                style={{ maxWidth: '400px', display: 'block', margin: '0 auto' }}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyber-green">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-green"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-green"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-green"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-green"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => {
                  // Try to trigger autofocus
                  const track = streamRef.current?.getVideoTracks()[0];
                  if (track) {
                    addDebug('Пытаемся улучшить изображение...');
                    // Try to apply standard constraints
                    if (track.applyConstraints) {
                      track.applyConstraints({
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        aspectRatio: { ideal: 16/9 }
                      }).then(() => {
                        addDebug('Качество улучшено');
                      }).catch(e => addDebug(`Ошибка: ${e.message}`));
                    }
                  }
                }}
                className="text-xs border border-yellow-500 text-yellow-500 px-3 py-1"
              >
                ФОКУС
              </button>
              <button
                onClick={() => {
                  setScanning(false);
                  setScanMethod(null);
                  stopCamera();
                }}
                className="cyber-button"
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="mt-8 max-w-md mx-auto">
            <div className={`cyber-border p-8 text-center ${
              scanResult.success ? 'border-cyber-green' : 'border-red-500'
            }`}>
              {scanResult.success ? (
                <CheckCircle className="w-24 h-24 mx-auto mb-4 text-cyber-green animate-pulse-green" />
              ) : (
                <XCircle className="w-24 h-24 mx-auto mb-4 text-red-500" />
              )}
              
              <h2 className={`text-3xl font-bold mb-2 ${
                scanResult.success ? 'text-cyber-green' : 'text-red-500'
              }`}>
                {scanResult.message}
              </h2>
              
              {scanResult.code && (
                <p className="text-sm text-cyber-green/70 mb-4">
                  Код: {scanResult.code}
                </p>
              )}
              
              {scanResult.redeemedAt && (
                <div className="text-sm text-red-400 space-y-1">
                  <p>Использован: {scanResult.redeemedAt}</p>
                  <p>Кем: {scanResult.redeemedBy}</p>
                </div>
              )}
              
              <button
                onClick={resetScanner}
                className="cyber-button mt-6"
              >
                СКАНИРОВАТЬ ЕЩЁ
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Style for QR Scanner */}
      <style jsx global>{`
        .shadow-cyber {
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        }
      `}</style>
    </div>
  );
}