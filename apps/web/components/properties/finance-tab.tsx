'use client';

import { Property } from '@hotel/types';

interface FinanceTabProps {
  property: Property;
}

export function FinanceTab({ property }: FinanceTabProps) {
  return (
    <div>
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Finance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Bank Account
          </label>
          <input
            type="text"
            placeholder="Enter bank account number"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Bank Name
          </label>
          <input
            type="text"
            placeholder="Enter bank name"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: 600',
            cursor: 'pointer',
          }}
        >
          Save Bank Details
        </button>
      </div>
    </div>
  );
}
