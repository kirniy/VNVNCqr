import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, Zap, AlertCircle } from 'lucide-react';

interface CameraScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

export function CameraScanner({ onScan, onError, isProcessing }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraReady(false);
    setTorchOn(false);
  }, []);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{
          torch: !torchOn
        }] as any
      });
      setTorchOn(!torchOn);
    } catch (error) {
      console.error('Torch toggle error:', error);
    }
  }, [torchOn, torchSupported]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Request camera with optimal settings for QR scanning
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play()
              .then(() => {
                setCameraReady(true);
                resolve();
              })
              .catch((error) => {
                console.error('Video play error:', error);
                onError('Не удалось запустить видео');
                resolve();
              });
          };
        });

        // Check torch support
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities?.() as any;
          if (capabilities?.torch) {
            setTorchSupported(true);
          }
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Доступ к камере запрещен. Разрешите доступ в настройках.');
        } else if (error.name === 'NotFoundError') {
          onError('Камера не найдена');
        } else {
          onError(`Ошибка камеры: ${error.message}`);
        }
      } else {
        onError('Не удалось запустить камеру');
      }
    }
  }, [onError]);

  // Scan QR code
  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isProcessing) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Import jsQR dynamically
      const jsQR = (await import('jsqr')).default;
      
      // Try to detect QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth', // Try both normal and inverted
      });

      if (code && code.data) {
        // Stop scanning
        setIsScanning(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        
        // Notify parent
        onScan(code.data);
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
  }, [cameraReady, isProcessing, onScan]);

  // Start scanning loop
  useEffect(() => {
    if (cameraReady && !isScanning && !isProcessing) {
      setIsScanning(true);
      // Scan every 100ms for smooth detection
      scanIntervalRef.current = setInterval(scanQRCode, 100);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [cameraReady, isScanning, isProcessing, scanQRCode]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return cleanup;
  }, []);

  return (
    <div className="relative">
      {/* Video element */}
      <div className="relative mx-auto max-w-md">
        <video
          ref={videoRef}
          className="w-full rounded-lg"
          playsInline
          muted
          style={{
            transform: 'scaleX(-1)', // Mirror for selfie camera
          }}
        />
        
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-cyber-green/30 rounded-lg">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyber-green rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyber-green rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyber-green rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyber-green rounded-br-lg" />
            
            {/* Center square */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyber-green">
              {isScanning && (
                <div className="absolute inset-0 bg-cyber-green/10 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Controls overlay */}
        {cameraReady && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-3 rounded-full ${
                  torchOn ? 'bg-cyber-green text-black' : 'bg-black/50 text-cyber-green'
                } border border-cyber-green`}
              >
                <Zap className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse text-cyber-green" />
              <p className="text-sm text-cyber-green">Запуск камеры...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-cyber-green/70">
          Наведите камеру на QR код
        </p>
        {!cameraReady && (
          <p className="text-xs text-yellow-500 mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Разрешите доступ к камере
          </p>
        )}
      </div>
    </div>
  );
}