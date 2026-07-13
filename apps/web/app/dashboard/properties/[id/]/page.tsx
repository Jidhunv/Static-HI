'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PropertyForm } from '@/components/properties/property-form';
import { RoomsTab } from '@/components/properties/rooms-tab';
import { RatePlansTab } from '@/components/properties/rate-plans-tab';
import { PoliciesTab } from '@/components/properties/policies-tab';
import { FinanceTab } from '@/components/properties/finance-tab';

export default function PropertyDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState('info');

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await apiClient.get(`/properties/${id}`);
      return response.data;
    },
  });

  if (isLoading) return <div className="loading">Loading property...</div>;
  if (!property) return <div className="error">Property not found</div>;

  const tabs = [
    { id: 'info', label: 'Property Info', component: PropertyForm },
    { id: 'rooms', label: 'Rooms', component: RoomsTab },
    { id: 'rates', label: 'Rate Plans', component: RatePlansTab },
    { id: 'policies', label: 'Policies', component: PoliciesTab },
    { id: 'finance', label: 'Finance', component: FinanceTab },
  ];

  return (
    <div className="property-detail-page">
      <div className="page-header">
        <div>
          <h1>{property.name}</h1>
          <p className="property-code">{property.code}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tabs-content">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab-pane ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.component property={property} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
