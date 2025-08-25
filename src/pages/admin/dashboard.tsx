import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import AdminHeader from '@/components/AdminHeader';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Head from 'next/head';

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvitations: 0,
    linkInvitations: 0,
    qrInvitations: 0,
    sentInvitations: 0,
    viewedInvitations: 0,
    redeemedInvitations: 0,
    expiredInvitations: 0,
    todayCreated: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        loadStats();
      } else {
        router.push('/admin/login?redirect=/admin/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = async () => {
    try {
      const invitationsRef = collection(db, 'invitations');
      const snapshot = await getDocs(invitationsRef);
      
      let linkCount = 0;
      let qrCount = 0;
      let sentCount = 0;
      let viewedCount = 0;
      let redeemedCount = 0;
      let expiredCount = 0;
      let todayCount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count by type
        if (data.invitationType === 'qr') {
          qrCount++;
        } else {
          linkCount++;
        }
        
        // Count by status
        if (data.status === 'sent') sentCount++;
        if (data.status === 'viewed') viewedCount++;
        if (data.status === 'redeemed') redeemedCount++;
        
        // Check if expired
        if (data.expiresAt) {
          const expiresAt = data.expiresAt.toDate();
          if (expiresAt < new Date()) {
            expiredCount++;
          }
        }
        
        // Check if created today
        if (data.createdAt) {
          const createdAt = data.createdAt.toDate();
          if (createdAt >= today) {
            todayCount++;
          }
        }
      });

      setStats({
        totalInvitations: snapshot.size,
        linkInvitations: linkCount,
        qrInvitations: qrCount,
        sentInvitations: sentCount,
        viewedInvitations: viewedCount,
        redeemedInvitations: redeemedCount,
        expiredInvitations: expiredCount,
        todayCreated: todayCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
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
        <title>VNVNC - Панель управления</title>
      </Head>
      
      <div className="min-h-screen bg-vnvnc-black">
        <AdminHeader />
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Панель управления</h1>

          {/* Event Info */}
          <div className="vnvnc-card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">VNVNC Birthday Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Даты события</p>
                <p className="text-white text-2xl font-bold">29-30 августа 2025</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Время</p>
                <p className="text-white text-2xl font-bold">23:00 - 8:00</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Место</p>
                <p className="text-white text-2xl font-bold">Конюшенная 2В</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="vnvnc-card">
              <p className="text-gray-400 text-sm mb-2">Всего приглашений</p>
              <p className="text-white text-3xl font-bold">{stats.totalInvitations}</p>
              <div className="mt-2 text-sm">
                <span className="text-indigo-400">{stats.linkInvitations} ссылок</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-purple-400">{stats.qrInvitations} QR</span>
              </div>
            </div>

            <div className="vnvnc-card">
              <p className="text-gray-400 text-sm mb-2">Отправлено</p>
              <p className="text-blue-400 text-3xl font-bold">{stats.sentInvitations}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.totalInvitations > 0 
                  ? `${Math.round((stats.sentInvitations / stats.totalInvitations) * 100)}% от всех`
                  : '0%'}
              </p>
            </div>

            <div className="vnvnc-card">
              <p className="text-gray-400 text-sm mb-2">Просмотрено</p>
              <p className="text-yellow-400 text-3xl font-bold">{stats.viewedInvitations}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.sentInvitations > 0 
                  ? `${Math.round((stats.viewedInvitations / stats.sentInvitations) * 100)}% от отправленных`
                  : '0%'}
              </p>
            </div>

            <div className="vnvnc-card">
              <p className="text-gray-400 text-sm mb-2">Использовано</p>
              <p className="text-green-400 text-3xl font-bold">{stats.redeemedInvitations}</p>
              <p className="text-gray-400 text-sm mt-2">
                {stats.totalInvitations > 0 
                  ? `${Math.round((stats.redeemedInvitations / stats.totalInvitations) * 100)}% от всех`
                  : '0%'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="vnvnc-card">
            <h2 className="text-xl font-bold text-white mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin/invitations')}
                className="p-4 bg-vnvnc-darkgray hover:bg-vnvnc-gray border border-vnvnc-red/30 rounded text-white transition-all"
              >
                <div className="text-2xl mb-2">📨</div>
                <div className="font-bold">Создать приглашения</div>
                <div className="text-sm text-gray-400 mt-1">HTML ссылки или QR коды</div>
              </button>

              <button
                onClick={() => router.push('/admin/invitations')}
                className="p-4 bg-vnvnc-darkgray hover:bg-vnvnc-gray border border-vnvnc-red/30 rounded text-white transition-all"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-bold">Управление приглашениями</div>
                <div className="text-sm text-gray-400 mt-1">Просмотр и управление</div>
              </button>

              <button
                onClick={() => router.push('/admin/logs')}
                className="p-4 bg-vnvnc-darkgray hover:bg-vnvnc-gray border border-vnvnc-red/30 rounded text-white transition-all"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-bold">Просмотр логов</div>
                <div className="text-sm text-gray-400 mt-1">История сканирований</div>
              </button>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="vnvnc-card mt-8">
            <h2 className="text-xl font-bold text-white mb-4">Активность сегодня</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Создано сегодня</p>
                <p className="text-white text-2xl font-bold">{stats.todayCreated}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Истекших приглашений</p>
                <p className="text-red-400 text-2xl font-bold">{stats.expiredInvitations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}