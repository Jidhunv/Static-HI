'use client';

import { DollarSign, Building2, Briefcase, TrendingUp } from 'lucide-react';

const KPI = [
  { label: 'Revenue', value: '$125K', trend: '+12.5%', icon: DollarSign },
  { label: 'Properties', value: '24', trend: '+2', icon: Building2 },
  { label: 'Bookings', value: '1.2K', trend: '+23%', icon: Briefcase },
  { label: 'Occupancy', value: '78%', trend: '+5%', icon: TrendingUp },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{k.label}</p>
                <p className="mt-2 text-2xl font-bold">{k.value}</p>
              </div>
              <k.icon className="h-8 w-8 opacity-30" />
            </div>
            <p className="mt-4 text-sm text-green-600">{k.trend} this month</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 font-semibold">Revenue Trend</h3>
          <div className="h-48 bg-slate-100 dark:bg-slate-700"></div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 font-semibold">Top Properties</h3>
          <div className="space-y-2">
            {['Plaza Hotel', 'Luxury Suites', 'Downtown Inn'].map((p) => (
              <div key={p} className="flex justify-between border-b pb-2 text-sm">
                <span>{p}</span>
                <span className="font-medium">$12.4K</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
