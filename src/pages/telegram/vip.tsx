import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { findVIPByInstagram, VIPMapping } from '@/data/vip-mappings';

export default function VNVNCVip() {
  const [screen, setScreen] = useState<'input' | 'display'>('input');
  const [instagram, setInstagram] = useState('');
  const [vipData, setVipData] = useState<VIPMapping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize Telegram Mini App
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const WebApp = window.Telegram.WebApp;
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#DC2626');
      WebApp.setBackgroundColor('#000000');
      
      // Prevent closing
      WebApp.disableClosingConfirmation();
      
      // Enable haptic feedback
      if (WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('soft');
      }

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }

    // Auto-play video
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
      });
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' | 'error' | 'success' | 'warning') => {
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      const HapticFeedback = (window as any).Telegram.WebApp.HapticFeedback;
      if (type === 'error' || type === 'success' || type === 'warning') {
        HapticFeedback.notificationOccurred(type);
      } else {
        HapticFeedback.impactOccurred(type);
      }
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!instagram.trim()) {
      haptic('error');
      setError('Введите Instagram');
      return;
    }

    setIsLoading(true);
    setError('');
    haptic('light');

    // Simulate loading for effect
    setTimeout(() => {
      const vip = findVIPByInstagram(instagram);
      
      if (vip) {
        setVipData(vip);
        setScreen('display');
        haptic('success');
      } else {
        setError('Instagram не найден');
        haptic('error');
      }
      
      setIsLoading(false);
    }, 500);
  }, [instagram, haptic]);

  // Copy invite link to clipboard
  const copyLink = useCallback(async () => {
    if (!vipData) return;
    
    const inviteUrl = `https://vnvnc-invites.vercel.app/invite/${vipData.code}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      haptic('success');
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      haptic('error');
    }
  }, [vipData, haptic]);

  // Download QR code
  const downloadQR = useCallback(async () => {
    if (!vipData) return;
    
    haptic('medium');
    
    try {
      const response = await fetch(`/qr-vip/${vipData.qrFile}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VNVNC-${instagram}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      haptic('success');
    } catch (err) {
      haptic('error');
    }
  }, [vipData, instagram, haptic]);

  // Reset to input screen
  const reset = useCallback(() => {
    setScreen('input');
    setInstagram('');
    setVipData(null);
    setError('');
    haptic('soft');
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [haptic]);

  return (
    <>
      <Head>
        <title>VNVNC VIP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/herovideo-mobile.mp4" type="video/mp4" />
        </video>

        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
          {/* Logo */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <Image
              src="/images/vnvnc-logo.png"
              alt="VNVNC"
              width={120}
              height={60}
              className="drop-shadow-2xl"
            />
          </div>

          {screen === 'input' ? (
            /* Input Screen */
            <div className="w-full max-w-sm">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                <h1 className="text-3xl font-bold text-white text-center mb-8">
                  Приглашение
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={instagram}
                      onChange={(e) => {
                        setInstagram(e.target.value);
                        setError('');
                        haptic('soft');
                      }}
                      placeholder="Введите ваш Instagram"
                      className="w-full px-6 py-4 text-lg bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-center animate-pulse">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-2xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => haptic('medium')}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Загрузка...
                      </span>
                    ) : (
                      'Получить QR-код'
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-white/60 text-sm">
                    29-30 августа 2025
                  </p>
                  <p className="text-white/60 text-sm">
                    Конюшенная 2В
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* QR Display Screen */
            <div className="w-full max-w-sm animate-fadeIn">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  Ваше приглашение
                </h2>

                <div className="bg-white rounded-2xl p-4 mb-6">
                  <img
                    src={`/qr-vip/${vipData?.qrFile}`}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                </div>

                <p className="text-white text-center mb-6">
                  @{vipData?.instagram}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={copyLink}
                    className="w-full py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl transition-all active:scale-95"
                  >
                    {copySuccess ? '✓ Скопировано!' : 'Копировать ссылку'}
                  </button>

                  <button
                    onClick={downloadQR}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl transition-all active:scale-95"
                  >
                    Сохранить QR-код
                  </button>

                  <button
                    onClick={reset}
                    className="w-full py-3 bg-white/10 backdrop-blur-sm text-white/80 font-semibold rounded-xl transition-all active:scale-95"
                  >
                    Назад
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
}