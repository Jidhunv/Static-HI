'use client';

import { Property } from '@hotel/types';

interface PoliciesTabProps {
  property: Property;
}

export function PoliciesTab({ property }: PoliciesTabProps) {
  return (
    <div>
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Cancellation Policies</h3>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        color: 'var(--text-secondary)',
      }}>
        Manage your cancellation policies
      </div>
    </div>
  );
}
