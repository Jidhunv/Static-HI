'use client';

import { Property } from '@hotel/types';

interface PropertyFormProps {
  property: Property;
}

export function PropertyForm({ property }: PropertyFormProps) {
  return (
    <form style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Hotel Name
        </label>
        <input
          type="text"
          defaultValue={property.name}
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
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          City
        </label>
        <input
          type="text"
          defaultValue={property.city}
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
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Visibility
        </label>
        <select
          defaultValue={property.visibility}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxSizing: 'border-box',
          }}
        >
          <option value="private">Private</option>
          <option value="public_b2b">B2B Marketplace Only</option>
          <option value="public_b2c">B2C Storefront Only</option>
          <option value="public_both">B2B & B2C</option>
        </select>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Description
        </label>
        <textarea
          defaultValue={property.description || ''}
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
