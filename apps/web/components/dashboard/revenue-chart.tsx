'use client';

export function RevenueChart() {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        Revenue Trend
      </h3>
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}>
        Chart placeholder - Revenue over time
      </div>
    </div>
  );
}
