'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { LoginRequest } from '@hotel/types';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useMutation } from '@tanstack/react-query';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      router.push('/dashboard');
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Hotel Inventory</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Multi-tenant Distribution Platform
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
          className="space-y-6 rounded-lg bg-white p-8 shadow dark:bg-neutral-800"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Tenant ID
            </label>
            <input
              {...register('tenantId', { required: 'Tenant ID is required' })}
              type="text"
              className="mt-2 block w-full rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-600 dark:bg-neutral-700"
              placeholder="luxury-hotels-co"
            />
            {errors.tenantId && (
              <p className="mt-1 text-sm text-red-600">{errors.tenantId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="mt-2 block w-full rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-600 dark:bg-neutral-700"
              placeholder="admin@luxuryhotels.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="mt-2 block w-full rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-600 dark:bg-neutral-700"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-md bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>

          {loginMutation.isError && (
            <p className="text-center text-sm text-red-600">
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : 'Login failed'}
            </p>
          )}

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Demo credentials:
            <br />
            Tenant: luxury-hotels-co
            <br />
            Email: admin@luxuryhotels.com
            <br />
            Password: password123
          </p>
        </form>
      </div>
    </div>
  );
}
