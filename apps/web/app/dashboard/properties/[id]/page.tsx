'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Plus } from 'lucide-react';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'rates', label: 'Rates' },
  { id: 'policies', label: 'Policies' },
  { id: 'finance', label: 'Finance' },
];

export default function PropertyPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState('info');
  const { data: property } = useQuery({
    queryKey: ['property', params.id],
    queryFn: async () => {
      const res = await apiClient.get(`/properties/${params.id}`);
      return res.data;
    },
  });

  if (!property) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{property.name}</h1>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                tab === t.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        {tab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                defaultValue={property.name}
                className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                defaultValue={property.city}
                className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Visibility</label>
              <select className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700">
                <option>Private</option>
                <option>Public B2B</option>
                <option>Public B2C</option>
                <option>Public Both</option>
              </select>
            </div>
            <button className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
              Save
            </button>
          </div>
        )}

        {tab === 'rooms' && (
          <div className="space-y-4">
            <button className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Add Room
            </button>
            {property.rooms?.map((r: any) => (
              <div key={r.id} className="rounded border border-slate-200 p-4 dark:border-slate-700">
                <h4 className="font-medium">{r.type}</h4>
                <p className="text-sm text-slate-600">{r.quantity} available</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'rates' && <div className="text-slate-600">Rate plans management</div>}
        {tab === 'policies' && <div className="text-slate-600">Cancellation policies</div>}
        {tab === 'finance' && <div className="text-slate-600">Bank details & finance</div>}
      </div>
    </div>
  );
}
