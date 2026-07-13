'use client';

export function PropertyStats() {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        Property Performance
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {['The Plaza Hotel', 'Luxury Suites', 'Downtown Inn'].map((property) => (
          <div key={property} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{property}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>45 bookings</p>
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-color)' }}>$12,450</p>
          </div>
        ))}
      </div>
    </div>
  );
}
