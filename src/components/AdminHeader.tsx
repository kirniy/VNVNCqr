import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title = 'VNVNC Admin' }: AdminHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-vnvnc-darkgray border-b border-vnvnc-red/30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Image
            src="/images/vnvnc-logo.png"
            alt="VNVNC"
            width={80}
            height={48}
            className="filter brightness-0 invert"
          />
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className={`px-4 py-2 rounded transition-all ${
                router.pathname === '/admin/dashboard' 
                  ? 'bg-vnvnc-red text-white' 
                  : 'text-gray-300 hover:bg-vnvnc-gray hover:text-white'
              }`}
            >
              Панель
            </button>
            <button
              onClick={() => router.push('/admin/invitations')}
              className={`px-4 py-2 rounded transition-all ${
                router.pathname === '/admin/invitations' 
                  ? 'bg-vnvnc-red text-white' 
                  : 'text-gray-300 hover:bg-vnvnc-gray hover:text-white'
              }`}
            >
              Приглашения
            </button>
            <button
              onClick={() => router.push('/admin/logs')}
              className={`px-4 py-2 rounded transition-all ${
                router.pathname === '/admin/logs' 
                  ? 'bg-vnvnc-red text-white' 
                  : 'text-gray-300 hover:bg-vnvnc-gray hover:text-white'
              }`}
            >
              Логи
            </button>
          </nav>
          
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-vnvnc-darkred hover:bg-vnvnc-red text-white rounded transition-all"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}