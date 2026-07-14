'use client';

import { useState, useEffect } from 'react';
import { Eye, Filter, Download, Archive } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-gray-100 text-gray-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-orange-100 text-orange-800',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({ action: '', entity: '', days: '7' });
  const [stats, setStats] = useState<any>(null);

  // In a real app, get these from auth context
  const userId = 'user-id';
  const userRole = 'admin';
  const tenantId = 'tenant-id';

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId,
        userRole,
        ...(tenantId && { tenantId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entity && { entity: filters.entity }),
      });

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(
        `/api/audit-logs/stats/activity?${new URLSearchParams({
          ...(tenantId && { tenantId }),
          days: filters.days,
        })}`
      );
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const viewLogDetail = async (logId: string) => {
    try {
      const res = await fetch(
        `/api/audit-logs/${logId}?${new URLSearchParams({
          userId,
          userRole,
          ...(tenantId && { tenantId }),
        })}`
      );
      const log = await res.json();
      setSelectedLog(log);
    } catch (err) {
      console.error('Failed to load log detail:', err);
    }
  };

  const downloadLogs = async () => {
    try {
      const params = new URLSearchParams({
        userId,
        userRole,
        ...(tenantId && { tenantId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entity && { entity: filters.entity }),
      });

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();

      const csv = [
        ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Status', 'IP Address'],
        ...data.map((log: any) => [
          new Date(log.createdAt).toLocaleString(),
          log.userName,
          log.action,
          log.entity,
          log.entityId || '-',
          log.status,
          log.ipAddress || '-',
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download logs:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all activities across the platform</p>
        </div>
        <button
          onClick={downloadLogs}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={20} /> Export CSV
        </button>
      </div>

      {/* Statistics */}
      {stats && Array.isArray(stats) && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.slice(0, 3).map((stat: any, idx: number) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 capitalize">{stat._count || 0} {stat.action}s</div>
              <div className="text-2xl font-bold">{stat._count || 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_COLORS).map((action) => (
            <option key={action} value={action}>
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="Property">Property</option>
          <option value="Booking">Booking</option>
          <option value="Commission">Commission</option>
          <option value="Settlement">Settlement</option>
          <option value="B2BAgent">B2B Agent</option>
        </select>

        <select
          value={filters.days}
          onChange={(e) => setFilters({ ...filters, days: e.target.value })}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Entity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium">{log.userName}</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div>{log.entity}</div>
                    {log.entityName && (
                      <div className="text-xs text-gray-500">{log.entityName}</div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => viewLogDetail(log.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Audit Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">User</label>
                    <p className="text-sm">{selectedLog.userName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <p className="text-sm">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Action</label>
                    <p className="text-sm">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Entity</label>
                    <p className="text-sm">{selectedLog.entity}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Status</label>
                    <p className="text-sm">{selectedLog.status}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">IP Address</label>
                    <p className="text-sm">{selectedLog.ipAddress || '-'}</p>
                  </div>
                </div>

                {selectedLog.changes && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Changes</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Error</label>
                    <p className="text-sm text-red-600">{selectedLog.errorMessage}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600">Timestamp</label>
                  <p className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
