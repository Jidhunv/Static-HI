'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await apiClient.get('/properties');
      return response.data;
    },
  });

  const filtered = properties.filter((p: any) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="properties-page">
      <div className="page-header">
        <div>
          <h1>Hotels</h1>
          <p>Manage your property inventory</p>
        </div>
        <Link href="/dashboard/properties/new" className="btn btn-primary">
          <Plus className="btn-icon" />
          Add Hotel
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by hotel name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="properties-grid">
        {isLoading ? (
          <div className="loading">Loading properties...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No properties found</p>
            <Link href="/dashboard/properties/new" className="btn btn-primary">
              Create your first hotel
            </Link>
          </div>
        ) : (
          filtered.map((property: any) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="property-card"
            >
              <div className="property-card-header">
                <h3>{property.name}</h3>
                <span className={`status-badge ${property.status}`}>
                  {property.status}
                </span>
              </div>
              <p className="property-code">{property.code}</p>
              <div className="property-meta">
                <span>📍 {property.city}</span>
                <span>🏨 {property.rooms?.length || 0} rooms</span>
              </div>
              <div className="property-visibility">
                <span className={`visibility-badge ${property.visibility}`}>
                  {property.visibility.replace(/_/g, ' ')}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
