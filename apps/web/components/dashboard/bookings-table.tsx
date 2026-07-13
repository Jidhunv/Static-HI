'use client';

export function BookingsTable() {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        Recent Bookings
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Booking</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Guest</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: 'BK-001', guest: 'John Smith', amount: '$450', status: 'Confirmed' },
              { id: 'BK-002', guest: 'Jane Doe', amount: '$320', status: 'Pending' },
              { id: 'BK-003', guest: 'Bob Johnson', amount: '$580', status: 'Confirmed' },
            ].map((booking) => (
              <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{booking.id}</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{booking.guest}</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{booking.amount}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: booking.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                    color: booking.status === 'Confirmed' ? '#166534' : '#92400e',
                  }}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
