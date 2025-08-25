import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AdminHeader from '@/components/AdminHeader';
import { InvitationManager, VNVNCInvitation } from '@/lib/invitation-manager';
import { QRGenerator } from '@/lib/qr-generator';
import Head from 'next/head';

export default function InvitationsManager() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<VNVNCInvitation[]>([]);
  const [instagramInput, setInstagramInput] = useState('');
  const [batchName, setBatchName] = useState('');
  const [eventDate, setEventDate] = useState<'2025-08-29' | '2025-08-30' | 'both'>('both');
  const [invitationType, setInvitationType] = useState<'link' | 'qr'>('link');
  const [qrCount, setQrCount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<{ [key: string]: boolean }>({});
  const [qrProgress, setQrProgress] = useState(0);

  const manager = new InvitationManager();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        loadInvitations();
      } else {
        router.push('/admin/login?redirect=/admin/invitations');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadInvitations = async () => {
    try {
      const invites = await manager.getAllInvitations();
      setInvitations(invites);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleCreateBatch = async () => {
    if (invitationType === 'link') {
      // HTML Link invitations
      if (!instagramInput.trim() || !batchName.trim()) {
        setMessage('Заполните все поля');
        return;
      }

      setProcessing(true);
      setMessage('');

      try {
        const handles = manager.parseInstagramHandles(instagramInput);
        
        if (handles.length === 0) {
          setMessage('Не найдено валидных Instagram аккаунтов');
          setProcessing(false);
          return;
        }

        const newInvitations = await manager.createBatchInvitations(
          handles,
          batchName,
          eventDate,
          invitationType
        );

        setInvitations([...newInvitations, ...invitations]);
        setMessage(`Создано ${newInvitations.length} приглашений`);
        setInstagramInput('');
        setBatchName('');
      } catch (error) {
        console.error('Error creating batch:', error);
        setMessage('Ошибка создания приглашений');
      } finally {
        setProcessing(false);
      }
    } else {
      // QR Code invitations
      if (!batchName.trim()) {
        setMessage('Введите название группы');
        return;
      }

      setProcessing(true);
      setMessage('');
      setQrProgress(0);

      try {
        // First create invitations in Firebase
        const newInvitations: VNVNCInvitation[] = [];
        const codes: string[] = [];
        
        setMessage('Создание приглашений в базе данных...');
        
        for (let i = 0; i < qrCount; i++) {
          // Generate unique code
          const code = `VNVNC-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          codes.push(code);
          
          // Create invitation in Firebase with this code
          const invitation = await manager.createInvitationWithCode(
            code,
            'QR_CODE_USER',
            eventDate,
            batchName,
            'qr'
          );
          newInvitations.push(invitation);
        }

        setMessage('Генерация QR кодов...');
        
        // Now generate QR codes with the codes that exist in database
        const { zipBlob } = await QRGenerator.generateQRBatchFromCodes(
          codes,
          eventDate,
          batchName,
          (progress) => setQrProgress(progress)
        );

        setInvitations([...newInvitations, ...invitations]);

        // Download ZIP file
        QRGenerator.downloadQRZip(zipBlob, batchName);

        setMessage(`Создано ${qrCount} QR кодов и загружен ZIP архив`);
        setBatchName('');
        setQrCount(10);
        setQrProgress(0);
      } catch (error) {
        console.error('Error creating QR batch:', error);
        setMessage('Ошибка создания QR кодов');
      } finally {
        setProcessing(false);
        setQrProgress(0);
      }
    }
  };

  const downloadSingleQR = async (inv: VNVNCInvitation) => {
    setGeneratingQR({ ...generatingQR, [inv.id!]: true });
    try {
      await QRGenerator.downloadSingleQR(inv.inviteUrl, inv.code);
    } catch (error) {
      console.error('Error downloading QR:', error);
    } finally {
      setGeneratingQR({ ...generatingQR, [inv.id!]: false });
    }
  };

  const copyLink = (inviteUrl: string, id: string) => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyMessage = (handle: string, inviteUrl: string) => {
    const message = `привет! это vnvnc 🖤❤️

29–30 августа отмечаем день рождения клуба и хотим видеть тебя на одной из ночей.

твоя персональная ссылка на приглашение:
${inviteUrl}

проход без очереди, fc остаётся
23:00 – 8:00
конюшенная 2в`;

    navigator.clipboard.writeText(message);
    setCopiedId(handle);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAsSent = async (id: string) => {
    try {
      await manager.markAsSent(id);
      setInvitations(invitations.map(inv => 
        inv.id === id ? { ...inv, status: 'sent' } : inv
      ));
    } catch (error) {
      console.error('Error marking as sent:', error);
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это приглашение?')) {
      return;
    }
    
    try {
      await manager.deleteInvitation(id);
      setInvitations(invitations.filter(inv => inv.id !== id));
      setMessage('Приглашение удалено');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      setMessage('Ошибка удаления приглашения');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      created: 'bg-gray-600',
      sent: 'bg-blue-600',
      viewed: 'bg-yellow-600',
      redeemed: 'bg-green-600',
      expired: 'bg-red-600',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-600';
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      created: 'Создано',
      sent: 'Отправлено',
      viewed: 'Просмотрено',
      redeemed: 'Использовано',
      expired: 'Истекло',
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const formatExpirationDate = (inv: VNVNCInvitation) => {
    if (!inv.expiresAt) return 'Нет срока';
    
    const date = inv.expiresAt.toDate ? inv.expiresAt.toDate() : new Date(inv.expiresAt as any);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hours = date.getHours();
    
    if (month === 8) {
      if (day === 30) return '30 авг 8:00';
      if (day === 31) return '31 авг 8:00';
    }
    return `${day}.${month} ${hours}:00`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl loading-dots">Загрузка</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>VNVNC - Управление приглашениями</title>
      </Head>
      
      <div className="min-h-screen bg-vnvnc-black">
        <AdminHeader />
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Управление приглашениями</h1>

          {/* Create Batch Section */}
          <div className="vnvnc-card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Создать приглашения</h2>
            
            <div className="space-y-4">
              {/* Invitation Type Selector */}
              <div>
                <label className="block text-gray-300 mb-2">Тип приглашения</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setInvitationType('link')}
                    className={`flex-1 p-3 rounded border-2 transition-all ${
                      invitationType === 'link'
                        ? 'bg-vnvnc-red border-vnvnc-red text-white'
                        : 'bg-vnvnc-darkgray border-vnvnc-gray text-gray-300 hover:border-vnvnc-red'
                    }`}
                  >
                    <div className="font-bold mb-1">HTML Ссылки</div>
                    <div className="text-sm">Для отправки через Instagram</div>
                  </button>
                  <button
                    onClick={() => setInvitationType('qr')}
                    className={`flex-1 p-3 rounded border-2 transition-all ${
                      invitationType === 'qr'
                        ? 'bg-vnvnc-red border-vnvnc-red text-white'
                        : 'bg-vnvnc-darkgray border-vnvnc-gray text-gray-300 hover:border-vnvnc-red'
                    }`}
                  >
                    <div className="font-bold mb-1">QR Коды с логотипом</div>
                    <div className="text-sm">Загрузка в ZIP архиве</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Название группы</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder={invitationType === 'link' ? "Например: Блогеры Instagram Август 2025" : "Например: VIP QR Коды"}
                  className="vnvnc-input w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Даты события</label>
                <select
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value as any)}
                  className="vnvnc-input w-full"
                >
                  <option value="both">29-30 августа (оба дня)</option>
                  <option value="2025-08-29">29 августа</option>
                  <option value="2025-08-30">30 августа</option>
                </select>
              </div>

              {invitationType === 'link' ? (
                <div>
                  <label className="block text-gray-300 mb-2">
                    Instagram аккаунты (по одному на строку)
                  </label>
                  <textarea
                    value={instagramInput}
                    onChange={(e) => setInstagramInput(e.target.value)}
                    placeholder="@username или https://instagram.com/username"
                    rows={10}
                    className="vnvnc-input w-full font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 mb-2">
                    Количество QR кодов
                  </label>
                  <input
                    type="number"
                    value={qrCount}
                    onChange={(e) => setQrCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="100"
                    className="vnvnc-input w-full"
                  />
                  <p className="text-gray-400 text-sm mt-1">Максимум 100 кодов за раз</p>
                </div>
              )}

              {qrProgress > 0 && qrProgress < 100 && (
                <div className="bg-vnvnc-darkgray rounded p-3">
                  <div className="text-gray-300 text-sm mb-2">Генерация QR кодов: {qrProgress}%</div>
                  <div className="bg-vnvnc-gray rounded-full h-2">
                    <div 
                      className="bg-vnvnc-red h-2 rounded-full transition-all"
                      style={{ width: `${qrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded ${message.includes('Ошибка') ? 'bg-red-900' : 'bg-green-900'} text-white`}>
                  {message}
                </div>
              )}

              <button
                onClick={handleCreateBatch}
                disabled={processing}
                className="vnvnc-button w-full"
              >
                {processing ? (
                  invitationType === 'qr' ? 'Генерация QR кодов...' : 'Создание...'
                ) : (
                  invitationType === 'qr' ? `Создать ${qrCount} QR кодов` : 'Создать приглашения'
                )}
              </button>
            </div>
          </div>

          {/* Invitations List */}
          <div className="vnvnc-card">
            <h2 className="text-xl font-bold text-white mb-4">
              Все приглашения ({invitations.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-vnvnc-gray">
                    <th className="text-left p-2 text-gray-300">Получатель</th>
                    <th className="text-left p-2 text-gray-300">Код</th>
                    <th className="text-left p-2 text-gray-300">Тип</th>
                    <th className="text-left p-2 text-gray-300">Статус</th>
                    <th className="text-left p-2 text-gray-300">Даты события</th>
                    <th className="text-left p-2 text-gray-300">Истекает</th>
                    <th className="text-left p-2 text-gray-300">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-vnvnc-gray/30 hover:bg-vnvnc-gray/20">
                      <td className="p-2 text-white font-mono">
                        {inv.instagramHandle === 'QR_CODE_USER' ? 'QR Code' : `@${inv.instagramHandle}`}
                      </td>
                      <td className="p-2 text-gray-300 font-mono text-xs">
                        {inv.code}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          inv.invitationType === 'qr' ? 'bg-purple-600' : 'bg-indigo-600'
                        }`}>
                          {inv.invitationType === 'qr' ? 'QR' : 'Link'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusBadge(inv.status)}`}>
                          {getStatusText(inv.status)}
                        </span>
                      </td>
                      <td className="p-2 text-gray-300 text-xs">
                        {inv.metadata.eventDate === 'both' ? '29-30 авг' : 
                         inv.metadata.eventDate === '2025-08-29' ? '29 авг' : '30 авг'}
                      </td>
                      <td className="p-2 text-gray-300 text-xs">
                        {formatExpirationDate(inv)}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {inv.invitationType === 'qr' ? (
                            <button
                              onClick={() => downloadSingleQR(inv)}
                              disabled={generatingQR[inv.id!]}
                              className="text-purple-500 hover:text-purple-400 text-xs"
                            >
                              {generatingQR[inv.id!] ? 'Генерация...' : 'Скачать QR'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => copyLink(inv.inviteUrl, inv.id!)}
                                className="text-vnvnc-red hover:text-vnvnc-lightred text-xs"
                              >
                                {copiedId === inv.id ? '✓' : 'Ссылка'}
                              </button>
                              <button
                                onClick={() => copyMessage(inv.instagramHandle, inv.inviteUrl)}
                                className="text-vnvnc-red hover:text-vnvnc-lightred text-xs"
                              >
                                {copiedId === inv.instagramHandle ? '✓' : 'Сообщение'}
                              </button>
                            </>
                          )}
                          {inv.status === 'created' && (
                            <button
                              onClick={() => markAsSent(inv.id!)}
                              className="text-blue-500 hover:text-blue-400 text-xs"
                            >
                              Отправлено
                            </button>
                          )}
                          <button
                            onClick={() => deleteInvitation(inv.id!)}
                            className="text-red-500 hover:text-red-400 text-xs"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}