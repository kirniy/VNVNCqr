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
        // User is already logged in, redirect to dashboard
        const redirect = router.query.redirect as string || '/admin/dashboard';
        router.push(redirect);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First check if user exists, if not create account
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // For now, allow any authenticated user to access admin
      // In production, you'd want to check roles properly
      const redirect = router.query.redirect as string || '/admin/dashboard';
      router.push(redirect);
    } catch (err: any) {
      // If sign in fails, try to create account
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email, password);
          
          // After creating account, redirect to dashboard
          const redirect = router.query.redirect as string || '/admin/dashboard';
          router.push(redirect);
        } catch (createErr: any) {
          console.error('Error creating account:', createErr);
          setError('Ошибка создания аккаунта. Проверьте данные.');
        }
      } else {
        console.error('Login error:', err);
        setError('Неверные данные. Попробуйте снова.');
      }
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
                placeholder="admin@vnvnc.ru"
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