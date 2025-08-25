import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Zap, Shield, Loader2 } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if this is a telegram route
    const path = window.location.pathname;
    if (path.startsWith('/telegram')) {
      // Redirect to telegram scanner
      router.push('/telegram');
      return;
    }
    
    // Only check auth for admin routes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black cyber-grid-bg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Loader2 className="w-12 h-12 animate-spin text-cyber-green" />
          </div>
          <h1 className="text-4xl font-bold mb-4 glitch font-cyber" data-text="АНГАР QR">
            АНГАР QR
          </h1>
          <p className="text-cyber-green/70">Инициализация системы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black cyber-grid-bg">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 glitch font-cyber" data-text="АНГАР QR">
            АНГАР QR
          </h1>
          <p className="text-xl text-cyber-green/70 font-display">
            ТЕХНИЧЕСКИЕ • СИСТЕМА ПРИГЛАШЕНИЙ
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <div className="cyber-border p-8 hover:shadow-2xl hover:shadow-cyber-green/30 transition-all">
            <Zap className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 font-cyber">АДМИН ПАНЕЛЬ</h2>
            <p className="text-cyber-green/70">Создание и управление QR приглашениями</p>
          </div>
          
          <div className="cyber-border p-8 hover:shadow-2xl hover:shadow-cyber-green/30 transition-all">
            <Shield className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 font-cyber">СКАНЕР ОХРАНЫ</h2>
            <p className="text-cyber-green/70">Проверка входа через Telegram</p>
          </div>
        </div>
      </div>
    </div>
  );
}