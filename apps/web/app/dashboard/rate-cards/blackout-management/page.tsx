'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface BlackoutRange {
  startDate: string;
  endDate: string;
  reason: string;
}

export default function BlackoutManagementPage() {
  const [ratePlanId, setRatePlanId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [blackouts, setBlackouts] = useState<BlackoutRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadBlackouts = async () => {
    if (!ratePlanId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/rate-cards/${ratePlanId}/blackouts`);
      const data = await res.json();
      setBlackouts(data.blackouts || []);
    } catch (err) {
      console.error('Failed to load blackouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlackouts();
  }, [ratePlanId]);

  const addBlackout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(
        `/api/rate-cards/${propertyId}/${ratePlanId}/blackout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            userId: 'user-id', // From auth context
            email: 'user@example.com',
          }),
        }
      );

      if (res.ok) {
        loadBlackouts();
        setFormData({ startDate: '', endDate: '', reason: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Failed to add blackout:', err);
    }
  };

  const removeBlackout = async (reason: string) => {
    if (!confirm(`Remove blackout: ${reason}?`)) return;

    try {
      const res = await fetch(
        `/api/rate-cards/${propertyId}/${ratePlanId}/blackout`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason,
            userId: 'user-id',
            email: 'user@example.com',
          }),
        }
      );

      if (res.ok) {
        loadBlackouts();
      }
    } catch (err) {
      console.error('Failed to remove blackout:', err);
    }
  };

  const getDaysBlocked = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blackout Management</h1>
          <p className="text-gray-600 mt-1">Manage blackout periods for rate plans</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Blackout
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
          <input
            type="text"
            placeholder="Enter property ID"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate Plan ID</label>
          <input
            type="text"
            placeholder="Enter rate plan ID"
            value={ratePlanId}
            onChange={(e) => setRatePlanId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-blue-200">
          <h2 className="text-lg font-bold mb-4">Add Blackout Period</h2>
          <form onSubmit={addBlackout} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                placeholder="e.g., Annual maintenance, Festival closure"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
              >
                Create Blackout
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

      {/* Blackouts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading blackouts...</div>
        ) : blackouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No blackout periods configured</div>
        ) : (
          <div className="divide-y">
            {blackouts.map((blackout, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-blue-600" />
                    <h3 className="font-bold text-lg">{blackout.reason}</h3>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">From:</span>{' '}
                      {new Date(blackout.startDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">To:</span>{' '}
                      {new Date(blackout.endDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Days Blocked:</span>{' '}
                      {getDaysBlocked(blackout.startDate, blackout.endDate)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeBlackout(blackout.reason)}
                  className="text-red-600 hover:text-red-800 ml-4"
                  title="Remove blackout"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-2">ℹ️ Blackout Periods</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Blackout dates take <strong>absolute precedence</strong> over all availability checks</li>
          <li>Rooms become completely unavailable for the specified date range</li>
          <li>All existing bookings in blackout period will show in the inventory ledger</li>
          <li>Changing a blackout blocks all inventory for those dates</li>
        </ul>
      </div>
    </div>
  );
}
