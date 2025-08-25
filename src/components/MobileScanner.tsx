import { useEffect, useRef, useCallback, useState } from 'react';

interface MobileScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

export function MobileScanner({ onScan, onError, isActive }: MobileScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize camera with mobile-specific constraints
  const initCamera = useCallback(async () => {
    if (!isActive) return;

    try {
      // Mobile-optimized constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      // Try to get camera access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to any rear camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Important: wait for metadata to load
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play()
              .then(() => {
                setIsReady(true);
                resolve();
              })
              .catch((err) => {
                console.error('Play error:', err);
                resolve();
              });
          };
        });

        // Start scanning after camera is ready
        startScanning();
      }
    } catch (error) {
      console.error('Camera init error:', error);
      onError('Camera initialization failed');
    }
  }, [isActive, onError]);

  // Scanning loop
  const startScanning = useCallback(() => {
    if (scanningRef.current) return;
    scanningRef.current = true;

    const scan = async () => {
      if (!videoRef.current || !canvasRef.current || !scanningRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame
      ctx.drawImage(video, 0, 0);

      // Get image data
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Import jsQR dynamically
        const jsQR = (await import('jsqr')).default;
        
        // Detect QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert', // Faster on mobile
        });

        if (code && code.data) {
          // Found a QR code
          scanningRef.current = false;
          onScan(code.data);
          return;
        }
      } catch (error) {
        console.error('Scan error:', error);
      }

      // Continue scanning
      if (scanningRef.current) {
        requestAnimationFrame(scan);
      }
    };

    // Start scanning loop
    requestAnimationFrame(scan);
  }, [onScan]);

  // Cleanup
  const cleanup = useCallback(() => {
    scanningRef.current = false;
    setIsReady(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      initCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isActive, initCamera, cleanup]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video
        ref={videoRef}
        className="w-full rounded-2xl bg-black"
        playsInline
        muted
        autoPlay
      />
      
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Scanning overlay */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-green-500/50 rounded-2xl">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute top-0 right-0 w-full h-1 bg-green-500" />
              <div className="absolute top-0 right-0 w-1 h-full bg-green-500" />
            </div>
            <div className="absolute bottom-0 left-0 w-16 h-16">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
              <div className="absolute bottom-0 left-0 w-1 h-full bg-green-500" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16">
              <div className="absolute bottom-0 right-0 w-full h-1 bg-green-500" />
              <div className="absolute bottom-0 right-0 w-1 h-full bg-green-500" />
            </div>
          </div>
          
          {/* Center target */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-48 h-48 border-2 border-green-500/30 rounded-lg">
              <div className="w-full h-full animate-pulse bg-green-500/10" />
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isReady && isActive && (
        <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-green-500">Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}