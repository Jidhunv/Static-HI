'use client';

import { Property } from '@hotel/types';
import { Plus } from 'lucide-react';

interface RatePlansTabProps {
  property: Property;
}

export function RatePlansTab({ property }: RatePlansTabProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Rate Plans</h3>
        <button style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Plus width="1rem" height="1rem" />
          Add Rate Plan
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        color: 'var(--text-secondary)',
      }}>
        Create rate plans for your rooms
      </div>
    </div>
  );
}
