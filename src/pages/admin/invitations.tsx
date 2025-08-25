import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AdminHeader from '@/components/AdminHeader';
import { InvitationManager, VNVNCInvitation } from '@/lib/invitation-manager';
import Head from 'next/head';

export default function InvitationsManager() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<VNVNCInvitation[]>([]);
  const [instagramInput, setInstagramInput] = useState('');
  const [batchName, setBatchName] = useState('');
  const [eventDate, setEventDate] = useState<'2025-08-29' | '2025-08-30' | 'both'>('both');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        eventDate
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

  const getStatusBadge = (status: string) => {
    const badges = {
      created: 'bg-gray-600',
      sent: 'bg-blue-600',
      viewed: 'bg-yellow-600',
      redeemed: 'bg-green-600',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-600';
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      created: 'Создано',
      sent: 'Отправлено',
      viewed: 'Просмотрено',
      redeemed: 'Использовано',
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
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
              <div>
                <label className="block text-gray-300 mb-2">Название группы</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Например: Блогеры Instagram Август 2025"
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
                {processing ? 'Создание...' : 'Создать приглашения'}
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
                    <th className="text-left p-2 text-gray-300">Instagram</th>
                    <th className="text-left p-2 text-gray-300">Код</th>
                    <th className="text-left p-2 text-gray-300">Статус</th>
                    <th className="text-left p-2 text-gray-300">Даты</th>
                    <th className="text-left p-2 text-gray-300">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-vnvnc-gray/30 hover:bg-vnvnc-gray/20">
                      <td className="p-2 text-white font-mono">
                        @{inv.instagramHandle}
                      </td>
                      <td className="p-2 text-gray-300 font-mono text-xs">
                        {inv.code}
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
                      <td className="p-2">
                        <div className="flex gap-2">
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
                          {inv.status === 'created' && (
                            <button
                              onClick={() => markAsSent(inv.id!)}
                              className="text-blue-500 hover:text-blue-400 text-xs"
                            >
                              Отправлено
                            </button>
                          )}
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