import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, deleteDoc, doc, writeBatch, getDoc, updateDoc } from 'firebase/firestore';
import { generateQRBatch } from '@/lib/qr-generator';
import { formatDateTime } from '@/lib/date-utils';
import { Download, LogOut, Zap, Shield, Activity, QrCode, Trash2, Eye } from 'lucide-react';
import JSZip from 'jszip';
import type { Batch, Invitation } from '@/types';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(100);
  const [eventDate, setEventDate] = useState('2025-08-22');
  const [batchName, setBatchName] = useState('');
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchInvitations, setBatchInvitations] = useState<Invitation[]>([]);
  const [downloadingBatch, setDownloadingBatch] = useState<string | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize Telegram WebApp with simple approach like straight-outta
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#00ff00');
      window.Telegram.WebApp.setBackgroundColor('#000000');
    }
    
    // Check if we're in Telegram Mini App context
    const isTelegramApp = typeof window !== 'undefined' && (window as any).Telegram?.WebApp;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadRecentBatches();
      } else {
        // Only redirect to login if not in Telegram context
        if (!isTelegramApp) {
          router.push('/admin/login');
        } else {
          // In Telegram context, try to load batches anyway
          loadRecentBatches();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadRecentBatches = async () => {
    try {
      const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const batches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Batch));
    
    // Update redeemed counts for all batches
    const updatedBatches = await Promise.all(batches.map(async (batch) => {
      // Count redeemed invitations for this batch
      const invQuery = query(
        collection(db, 'invitations'),
        where('metadata.batchId', '==', batch.id),
        where('status', '==', 'redeemed')
      );
      const invSnapshot = await getDocs(invQuery);
      const redeemedCount = invSnapshot.size;
      
      // Update batch document if count changed
      if (redeemedCount !== batch.redeemedCount) {
        await updateDoc(doc(db, 'batches', batch.id), {
          redeemedCount
        });
      }
      
      return { ...batch, redeemedCount };
    }));
    
    setRecentBatches(updatedBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
      // In Telegram context, auth might fail, so just set empty batches
      setRecentBatches([]);
    }
  };

  const updateBatchRedeemedCount = async (batchId: string) => {
    // Count redeemed invitations
    const q = query(
      collection(db, 'invitations'),
      where('metadata.batchId', '==', batchId),
      where('status', '==', 'redeemed')
    );
    const snapshot = await getDocs(q);
    const redeemedCount = snapshot.size;
    
    // Update batch document
    await updateDoc(doc(db, 'batches', batchId), {
      redeemedCount
    });
  };

  const handleGenerateBatch = async () => {
    setGenerating(true);

    try {
      console.log('Starting QR generation for', count, 'codes');
      
      // Create batch document first to get the ID
      const batchDoc = await addDoc(collection(db, 'batches'), {
        name: batchName || `ПАРТИЯ ${formatDateTime(new Date())}`,
        createdAt: serverTimestamp(),
        createdBy: user.email,
        totalCount: count,
        redeemedCount: 0,
        prefix: 'ANGAR',
        invitationCodes: [], // Will be updated after generation
      });
      
      // Generate QR codes with the batch ID
      const qrCodes = await generateQRBatch(count, 'ANGAR', batchDoc.id);
      
      // Update batch with generated codes
      await updateDoc(doc(db, 'batches', batchDoc.id), {
        invitationCodes: qrCodes.map(qr => qr.code),
      });

      // Save invitations to Firestore
      const promises = qrCodes.map(({ code }) => 
        addDoc(collection(db, 'invitations'), {
          code,
          status: 'active',
          createdAt: serverTimestamp(),
          eventInfo: {
            name: batchName || 'ANGAR EVENT',
            date: new Date(eventDate),
            venue: 'ANGAR NIGHTCLUB',
          },
          metadata: {
            batchId: batchDoc.id,
          },
        })
      );

      await Promise.all(promises);

      // Create ZIP file
      const zip = new JSZip();
      const folder = zip.folder(`ANGAR-QR-${formatDateTime(new Date()).split(' ')[0].replace(/\./g, '-')}`);
      
      qrCodes.forEach(({ code, qrDataUrl }) => {
        const base64Data = qrDataUrl.split(',')[1];
        folder!.file(`${code}.png`, base64Data, { base64: true });
      });

      // Download ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANGAR-QR-${formatDateTime(new Date()).split(' ')[0].replace(/\./g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      // Reload batches
      await loadRecentBatches();
      setBatchName('');
    } catch (error) {
      console.error('Error generating batch:', error);
      alert(`Ошибка генерации QR кодов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const loadBatchInvitations = async (batch: Batch) => {
    const q = query(
      collection(db, 'invitations'),
      where('metadata.batchId', '==', batch.id)
    );
    const snapshot = await getDocs(q);
    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invitation));
    
    // Count redeemed invitations
    const redeemedCount = invitations.filter(inv => inv.status === 'redeemed').length;
    
    // Update batch with current redeemed count
    const updatedBatch = { ...batch, redeemedCount };
    
    setBatchInvitations(invitations);
    setSelectedBatch(updatedBatch);
    
    // Update the batch in Firestore
    if (redeemedCount !== batch.redeemedCount) {
      await updateDoc(doc(db, 'batches', batch.id), {
        redeemedCount
      });
      // Reload batches to show updated counts
      await loadRecentBatches();
    }
  };

  const downloadBatch = async (batch: Batch) => {
    setDownloadingBatch(batch.id);
    try {
      // Get all invitations for this batch
      const q = query(
        collection(db, 'invitations'),
        where('metadata.batchId', '==', batch.id)
      );
      const snapshot = await getDocs(q);
      
      // Generate QR codes for each invitation
      const zip = new JSZip();
      const folder = zip.folder(`ANGAR-QR-${batch.name.replace(/\s+/g, '-')}`);
      
      for (const doc of snapshot.docs) {
        const invitation = doc.data();
        const { generateCyberQR } = await import('@/lib/qr-generator');
        const qrDataUrl = await generateCyberQR({ 
          code: invitation.code,
          logoUrl: '/images/angar_logo.svg'
        });
        const base64Data = qrDataUrl.split(',')[1];
        folder!.file(`${invitation.code}.png`, base64Data, { base64: true });
      }
      
      // Download ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch.name.replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading batch:', error);
      alert('Ошибка при скачивании партии');
    } finally {
      setDownloadingBatch(null);
    }
  };

  const deleteBatch = async (batch: Batch) => {
    if (!confirm(`Удалить партию "${batch.name}"? Это действие нельзя отменить.`)) {
      return;
    }
    
    setDeletingBatch(batch.id);
    try {
      // Delete all invitations in batch
      const q = query(
        collection(db, 'invitations'),
        where('metadata.batchId', '==', batch.id)
      );
      const snapshot = await getDocs(q);
      
      const batchWrite = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batchWrite.delete(doc.ref);
      });
      
      // Delete batch document
      batchWrite.delete(doc(db, 'batches', batch.id));
      await batchWrite.commit();
      
      // Reload batches
      await loadRecentBatches();
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch(null);
        setBatchInvitations([]);
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Ошибка при удалении партии');
    } finally {
      setDeletingBatch(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black">
        <div className="animate-pulse text-cyber-green">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black cyber-grid-bg">
      {/* Header */}
      <header className="border-b border-cyber-green/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold glitch font-cyber flex-shrink-0" data-text="АНГАР">
            <span className="hidden sm:inline">АНГАР АДМИН</span>
            <span className="sm:hidden">АНГАР</span>
          </h1>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto">
            <button
              onClick={() => router.push('/admin/logs')}
              className="flex items-center gap-1 md:gap-2 cyber-button px-1.5 sm:px-2 md:px-4 py-2 flex-shrink-0"
              title="Логи"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">ЛОГИ</span>
            </button>
            <a
              href="/telegram"
              target="_blank"
              className="flex items-center gap-1 md:gap-2 cyber-button px-1.5 sm:px-2 md:px-4 py-2 flex-shrink-0"
              title="Сканер"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden md:inline">СКАНЕР</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-2 cyber-button px-1.5 sm:px-2 md:px-4 py-2 flex-shrink-0"
              title="Выход"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ВЫХОД</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="cyber-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">ВСЕГО СОЗДАНО</h3>
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">
              {recentBatches.reduce((sum, batch) => sum + batch.totalCount, 0)}
            </p>
          </div>
          
          <div className="cyber-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">ИСПОЛЬЗОВАНО</h3>
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">
              {recentBatches.reduce((sum, batch) => sum + batch.redeemedCount, 0)}
            </p>
          </div>
          
          <div className="cyber-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">АКТИВНО</h3>
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">
              {recentBatches.reduce((sum, batch) => 
                sum + (batch.totalCount - batch.redeemedCount), 0
              )}
            </p>
          </div>
        </div>

        {/* Generate Section */}
        <div className="cyber-border p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 font-cyber">СОЗДАТЬ НОВУЮ ПАРТИЮ</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">НАЗВАНИЕ ПАРТИИ</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Например: VIP ГОСТИ"
                className="w-full cyber-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">КОЛИЧЕСТВО</label>
              <input
                type="number"
                min="1"
                max="5000"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full cyber-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ДАТА СОБЫТИЯ</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full cyber-input"
            />
          </div>

          <button
            onClick={handleGenerateBatch}
            disabled={generating}
            className="mt-6 cyber-button flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {generating ? 'ГЕНЕРАЦИЯ...' : 'СОЗДАТЬ И СКАЧАТЬ'}
          </button>
        </div>

        {/* Recent Batches */}
        <div className="cyber-border p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-cyber">ПОСЛЕДНИЕ ПАРТИИ</h2>
            <button
              onClick={loadRecentBatches}
              className="px-4 py-2 bg-cyber-green/20 text-cyber-green rounded hover:bg-cyber-green/30 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Обновить
            </button>
          </div>
          
          <div className="space-y-4">
            {recentBatches.map((batch) => (
              <div key={batch.id} className="p-4 border border-cyber-green/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{batch.name}</h3>
                    <p className="text-sm text-cyber-green/70">
                      {batch.totalCount} кодов • {batch.redeemedCount} использовано • {Math.round((batch.redeemedCount / batch.totalCount) * 100)}% активировано
                    </p>
                    <p className="text-xs text-cyber-green/50 mt-1">
                      {batch.createdAt ? formatDateTime(batch.createdAt) : 'Дата неизвестна'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => loadBatchInvitations(batch)}
                      className="p-2 border border-cyber-green/50 hover:border-cyber-green transition-colors"
                      title="Просмотр"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadBatch(batch)}
                      disabled={downloadingBatch === batch.id}
                      className="p-2 border border-cyber-green/50 hover:border-cyber-green transition-colors disabled:opacity-50"
                      title="Скачать"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBatch(batch)}
                      disabled={deletingBatch === batch.id}
                      className="p-2 border border-red-500/50 hover:border-red-500 transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch Details Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBatch(null)}>
            <div className="bg-cyber-black cyber-border p-6 max-w-4xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-cyber">{selectedBatch.name}</h2>
                  <p className="text-cyber-green/70">
                    {selectedBatch.totalCount} кодов • {selectedBatch.redeemedCount} использовано
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-cyber-green hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 text-sm font-semibold border-b border-cyber-green/20 pb-2">
                  <div className="col-span-2">КОД</div>
                  <div>СТАТУС</div>
                  <div className="col-span-2">ИСПОЛЬЗОВАН</div>
                  <div>КЕМ</div>
                </div>
                {batchInvitations.map(inv => (
                  <div key={inv.id} className="grid grid-cols-6 gap-2 text-sm py-2 border-b border-cyber-green/10">
                    <div className="col-span-2 font-mono">{inv.code}</div>
                    <div className={inv.status === 'redeemed' ? 'text-red-500' : 'text-cyber-green'}>
                      {inv.status === 'redeemed' ? 'ИСПОЛЬЗОВАН' : 'АКТИВЕН'}
                    </div>
                    <div className="col-span-2">
                      {inv.redeemedAt ? formatDateTime(inv.redeemedAt) : '-'}
                    </div>
                    <div>{inv.redeemedBy?.username || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}