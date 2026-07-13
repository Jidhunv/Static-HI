'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [formData, setFormData] = useState({ tenantId: '', email: '', password: '' });
  const [error, setError] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      router.push('/dashboard');
    },
    onError: () => setError('Invalid credentials'),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">🏨 HotelHub</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Multi-tenant Distribution Platform
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (formData.tenantId && formData.email && formData.password) {
              login(formData);
            }
          }}
          className="space-y-4 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800 dark:shadow-slate-950"
        >
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
              placeholder="luxury-hotels-co"
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-700"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Demo: luxury-hotels-co / admin@luxuryhotels.com / password123
        </p>
      </div>
    </div>
  );
}
