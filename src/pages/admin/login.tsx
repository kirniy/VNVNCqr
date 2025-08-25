import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is already logged in, check for admin role
        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.role === 'admin') {
          // Redirect to email-campaign if that's where they were trying to go
          const redirect = router.query.redirect as string || '/admin/dashboard';
          router.push(redirect);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      
      if (idTokenResult.claims.role === 'admin') {
        const redirect = router.query.redirect as string || '/admin/dashboard';
        router.push(redirect);
      } else {
        router.push('/admin/activate-admin');
      }
    } catch (err: any) {
      setError('Неверные данные. Доступ запрещён.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black cyber-grid-bg">
      <div className="w-full max-w-md">
        <div className="cyber-border p-8 bg-cyber-gray/50 backdrop-blur">
          <div className="flex justify-center mb-8">
            <div className="p-4 cyber-border rounded-full">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-8 glitch font-cyber" data-text="ВХОД В СИСТЕМУ">
            ВХОД В СИСТЕМУ
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ЭЛЕКТРОННАЯ ПОЧТА</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full cyber-input"
                placeholder="admin@angar.club"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ПАРОЛЬ</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full cyber-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button"
            >
              {loading ? 'ПРОВЕРКА...' : 'ВОЙТИ В СИСТЕМУ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}