import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if this is a telegram route
    const path = window.location.pathname;
    if (path.startsWith('/telegram')) {
      router.push('/telegram');
      return;
    }
    
    // Check auth for admin routes
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
      <>
        <Head>
          <title>VNVNC - Система приглашений</title>
          <meta name="description" content="VNVNC Birthday Event - Система управления приглашениями" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Loader2 className="w-12 h-12 animate-spin text-vnvnc-red" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white">
              VNVNC
            </h1>
            <p className="text-vnvnc-red">Загрузка системы...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>VNVNC - Система приглашений</title>
        <meta name="description" content="VNVNC Birthday Event - Система управления приглашениями" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="mb-12">
            <Image
              src="/images/vnvnc-logo.png"
              alt="VNVNC"
              width={400}
              height={240}
              className="mx-auto mb-8 filter drop-shadow-2xl"
              priority
            />
            <h1 className="text-5xl font-bold mb-4 text-white">
              VNVNC
            </h1>
            <p className="text-xl text-vnvnc-red">
              BIRTHDAY EVENT • 29-30 АВГУСТА 2025
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="vnvnc-card hover:border-vnvnc-red transition-all cursor-pointer" onClick={() => router.push('/admin/login')}>
              <h2 className="text-2xl font-bold mb-2 text-white">АДМИН ПАНЕЛЬ</h2>
              <p className="text-gray-400">Создание и управление приглашениями</p>
            </div>
            
            <div className="vnvnc-card hover:border-vnvnc-red transition-all cursor-pointer" onClick={() => router.push('/telegram')}>
              <h2 className="text-2xl font-bold mb-2 text-white">СКАНЕР ОХРАНЫ</h2>
              <p className="text-gray-400">Проверка QR кодов через Telegram</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}