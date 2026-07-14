'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FrontOfficeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('frontoffice@luxuryhotels.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/frontoffice-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('frontoffice_token', data.access_token);
        localStorage.setItem('frontoffice_user', JSON.stringify(data.user));
        router.push('/frontoffice/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">🏨</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HotelHub</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Front Office Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="frontoffice@hotel.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-800 dark:text-blue-400">
              Email: <span className="font-mono">frontoffice@luxuryhotels.com</span>
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-400">
              Password: <span className="font-mono">password123</span>
            </p>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              Not front office?{' '}
              <Link href="/login/tenant" className="font-medium text-blue-600 hover:text-blue-700">
                Tenant Login
              </Link>
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Admin access?{' '}
              <Link href="/login/admin" className="font-medium text-blue-600 hover:text-blue-700">
                Admin Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
          <p>Front Office Portal for Property Management</p>
          <p className="mt-1">Test B2B & B2C booking reads and operations</p>
        </div>
      </div>
    </div>
  );
}
