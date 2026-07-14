'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

export default function TenantLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ tenantId: '', email: '', password: '' });
  const [error, setError] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: typeof form) => {
      try {
        const res = await apiClient.post('/auth/login', data);
        return res.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Login failed');
      }
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      router.push('/dashboard');
    },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.tenantId && form.email && form.password) {
      login(form);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block hover:opacity-70">
            <h1 className="text-3xl font-bold">🏨 HotelHub</h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Tenant Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tenant ID
            </label>
            <input
              type="text"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              placeholder="luxury-hotels-co"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-700"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            No tenant yet?{' '}
            <Link href="/onboard" className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
