'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: typeof form) => {
      try {
        const res = await apiClient.post('/auth/admin-login', data);
        localStorage.setItem('admin_token', res.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(res.data.user));
        return res.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Login failed');
      }
    },
    onSuccess: () => {
      router.push('/admin/dashboard');
    },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.email && form.password) {
      login(form);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block hover:opacity-70">
            <h1 className="text-3xl font-bold">🏨 HotelHub</h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Platform Administration
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
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              placeholder="admin@platform.com"
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
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
