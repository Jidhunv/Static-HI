'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">🏨 HotelHub</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Multi-tenant B2B2C Distribution Platform
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login/tenant"
            className="block w-full rounded-lg bg-white p-6 text-center shadow-lg hover:shadow-xl transition dark:bg-slate-800"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              🏨 Tenant Login
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Hotel chains, DMCs, travel agencies
            </p>
            <div className="mt-4 inline-block rounded bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Access your dashboard
            </div>
          </Link>

          <Link
            href="/login/admin"
            className="block w-full rounded-lg bg-white p-6 text-center shadow-lg hover:shadow-xl transition dark:bg-slate-800"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              👨‍💼 Platform Admin
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage platform, approve tenants, view analytics
            </p>
            <div className="mt-4 inline-block rounded bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Admin console
            </div>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Demo Credentials</h3>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <p><strong>Tenant Login:</strong></p>
            <p>Email: admin@luxuryhotels.com</p>
            <p>Tenant: luxury-hotels-co</p>
            <p>Password: password123</p>
            <hr className="my-2 border-slate-300 dark:border-slate-600" />
            <p><strong>Admin Login:</strong></p>
            <p>Email: admin@platform.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
