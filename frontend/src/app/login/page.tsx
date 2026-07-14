'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, initialize, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login({ email, password });
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        
        {/* Logo and header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold tracking-wider">
              MS
            </div>
            MS-Forge
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to your workspace</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter your credentials to access collaborative tasks
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm items-start">
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication failed</span>
              {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Corporate Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@msforge.com"
              className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          New to MS-Forge?{' '}
          <Link href="/signup" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            Create an organization
          </Link>
        </p>

        {/* Demo Credentials Helper Box */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">🎓 Evaluation Credentials:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Admin User:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">admin@msforge.com</code></li>
            <li><strong>Member User:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">member@msforge.com</code></li>
            <li><strong>Password:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">Mridul123!</code></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
