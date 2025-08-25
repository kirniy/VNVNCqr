import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { LogOut, Activity, RefreshCw } from 'lucide-react';
import { signOut } from 'firebase/auth';

interface ScanLog {
  id: string;
  code: string;
  success: boolean;
  error?: string;
  timestamp: any;
  username?: string;
  userAgent?: string;
  platform?: string;
}

export default function LogsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'success'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');
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
        loadLogs();
      } else {
        // Only redirect to login if not in Telegram context
        if (!isTelegramApp) {
          router.push('/admin/login');
        } else {
          // In Telegram context, try to load logs anyway
          loadLogs();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const loadLogs = async () => {
    try {
      let q = query(
        collection(db, 'scanLogs'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScanLog[];

      // Apply time filter
      const timeFilter = getTimeFilter();
      const filteredLogs = timeFilter 
        ? logs.filter(log => {
            const logTime = log.timestamp?.toDate?.() || new Date(log.timestamp);
            return logTime >= timeFilter;
          })
        : logs;

      setScanLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [timeRange, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredLogs = scanLogs.filter(log => {
    if (filter === 'errors') return !log.success;
    if (filter === 'success') return log.success;
    return true;
  });

  const errorCount = scanLogs.filter(log => !log.success).length;
  const successCount = scanLogs.filter(log => log.success).length;
  const errorRate = scanLogs.length > 0 ? (errorCount / scanLogs.length * 100).toFixed(1) : 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black cyber-grid-bg">
      {/* Header */}
      <header className="border-b border-cyber-green/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold glitch font-cyber flex-shrink-0" data-text="ЛОГИ">
            <span className="hidden sm:inline">СИСТЕМНЫЕ ЛОГИ</span>
            <span className="sm:hidden">ЛОГИ</span>
          </h1>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-1 md:gap-2 cyber-button px-1.5 sm:px-2 md:px-4 py-2 flex-shrink-0"
              title="Панель управления"
            >
              <span className="hidden md:inline">ПАНЕЛЬ</span>
              <span className="md:hidden">←</span>
            </button>
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
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="cyber-card bg-cyber-dark p-6">
            <div className="text-cyber-gray text-sm mb-2">ВСЕГО СКАНИРОВАНИЙ</div>
            <div className="text-3xl font-bold text-cyber-green font-cyber">{scanLogs.length}</div>
          </div>
          <div className="cyber-card bg-cyber-dark p-6">
            <div className="text-cyber-gray text-sm mb-2">УСПЕШНЫХ</div>
            <div className="text-3xl font-bold text-green-400 font-cyber">{successCount}</div>
          </div>
          <div className="cyber-card bg-cyber-dark p-6">
            <div className="text-cyber-gray text-sm mb-2">ОШИБОК</div>
            <div className="text-3xl font-bold text-red-400 font-cyber">{errorCount}</div>
          </div>
          <div className="cyber-card bg-cyber-dark p-6">
            <div className="text-cyber-gray text-sm mb-2">ПРОЦЕНТ ОШИБОК</div>
            <div className="text-3xl font-bold text-yellow-400 font-cyber">{errorRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-white text-black' : 'bg-gray-800'}`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-4 py-2 rounded ${filter === 'errors' ? 'bg-red-600' : 'bg-gray-800'}`}
            >
              Ошибки
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-4 py-2 rounded ${filter === 'success' ? 'bg-green-600' : 'bg-gray-800'}`}
            >
              Успешные
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('1h')}
              className={`cyber-button px-4 py-2 ${timeRange === '1h' ? 'bg-cyber-green text-black' : ''}`}
            >
              1 ЧАС
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`cyber-button px-4 py-2 ${timeRange === '24h' ? 'bg-cyber-green text-black' : ''}`}
            >
              24 ЧАСА
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`cyber-button px-4 py-2 ${timeRange === '7d' ? 'bg-cyber-green text-black' : ''}`}
            >
              7 ДНЕЙ
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`cyber-button px-4 py-2 ${timeRange === '30d' ? 'bg-cyber-green text-black' : ''}`}
            >
              30 ДНЕЙ
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`cyber-button px-4 py-2 ${timeRange === 'all' ? 'bg-cyber-green text-black' : ''}`}
            >
              ВСЕ
            </button>
          </div>

          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Обновить
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Время</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Код</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ошибка</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Пользователь</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Платформа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredLogs.map((log) => {
                  const timestamp = log.timestamp?.toDate?.() || new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-mono">
                        {timestamp.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="px-2 py-1 text-xs bg-green-900 text-green-300 rounded">
                            Успех
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-900 text-red-300 rounded">
                            Ошибка
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.code?.substring(0, 20)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-red-400">
                        {log.error || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.username || 'Guest'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {log.platform || 'Unknown'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Нет логов для отображения
            </div>
          )}
        </div>

        {/* Common Errors Summary */}
        {errorCount > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Частые ошибки</h2>
            <div className="bg-gray-900 rounded-lg p-4">
              {Object.entries(
                scanLogs
                  .filter(log => !log.success && log.error)
                  .reduce((acc: Record<string, number>, log) => {
                    const error = log.error || 'Unknown error';
                    acc[error] = (acc[error] || 0) + 1;
                    return acc;
                  }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([error, count]) => (
                  <div key={error} className="flex justify-between items-center py-2">
                    <span className="text-red-400">{error}</span>
                    <span className="text-gray-400">{count} раз</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}