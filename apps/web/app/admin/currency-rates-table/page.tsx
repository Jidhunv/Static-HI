'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, RefreshCw, LayoutDashboard, Building2, Settings, Users, BarChart3, FileText, Database, LogOut } from 'lucide-react';

interface FXRate {
  id: string;
  baseCurrency: { code: string; symbol: string };
  quoteCurrency: { code: string; symbol: string };
  rate: number;
  source: 'manual' | 'api';
  updatedAt: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export default function CurrencyRatesTablePage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<FXRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<FXRate | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login/admin');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [currRes, ratesRes] = await Promise.all([
        fetch('/api/currency'),
        fetch('/api/currency/latest/all'),
      ]);

      if (currRes.ok) {
        const currData = await currRes.json();
        setCurrencies(currData);
      }

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setRates(ratesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!confirm('Delete this rate?')) return;

    try {
      const response = await fetch(`/api/currency/${rateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRates(rates.filter((r) => r.id !== rateId));
      }
    } catch (error) {
      console.error('Error deleting rate:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading exchange rates...</div>;
  }

  // Create matrix of all rates
  const currencyCodes = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD', 'PKR', 'ARS', 'CHF', 'SGD'];

  const getRateValue = (baseCurrency: string, quoteCurrency: string) => {
    const rate = rates.find(
      (r) => r.baseCurrency.code === baseCurrency && r.quoteCurrency.code === quoteCurrency
    );
    return rate ? rate.rate.toFixed(6) : '-';
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'tenants', label: 'Tenant Management', icon: Building2, href: '/admin/dashboard' },
    { id: 'masters', label: 'Masters', icon: Database, href: '/admin/dashboard' },
    { id: 'currency-mgmt', label: 'Currency Management', icon: BarChart3, href: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Users, href: '/admin/dashboard' },
    { id: 'payments', label: 'Payment Setup', icon: FileText, href: '/admin/dashboard' },
    { id: 'payment-config', label: 'Payment Configuration', icon: Settings, href: '/admin/payment-configuration' },
    { id: 'ledgers', label: 'Tenant Ledger', icon: BarChart3, href: '/admin/dashboard' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Link href="/" className="text-2xl font-bold block">🏨 HotelHub</Link>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Platform Admin</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href || '#'}
              className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              router.replace('/login/admin');
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-8 py-4">
          <h1 className="text-2xl font-bold">Exchange Rates Matrix</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-gray-600">View and manage all currency exchange rates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Rate
          </button>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="bg-white rounded-lg shadow border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-sm sticky left-0 bg-gray-50 z-10">
                BASE
              </th>
              {currencyCodes.map((code) => (
                <th
                  key={code}
                  className="px-4 py-3 text-center font-semibold text-sm text-gray-700 min-w-[120px]"
                >
                  {code}
                </th>
              ))}
              <th className="px-6 py-3 text-center font-semibold text-sm min-w-[100px]">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currencyCodes.map((baseCurrency) => (
              <tr key={baseCurrency} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold bg-gray-50 sticky left-0 z-10">
                  {baseCurrency}
                </td>
                {currencyCodes.map((quoteCurrency) => {
                  const rate = rates.find(
                    (r) =>
                      r.baseCurrency.code === baseCurrency &&
                      r.quoteCurrency.code === quoteCurrency
                  );

                  return (
                    <td
                      key={`${baseCurrency}-${quoteCurrency}`}
                      className={`px-4 py-4 text-center text-sm ${
                        baseCurrency === quoteCurrency
                          ? 'bg-blue-50 font-bold text-blue-900'
                          : rate
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {baseCurrency === quoteCurrency ? (
                        '1'
                      ) : rate ? (
                        <div className="flex flex-col items-center">
                          <span>{rate.rate.toFixed(6)}</span>
                          <span className="text-xs text-gray-500">
                            {rate.source === 'api' ? '📡' : '✏️'}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      const rate = rates.find((r) => r.baseCurrency.code === baseCurrency);
                      if (rate) setEditingRate(rate);
                    }}
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">Total Rates</p>
          <p className="text-3xl font-bold">{rates.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">API Synced</p>
          <p className="text-3xl font-bold text-blue-600">
            {rates.filter((r) => r.source === 'api').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">Manual Updates</p>
          <p className="text-3xl font-bold text-green-600">
            {rates.filter((r) => r.source === 'manual').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">Currencies</p>
          <p className="text-3xl font-bold">{currencies.length}</p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Exchange Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Base Currency</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  {currencies.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quote Currency</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  {currencies.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rate</label>
                <input type="number" step="0.0001" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 1.25" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Rate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
        </div>
      </div>
    </div>
  );
}
