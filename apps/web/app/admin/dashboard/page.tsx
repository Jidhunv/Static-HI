'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login/admin');
      return;
    }
    setAdminToken(token);
    fetchTenants(token);
  }, [router]);

  const fetchTenants = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.replace('/login/admin');
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!adminToken) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-2xl font-bold">🏨 HotelHub</Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">Platform Admin</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tenant Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create, configure, and manage tenants</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm"
          >
            + Create Tenant
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Tenants</p>
            <p className="text-3xl font-bold">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{tenants.filter(t => t.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-lg border p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{tenants.filter(t => t.status === 'pending').length}</p>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg border dark:bg-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-sm">Tenant</th>
                <th className="text-left px-6 py-3 font-medium text-sm">Admin Email</th>
                <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-3 font-medium text-sm">Created</th>
                <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No tenants yet. Create your first tenant to get started.
                  </td>
                </tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{t.slug}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{t.adminEmail}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        t.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : t.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedTenant(t)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            if (adminToken) fetchTenants(adminToken);
          }}
          adminToken={adminToken}
        />
      )}

      {/* Configure Tenant Modal */}
      {selectedTenant && (
        <ConfigureTenantModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          adminToken={adminToken}
        />
      )}
    </div>
  );
}

function CreateTenantModal({ onClose, onSuccess, adminToken }: any) {
  const [form, setForm] = useState({
    tenantId: '',
    name: '',
    adminEmail: '',
    adminPassword: '',
    country: 'US',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create tenant');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create New Tenant</h2>
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tenant ID</label>
            <input
              type="text"
              value={form.tenantId}
              onChange={(e) => setForm({...form, tenantId: e.target.value.toLowerCase()})}
              placeholder="my-hotel-chain"
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="My Hotel Chain"
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admin Email</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({...form, adminEmail: e.target.value})}
              placeholder="admin@example.com"
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admin Password</label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) => setForm({...form, adminPassword: e.target.value})}
              placeholder="Temporary password"
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              value={form.country}
              onChange={(e) => setForm({...form, country: e.target.value})}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
            >
              <option>US</option>
              <option>IN</option>
              <option>GB</option>
              <option>SG</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border rounded px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfigureTenantModal({ tenant, onClose, adminToken }: any) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    name: tenant.name,
    businessType: tenant.businessType,
    primaryCurrency: 'USD',
    primaryColor: '#7c3aed',
    defaultB2BMargin: 15,
    defaultB2CMarkup: 25,
    commissionRate: 5,
    b2bEnabled: true,
    b2cEnabled: true,
    whitelabelEnabled: false,
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<'active' | 'inactive' | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const businessTypeMap: any = {
    hotel_chain: 'HOTEL CHAIN',
    dmc: 'DMC',
    ota: 'OTA',
    travel_agency: 'TRAVEL AGENCY'
  };

  const handleStatusChange = (action: 'active' | 'inactive') => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (!statusReason.trim()) {
      alert('Please provide a reason');
      return;
    }
    console.log(`Changing status to ${statusAction} with reason: ${statusReason}`);
    setShowStatusModal(false);
    setStatusReason('');
  };

  const handleSave = async () => {
    console.log('Saving settings:', settings);
    // API call would go here
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{tenant.name} - Configuration</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{businessTypeMap[tenant.businessType]}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="flex">
          {/* Tabs */}
          <div className="border-r border-slate-200 dark:border-slate-700 w-48 p-4">
            {['general', 'hotels', 'features', 'branding', 'financial', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`block w-full text-left px-4 py-2 rounded mb-2 text-sm ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">General Settings</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name</label>
                  <input type="text" value={settings.name} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select value={settings.businessType} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600">
                    <option value="hotel_chain">HOTEL CHAIN</option>
                    <option value="dmc">DMC</option>
                    <option value="ota">OTA</option>
                    <option value="travel_agency">TRAVEL AGENCY</option>
                  </select>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <label className="block text-sm font-medium mb-3">Tenant Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange('active')}
                      className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${
                        tenant.status === 'active'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      ✓ Activate
                    </button>
                    <button
                      onClick={() => handleStatusChange('inactive')}
                      className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${
                        tenant.status === 'inactive'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      ✗ Deactivate
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Current: <span className="font-medium capitalize">{tenant.status}</span></p>
                </div>
              </div>
            )}

            {activeTab === 'hotels' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Hotel Chains & Properties</h3>
                <div className="border rounded p-4 space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-300">The Plaza Hotel</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">📍 New York | 🏨 2 Room Types | ✓ Active</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Status: Available for B2B & B2C</p>
                  </div>
                  <button className="text-blue-600 text-sm hover:text-blue-700 font-medium">+ Add Hotel Chain</button>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Feature Toggles</h3>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.b2bEnabled} onChange={(e) => setSettings({...settings, b2bEnabled: e.target.checked})} />
                  <span className="text-sm">Enable B2B Marketplace</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.b2cEnabled} onChange={(e) => setSettings({...settings, b2cEnabled: e.target.checked})} />
                  <span className="text-sm">Enable B2C Bookings</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={settings.whitelabelEnabled} onChange={(e) => setSettings({...settings, whitelabelEnabled: e.target.checked})} />
                  <span className="text-sm">Enable White Label</span>
                </label>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Branding & White Label</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({...settings, primaryColor: e.target.value})} className="w-12 h-10 rounded cursor-pointer" />
                    <input type="text" value={settings.primaryColor} className="flex-1 border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" readOnly />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">Note: Logo, fonts, and other white-label assets can be configured in tenant settings</p>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Financial Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Primary Currency</label>
                    <select value={settings.primaryCurrency} onChange={(e) => setSettings({...settings, primaryCurrency: e.target.value})} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600">
                      <option>USD</option>
                      <option>EUR</option>
                      <option>INR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default B2B Margin %</label>
                    <input type="number" value={settings.defaultB2BMargin} onChange={(e) => setSettings({...settings, defaultB2BMargin: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default B2C Markup %</label>
                    <input type="number" value={settings.defaultB2CMarkup} onChange={(e) => setSettings({...settings, defaultB2CMarkup: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform Commission %</label>
                    <input type="number" value={settings.commissionRate} onChange={(e) => setSettings({...settings, commissionRate: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">User Management</h3>
                <div className="border rounded p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Admin User</p>
                  <p className="font-medium">{tenant.adminEmail}</p>
                  <p className="text-xs text-slate-500 mt-2">Status: Active</p>
                  <div className="mt-4 space-x-2">
                    <button className="text-blue-600 text-sm hover:text-blue-700">Reset Password</button>
                    <button className="text-orange-600 text-sm hover:text-orange-700">Revoke Access</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={onClose} className="flex-1 border rounded px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              {statusAction === 'active' ? 'Activate Tenant' : 'Deactivate Tenant'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {statusAction === 'active'
                ? 'Tenant will be able to access all features'
                : 'Tenant will lose access to all services. This action can be reversed.'}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Reason for {statusAction === 'active' ? 'activation' : 'deactivation'}</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600 min-h-24"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusReason('');
                }}
                className="flex-1 border rounded px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 text-white rounded px-4 py-2 text-sm font-medium ${
                  statusAction === 'active'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {statusAction === 'active' ? 'Activation' : 'Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
