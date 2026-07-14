'use client';

import { useState, useEffect } from 'react';
import { getStatusIcon, getStatusColor, performAction } from '@/lib/approval-utils';

interface AgentApproval {
  id: string;
  entityId: string;
  entityType: string;
  status: 'pending' | 'confirmed' | 'suspended';
  createdAt: string;
  agentDetails?: {
    name: string;
    email: string;
    commissionRate: number;
    kycVerified: boolean;
  };
}

export default function AgentApprovalsPage() {
  const [approvals, setApprovals] = useState<AgentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<AgentApproval | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const res = await fetch('/api/approvals/pending/B2BAgent');
      setApprovals(await res.json());
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (approval: AgentApproval, action: 'approve' | 'reject') => {
    if (action === 'reject' && !actionNotes.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const res = await performAction(
        approval.entityType,
        approval.entityId,
        action,
        actionNotes,
        'tenant-admin-id',
        'admin@tenant.com',
        'Tenant Admin'
      );

      if (res.ok) {
        loadApprovals();
        setShowModal(false);
        setActionNotes('');
      }
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">B2B Agent Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve new B2B agent onboardings</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending approvals</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Agent Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Commission Rate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">KYC Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Requested</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{approval.agentDetails?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{approval.agentDetails?.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {approval.agentDetails?.commissionRate || 0}%
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        approval.agentDetails?.kycVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {approval.agentDetails?.kycVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        approval.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : approval.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getStatusIcon(approval.status)}
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {approval.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Approve Agent: {selectedApproval.agentDetails?.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-600">{selectedApproval.agentDetails?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Commission Rate</label>
                <p className="text-sm text-gray-600">{selectedApproval.agentDetails?.commissionRate}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">KYC Status</label>
                <p className="text-sm text-gray-600">
                  {selectedApproval.agentDetails?.kycVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Optional approval notes..."
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAction(selectedApproval!, 'approve')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(selectedApproval!, 'reject')}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
