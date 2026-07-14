'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Edit2, Trash2 } from 'lucide-react';

interface FXRateData {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: 'manual' | 'api';
  updatedAt: string;
  hoursSinceUpdate: number;
  isFresh: boolean;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export default function FXManagementPage() {
  const [rates, setRates] = useState<FXRateData[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    baseCurrency: 'USD',
    quoteCurrency: 'EUR',
    rate: '',
  });

  useEffect(() => {
    loadData();
  }, [baseCurrency]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ratesRes, currenciesRes] = await Promise.all([
        fetch(`/api/fx/rates/${baseCurrency}`),
        fetch('/api/fx/currencies'),
      ]);

      const ratesData = await ratesRes.json();
      const currenciesData = await currenciesRes.json();

      setRates(ratesData);
      setCurrencies(currenciesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      alert('Please enter a valid rate');
      return;
    }

    try {
      const res = await fetch(
        `/api/fx/rates/${formData.baseCurrency}/${formData.quoteCurrency}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rate: parseFloat(formData.rate),
          }),
        }
      );

      if (res.ok) {
        loadData();
        setShowForm(false);
        setFormData({
          baseCurrency: 'USD',
          quoteCurrency: 'EUR',
          rate: '',
        });
      }
    } catch (err) {
      console.error('Failed to update rate:', err);
    }
  };

  const getFreshnessColor = (fresh: boolean, hours: number) => {
    if (fresh) return 'bg-green-100 text-green-800';
    if (hours < 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">FX Rate Management</h1>
          <p className="text-gray-600 mt-1">Manage currency exchange rates</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={20} /> Refresh
        </button>
      </div>

      {/* Currency Selection */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Base Currency</label>
        <select
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          className="border rounded px-3 py-2 text-sm max-w-xs"
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} - {curr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Rate Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-blue-200">
          <h2 className="text-lg font-bold mb-4">Update Exchange Rate</h2>
          <form onSubmit={updateRate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Currency</label>
              <select
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Currency</label>
              <select
                value={formData.quoteCurrency}
                onChange={(e) => setFormData({ ...formData, quoteCurrency: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">1 {formData.baseCurrency} =</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  required
                />
                <span className="text-sm text-gray-600">{formData.quoteCurrency}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
              >
                Update Rate
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading rates...</div>
        ) : rates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No rates configured</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">From</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Freshness</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Last Updated</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rates.map((rate) => (
                <tr key={`${rate.baseCurrency}-${rate.quoteCurrency}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-sm">{rate.baseCurrency}</td>
                  <td className="px-6 py-4 font-medium text-sm">{rate.quoteCurrency}</td>
                  <td className="px-6 py-4 text-sm">
                    1 {rate.baseCurrency} = {rate.rate.toFixed(6)} {rate.quoteCurrency}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rate.source === 'manual'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {rate.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getFreshnessColor(
                        rate.isFresh,
                        rate.hoursSinceUpdate
                      )}`}
                    >
                      {rate.hoursSinceUpdate.toFixed(1)}h ago
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(rate.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setFormData({
                          baseCurrency: rate.baseCurrency,
                          quoteCurrency: rate.quoteCurrency,
                          rate: rate.rate.toFixed(6),
                        });
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-2">ℹ️ FX Rate Management</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Rates can be updated manually or via API integration</li>
          <li><strong>Fresh rates</strong> (updated within 1 hour) are used for real-time conversions</li>
          <li>Historical rates are <strong>snapshotted on booking</strong> to prevent price re-calculation</li>
          <li>API integration runs hourly and automatically updates rates</li>
        </ul>
      </div>
    </div>
  );
}
