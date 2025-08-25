import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { InvitationManager, VNVNCInvitation } from '@/lib/invitation-manager';

export default function InvitationPage() {
  const router = useRouter();
  const { code } = router.query;
  const [invitation, setInvitation] = useState<VNVNCInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (code && typeof code === 'string') {
      loadInvitation(code);
    }
  }, [code]);

  const loadInvitation = async (inviteCode: string) => {
    try {
      const manager = new InvitationManager();
      const invite = await manager.getInvitationByCode(inviteCode);
      
      if (!invite) {
        setError('Приглашение не найдено');
        setLoading(false);
        return;
      }

      setInvitation(invite);
      
      // Generate QR code on the client side
      const qrCode = await InvitationManager.generateQRCode(invite.inviteUrl);
      setQrCodeUrl(qrCode);
      
      // Track view
      await manager.trackView(inviteCode);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Ошибка загрузки приглашения');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = () => {
    if (invitation?.metadata.eventDate === 'both') {
      return '29–30 августа 2025';
    } else if (invitation?.metadata.eventDate === '2025-08-29') {
      return '29 августа 2025';
    } else {
      return '30 августа 2025';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          <div className="loading-dots">Загрузка</div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-vnvnc-red text-3xl mb-4">{error || 'Приглашение не найдено'}</h1>
          <p className="text-gray-400">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>VNVNC Birthday Event | Эксклюзивное приглашение</title>
        <meta name="description" content="Эксклюзивное приглашение на день рождения VNVNC - 29-30 августа 2025" />
        <meta property="og:title" content="VNVNC Birthday Event" />
        <meta property="og:description" content="Эксклюзивное приглашение на день рождения клуба" />
        <meta property="og:image" content="/images/vnvnc-logo.png" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#DC2626" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="relative h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-vnvnc-red/20 via-black to-black" />
          
          {/* Logo */}
          <div className="relative z-10 mb-8 fade-in">
            <Image
              src="/images/vnvnc-logo.png"
              alt="VNVNC"
              width={300}
              height={180}
              className="filter drop-shadow-2xl"
              priority
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-md mx-auto slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 glow-red">
              VNVNC
            </h1>
            <p className="text-vnvnc-red text-xl mb-8">ДЕНЬ РОЖДЕНИЯ КЛУБА</p>
            
            <div className="mb-8">
              <p className="text-3xl font-bold mb-2">{formatEventDate()}</p>
              <p className="text-lg text-gray-300">23:00 – 8:00</p>
            </div>

            {invitation.bloggerName && (
              <p className="text-xl mb-8">
                Привет, <span className="text-vnvnc-red font-bold">{invitation.bloggerName}</span>!
              </p>
            )}

            <div className="vnvnc-card mb-8">
              <p className="text-gray-300 mb-4">
                Это VNVNC. Отмечаем день рождения клуба и хотим видеть тебя на одной из ночей.
              </p>
              <p className="text-gray-300">
                Два дня, расширенное время до 8:00, три бара, специальная барная карта и фотозона в духе наших первых вечеринок.
              </p>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="mb-8">
                <div className="qr-vnvnc-frame inline-block p-4 bg-white rounded-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Покажи этот QR-код на входе
                </p>
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-start">
                <span className="text-vnvnc-red mr-3">📍</span>
                <div>
                  <p className="font-semibold">Конюшенная 2В</p>
                  <p className="text-sm text-gray-400">Санкт-Петербург</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-vnvnc-red mr-3">🎫</span>
                <div>
                  <p className="font-semibold">Проход без очереди</p>
                  <p className="text-sm text-gray-400">Face control остаётся</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-vnvnc-red mr-3">📱</span>
                <div>
                  <p className="font-semibold">Бронь столов</p>
                  <p className="text-sm text-gray-400">+7 921 410 44 40</p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-vnvnc-red mr-3">🎂</span>
                <div>
                  <p className="font-semibold">18+</p>
                  <p className="text-sm text-gray-400">Оригинал документа обязателен</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-vnvnc-gray">
              <p className="text-gray-400 text-sm">
                С нас — музыка до утра, удобный вход, места для съёмки
              </p>
              <p className="text-gray-400 text-sm">
                С тебя — настроение и оригинал документа
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}