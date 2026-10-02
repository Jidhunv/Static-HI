'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

interface FXRate {
  id: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  source: 'manual' | 'api';
  updatedAt: string;
}

interface RateHistory {
  createdAt: string;
  rate: number;
  source: 'manual' | 'api';
}

export default function CurrencyUpdatePage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fxRates, setFxRates] = useState<FXRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<FXRate | null>(null);
  const [history, setHistory] = useState<RateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [updateReason, setUpdateReason] = useState('manual_update');
  const [apiConnected, setApiConnected] = useState(false);
  const [apiProvider, setApiProvider] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (selectedRate) {
      fetchRateHistory();
    }
  }, [selectedRate]);

  const fetchCurrencies = async () => {
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
        setFxRates(ratesData);
        if (ratesData.length > 0) {
          setSelectedRate(ratesData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateHistory = async () => {
    if (!selectedRate) return;

    try {
      const response = await fetch(
        `/api/currency/rate/history/${selectedRate.baseCurrency.id}/${selectedRate.quoteCurrency.id}?limit=30`
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleUpdateRate = async () => {
    if (!selectedRate || !newRate) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/currency/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCurrencyId: selectedRate.baseCurrency.id,
          quoteCurrencyId: selectedRate.quoteCurrency.id,
          rate: parseFloat(newRate),
          source: 'manual',
          updateReason,
        }),
      });

      if (response.ok) {
        setNewRate('');
        setUpdateReason('manual_update');
        await fetchCurrencies();
        setSyncMessage('Rate updated successfully!');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      setSyncMessage('Error updating rate');
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncWithAPI = async () => {
    if (!apiProvider) return;

    setUpdating(true);
    setSyncMessage('Syncing with API...');
    try {
      // Sample rate data - in production, this would come from actual API
      const sampleRates = [
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'EUR', rate: 0.92 },
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'INR', rate: 83.15 },
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'GBP', rate: 0.78 },
      ];

      const response = await fetch('/api/currency/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rates: sampleRates,
          apiProvider,
        }),
      });

      if (response.ok) {
        await fetchCurrencies();
        setSyncMessage(`Synced ${sampleRates.length} rates from ${apiProvider}`);
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error syncing with API:', error);
      setSyncMessage('Error syncing with API');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading currencies...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Currency Exchange Rates</h1>
        <p className="text-gray-600">Manage and update currency exchange rates with historical tracking</p>
      </div>

      {/* API Connection Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          API Integration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select API Provider</label>
            <select
              value={apiProvider}
              onChange={(e) => setApiProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">-- No API Connected --</option>
              <option value="forex_api">Forex API</option>
              <option value="exchangerate">ExchangeRate API</option>
              <option value="fixer">Fixer API</option>
              <option value="openexchangerates">Open Exchange Rates</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSyncWithAPI}
              disabled={!apiProvider || updating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updating ? 'Syncing...' : 'Sync Rates from API'}
            </button>
          </div>
          <div className="flex items-end">
            <div className="text-sm">
              {apiProvider ? (
                <span className="text-green-600 font-medium">✓ Connected: {apiProvider}</span>
              ) : (
                <span className="text-gray-500">No API connected</span>
              )}
            </div>
          </div>
        </div>
        {syncMessage && (
          <div className={`mt-4 p-3 rounded text-sm ${syncMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {syncMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Currency Rates List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Exchange Rates</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fxRates.length === 0 ? (
                <p className="text-gray-500 text-sm">No rates available</p>
              ) : (
                fxRates.map((rate) => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedRate(rate)}
                    className={`w-full text-left p-3 rounded border transition ${
                      selectedRate?.id === rate.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {rate.baseCurrency.code} → {rate.quoteCurrency.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      1 {rate.baseCurrency.code} = {rate.rate.toFixed(6)} {rate.quoteCurrency.code}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {rate.source === 'api' ? '📡 API' : '✏️ Manual'} • {new Date(rate.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rate Details and Update Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRate ? (
            <>
              {/* Current Rate Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-blue-100 text-sm">Current Rate</p>
                    <h3 className="text-3xl font-bold mt-2">
                      {selectedRate.rate.toFixed(6)}
                    </h3>
                  </div>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {selectedRate.source === 'api' ? '📡 API Synced' : '✏️ Manual Update'}
                  </span>
                </div>
                <p className="text-blue-100">
                  1 {selectedRate.baseCurrency.code} = {selectedRate.rate.toFixed(6)} {selectedRate.quoteCurrency.code}
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  Last updated: {new Date(selectedRate.updatedAt).toLocaleString()}
                </p>
              </div>

              {/* Update Form */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Update Exchange Rate</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      New Rate (1 {selectedRate.baseCurrency.code} = ? {selectedRate.quoteCurrency.code})
                    </label>
                    <input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder={selectedRate.rate.toString()}
                      step="0.0001"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Update Reason</label>
                    <select
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="manual_update">Manual Update</option>
                      <option value="correction">Rate Correction</option>
                      <option value="daily_update">Daily Update</option>
                      <option value="api_sync">API Sync</option>
                    </select>
                  </div>

                  <button
                    onClick={handleUpdateRate}
                    disabled={!newRate || updating}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {updating ? 'Updating...' : 'Update Rate'}
                  </button>
                </div>
              </div>

              {/* Rate History */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Rate History</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-sm">No history available</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">
                              {parseFloat(entry.rate.toString()).toFixed(6)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {entry.source === 'api' ? '📡' : '✏️'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
              Select a currency pair to view details and update rates
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
