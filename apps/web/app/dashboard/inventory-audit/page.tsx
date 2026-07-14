'use client';

import { useState, useEffect } from 'react';
import { Filter, Download, RefreshCw } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  roomType: string;
  ratePlan: string;
  delta: number;
  reason: 'manual_allocation' | 'booking' | 'cancellation_release' | 'amendment' | 'blackout_block';
  actorEmail: string;
  bookingId?: string;
  createdAt: string;
}

const REASON_COLORS: Record<string, string> = {
  manual_allocation: 'bg-blue-100 text-blue-800',
  booking: 'bg-green-100 text-green-800',
  cancellation_release: 'bg-orange-100 text-orange-800',
  amendment: 'bg-purple-100 text-purple-800',
  blackout_block: 'bg-red-100 text-red-800',
};

export default function InventoryAuditPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<{
    manual_allocation: number;
    booking: number;
    cancellation_release: number;
    amendment: number;
    blackout_block: number;
  }>({
    manual_allocation: 0,
    booking: 0,
    cancellation_release: 0,
    amendment: 0,
    blackout_block: 0,
  });

  useEffect(() => {
    loadLedger();
  }, [propertyId]);

  const loadLedger = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/inventory/${propertyId}/ledger?${params}`);
      const data = await res.json();
      setEntries(data);

      // Calculate summary
      const summary_data = {
        manual_allocation: 0,
        booking: 0,
        cancellation_release: 0,
        amendment: 0,
        blackout_block: 0,
      };

      data.forEach((entry: LedgerEntry) => {
        summary_data[entry.reason]++;
      });

      setSummary(summary_data);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600 font-medium';
    if (delta < 0) return 'text-red-600 font-medium';
    return 'text-gray-600';
  };

  const downloadCSV = () => {
    const csv = [
      ['Date', 'Room Type', 'Rate Plan', 'Delta', 'Reason', 'Actor', 'Booking ID'],
      ...entries.map((entry) => [
        new Date(entry.createdAt).toLocaleString(),
        entry.roomType,
        entry.ratePlan,
        entry.delta,
        entry.reason,
        entry.actorEmail,
        entry.bookingId || '-',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Audit</h1>
          <p className="text-gray-600 mt-1">Complete ledger of all inventory changes</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={20} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Manual Allocations', value: summary.manual_allocation, color: 'bg-blue-50' },
          { label: 'Bookings', value: summary.booking, color: 'bg-green-50' },
          { label: 'Cancellations', value: summary.cancellation_release, color: 'bg-orange-50' },
          { label: 'Amendments', value: summary.amendment, color: 'bg-purple-50' },
          { label: 'Blackouts', value: summary.blackout_block, color: 'bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} p-4 rounded-lg border`}>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <input
            type="text"
            placeholder="Enter property ID"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={loadLedger}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <RefreshCw size={16} /> Apply Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ledger...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No entries found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Room Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rate Plan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Delta</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Booking ID</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm">{entry.roomType}</td>
                  <td className="px-6 py-3 text-sm">{entry.ratePlan}</td>
                  <td className={`px-6 py-3 text-sm ${getDeltaColor(entry.delta)}`}>
                    {entry.delta > 0 ? '+' : ''}{entry.delta}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${REASON_COLORS[entry.reason]}`}>
                      {entry.reason}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{entry.actorEmail}</td>
                  <td className="px-6 py-3 text-sm">
                    {entry.bookingId ? (
                      <a href={`/booking/${entry.bookingId}`} className="text-blue-600 hover:underline">
                        {entry.bookingId}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
