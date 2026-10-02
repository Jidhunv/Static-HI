'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface APICredential {
  id: string;
  provider: string;
  name: string;
  status: 'active' | 'inactive';
  apiKey: string;
  apiUrl: string;
  username?: string;
  password?: string;
  additionalConfig?: Record<string, string>;
  lastTested?: string;
  syncFrequency?: string;
  updatedAt: string;
}

const API_PROVIDERS = [
  {
    name: 'exchangerate',
    label: 'ExchangeRate API',
    url: 'https://v6.exchangerate-api.com/v6',
    fields: ['apiKey', 'syncFrequency'],
  },
  {
    name: 'forex_api',
    label: 'Forex API',
    url: 'https://www.forexapi.io/api',
    fields: ['apiKey', 'syncFrequency'],
  },
  {
    name: 'fixer',
    label: 'Fixer API',
    url: 'https://api.fixer.io',
    fields: ['apiKey', 'username', 'password', 'syncFrequency'],
  },
  {
    name: 'openexchangerates',
    label: 'Open Exchange Rates',
    url: 'https://openexchangerates.org/api',
    fields: ['apiKey', 'syncFrequency'],
  },
];

export default function APICredentialsPage() {
  const [credentials, setCredentials] = useState<APICredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<APICredential | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(API_PROVIDERS[0].name);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive',
    apiKey: '',
    username: '',
    password: '',
    syncFrequency: 'every_4_hours',
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/admin/api-credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async () => {
    try {
      const response = await fetch('/api/admin/api-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          ...formData,
        }),
      });

      if (response.ok) {
        await fetchCredentials();
        setShowAddModal(false);
        setFormData({
          name: '',
          status: 'active',
          apiKey: '',
          username: '',
          password: '',
          syncFrequency: 'every_4_hours',
        });
      }
    } catch (error) {
      console.error('Error adding credential:', error);
    }
  };

  const handleUpdateCredential = async () => {
    if (!editingCredential) return;

    try {
      const response = await fetch(`/api/admin/api-credentials/${editingCredential.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          ...formData,
        }),
      });

      if (response.ok) {
        await fetchCredentials();
        setEditingCredential(null);
      }
    } catch (error) {
      console.error('Error updating credential:', error);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Delete this credential?')) return;

    try {
      const response = await fetch(`/api/admin/api-credentials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCredentials(credentials.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/api-credentials/${id}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('✅ Connection successful!');
      } else {
        alert('❌ Connection failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('❌ Connection error');
    }
  };

  if (loading) {
    return <div className="p-8">Loading API credentials...</div>;
  }

  const currentProvider = API_PROVIDERS.find((p) => p.name === selectedProvider);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Credentials Management</h1>
          <p className="text-gray-600">Configure and manage Forex API provider credentials</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingCredential(null);
            setFormData({
              name: '',
              status: 'active',
              apiKey: '',
              username: '',
              password: '',
              syncFrequency: 'every_4_hours',
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Credential
        </button>
      </div>

      {/* Credentials Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-sm">Provider</th>
              <th className="px-6 py-4 text-left font-semibold text-sm">Name</th>
              <th className="px-6 py-4 text-left font-semibold text-sm">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-sm">API Key</th>
              <th className="px-6 py-4 text-left font-semibold text-sm">Sync Frequency</th>
              <th className="px-6 py-4 text-left font-semibold text-sm">Last Tested</th>
              <th className="px-6 py-4 text-center font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {credentials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No API credentials configured. Add one to start syncing rates.
                </td>
              </tr>
            ) : (
              credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{cred.provider}</span>
                  </td>
                  <td className="px-6 py-4">{cred.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        cred.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cred.status === 'active' ? '✓ Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {cred.apiKey.substring(0, 8)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm">{cred.syncFrequency || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cred.lastTested ? new Date(cred.lastTested).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleTestConnection(cred.id)}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border rounded"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => {
                          setEditingCredential(cred);
                          setShowAddModal(true);
                          setSelectedProvider(cred.provider);
                          setFormData({
                            name: cred.name,
                            status: cred.status,
                            apiKey: cred.apiKey,
                            username: cred.username || '',
                            password: cred.password || '',
                            syncFrequency: cred.syncFrequency || 'every_4_hours',
                          });
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCredential(cred.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingCredential ? 'Edit Credential' : 'Add API Credential'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">API Provider *</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {API_PROVIDERS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., ExchangeRate - Production"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Status *</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sync Frequency</label>
                      <select
                        value={formData.syncFrequency}
                        onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="every_1_hour">Every 1 Hour</option>
                        <option value="every_4_hours">Every 4 Hours</option>
                        <option value="every_12_hours">Every 12 Hours</option>
                        <option value="daily">Daily</option>
                        <option value="manual">Manual Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Credentials Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">API Credentials</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key *</label>
                    <div className="relative">
                      <input
                        type={showPasswords[`apiKey-${editingCredential?.id || 'new'}`] ? 'text' : 'password'}
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder={`Enter your ${currentProvider?.label} API key`}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const key = `apiKey-${editingCredential?.id || 'new'}`;
                          setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] });
                        }}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords[`apiKey-${editingCredential?.id || 'new'}`] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {currentProvider?.fields.includes('username') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Username (if required)"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {currentProvider?.fields.includes('password') && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords[`password-${editingCredential?.id || 'new'}`] ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Password (if required)"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const key = `password-${editingCredential?.id || 'new'}`;
                            setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] });
                          }}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords[`password-${editingCredential?.id || 'new'}`] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <strong>API Endpoint:</strong> {currentProvider?.url}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                {editingCredential && (
                  <button
                    onClick={() => handleTestConnection(editingCredential.id)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                  >
                    Test Connection
                  </button>
                )}
                <button
                  onClick={editingCredential ? handleUpdateCredential : handleAddCredential}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingCredential ? 'Update' : 'Add'} Credential
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
