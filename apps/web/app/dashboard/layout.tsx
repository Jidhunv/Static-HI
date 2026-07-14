'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import Link from 'next/link';
import { LayoutDashboard, Building2, ShoppingCart, LogOut, Users, Lock, DollarSign, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/properties', label: 'Hotels', icon: Building2 },
  { href: '/dashboard/b2b', label: 'B2B', icon: ShoppingCart },
  { section: 'Management', items: [
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/roles', label: 'Roles', icon: Lock },
    { href: '/dashboard/pricing-rules', label: 'Pricing Rules', icon: DollarSign },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="p-4">
          <h1 className="text-xl font-bold">🏨 HotelHub</h1>
        </div>

        <nav className="space-y-4 px-2 py-4">
          {NAV.map((item) => (
            'section' in item ? (
              <div key={item.section}>
                <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.section}</p>
                <div className="space-y-1">
                  {item.items.map((subitem) => (
                    <Link
                      key={subitem.href}
                      href={subitem.href}
                      className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <subitem.icon className="h-4 w-4" />
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.firstName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button onClick={logout} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-8 py-4 dark:border-slate-700 dark:bg-slate-800">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
