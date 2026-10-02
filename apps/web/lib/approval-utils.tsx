'use client';

import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock size={16} />;
    case 'confirmed':
      return <CheckCircle size={16} />;
    case 'suspended':
      return <XCircle size={16} />;
    default:
      return null;
  }
};

export const getStatusColor = (status: string) => STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;

export const performAction = async (
  entityType: string,
  entityId: string,
  action: 'approve' | 'reject',
  notes: string,
  userId: string,
  email: string,
  name: string
) => {
  const endpoint = action === 'approve' ? 'approve' : 'reject';
  return fetch(`/api/approvals/${entityType}/${entityId}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      [action === 'approve' ? 'notes' : 'reason']: notes,
      userId,
      email,
      name,
    }),
  });
};
