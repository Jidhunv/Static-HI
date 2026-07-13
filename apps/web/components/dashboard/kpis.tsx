'use client';

import { TrendingUp, Users, Building2, DollarSign } from 'lucide-react';

export function DashboardKpis() {
  const kpis = [
    {
      label: 'Total Revenue',
      value: '$125,450',
      trend: '+12.5%',
      icon: DollarSign,
      color: 'primary',
    },
    {
      label: 'Active Properties',
      value: '24',
      trend: '+2',
      icon: Building2,
      color: 'blue',
    },
    {
      label: 'Total Bookings',
      value: '1,245',
      trend: '+23%',
      icon: Users,
      color: 'green',
    },
    {
      label: 'Occupancy Rate',
      value: '78%',
      trend: '+5%',
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  return (
    <div className="kpis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-color)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {kpi.label}
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {kpi.value}
              </p>
            </div>
            <kpi.icon style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary-color)', opacity: 0.3 }} />
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
            {kpi.trend} from last month
          </p>
        </div>
      ))}
    </div>
  );
}
