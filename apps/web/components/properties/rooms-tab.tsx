'use client';

import { Property } from '@hotel/types';
import { Plus } from 'lucide-react';

interface RoomsTabProps {
  property: Property;
}

export function RoomsTab({ property }: RoomsTabProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Rooms</h3>
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
          Add Room
        </button>
      </div>

      {property.rooms && property.rooms.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {property.rooms.map((room: any) => (
            <div
              key={room.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>{room.type}</h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {room.quantity} rooms available
                  </p>
                </div>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: 'var(--primary-color)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.375rem',
          color: 'var(--text-secondary)',
        }}>
          No rooms yet. Add your first room to get started.
        </div>
      )}
    </div>
  );
}
