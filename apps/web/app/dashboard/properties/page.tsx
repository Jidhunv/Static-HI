'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Plus, Search } from 'lucide-react';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await apiClient.get('/properties');
      return res.data;
    },
  });

  const filtered = properties.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hotels</h1>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Hotel
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-slate-300 bg-slate-50 pl-10 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            No properties found
          </div>
        ) : (
          filtered.map((p: any) => (
            <Link
              key={p.id}
              href={`/dashboard/properties/${p.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.code}</p>
              <div className="mt-2 flex justify-between text-sm text-slate-600">
                <span>📍 {p.city}</span>
                <span>🏨 {p.rooms?.length || 0} rooms</span>
              </div>
              <span className="mt-3 inline-block rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {p.visibility.replace(/_/g, ' ')}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
