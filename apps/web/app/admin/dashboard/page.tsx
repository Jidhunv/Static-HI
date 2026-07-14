'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, Settings, Users, BarChart3, FileText, Database, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenant Management', icon: Building2 },
    { id: 'masters', label: 'Masters', icon: Database, submenu: [
      { id: 'countries', label: 'Countries' },
      { id: 'currencies', label: 'Currencies' },
    ]},
    { id: 'users', label: 'User Management', icon: Users, submenu: [
      { id: 'users-list', label: 'Users' },
      { id: 'roles', label: 'Roles' },
    ]},
    { id: 'reports', label: 'Reports', icon: BarChart3, submenu: [
      { id: 'reports-dashboard', label: 'Dashboard' },
      { id: 'detailed-reports', label: 'Detailed Reports' },
      { id: 'mis', label: 'MIS' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Link href="/" className="text-2xl font-bold block">🏨 HotelHub</Link>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Platform Admin</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium transition ${
                  activeSection === item.id || (item.submenu && item.submenu.some(s => activeSection === s.id))
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
              {item.submenu && (activeSection === item.id || item.submenu.some(s => activeSection === s.id)) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSection(sub.id)}
                      className={`w-full text-left px-4 py-2 rounded text-xs transition ${
                        activeSection === sub.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-8 py-4">
          <h1 className="text-2xl font-bold capitalize">{menuItems.find(m => m.id === activeSection)?.label || 'Dashboard'}</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Welcome to the HotelHub Admin Panel. Manage tenants, masters, users, and view reports.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              <div className="bg-white rounded-lg border p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Suspended</p>
                <p className="text-3xl font-bold text-red-600">{tenants.filter(t => t.status === 'inactive').length}</p>
              </div>
            </div>
          </>
        )}

        {/* Tenant Management Section */}
        {activeSection === 'tenants' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create, configure, and manage tenants</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm"
              >
                + Create Tenant
              </button>
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
          </>
        )}

        {/* Masters Section */}
        {activeSection === 'countries' && <CountriesMaster />}
        {activeSection === 'currencies' && <CurrenciesMaster />}

        {/* User Management Section */}
        {activeSection === 'users-list' && <UsersList />}
        {activeSection === 'roles' && <RolesManagement />}

        {/* Reports Section */}
        {activeSection === 'reports-dashboard' && <ReportsDashboard tenants={tenants} />}
        {activeSection === 'detailed-reports' && <DetailedReports tenants={tenants} />}
        {activeSection === 'mis' && <MISSection tenants={tenants} />}
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
            {['general', 'features', 'branding', 'financial', 'users'].map(tab => (
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

// Country Master Component
function CountriesMaster() {
  const [countries, setCountries] = useState([
    { id: 1, code: 'US', name: 'United States', status: 'active' },
    { id: 2, code: 'IN', name: 'India', status: 'active' },
    { id: 3, code: 'GB', name: 'United Kingdom', status: 'active' },
    { id: 4, code: 'SG', name: 'Singapore', status: 'active' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Manage countries for property locations</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Add Country</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Code</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Country Name</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {countries.map(country => (
              <tr key={country.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{country.code}</td>
                <td className="px-6 py-3">{country.name}</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {country.status}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Currency Master Component
function CurrenciesMaster() {
  const [currencies] = useState([
    { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', status: 'active' },
    { id: 2, code: 'EUR', name: 'Euro', symbol: '€', status: 'active' },
    { id: 3, code: 'INR', name: 'Indian Rupee', symbol: '₹', status: 'active' },
    { id: 4, code: 'GBP', name: 'British Pound', symbol: '£', status: 'active' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Manage currencies for pricing</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Add Currency</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Code</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Currency</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Symbol</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currencies.map(currency => (
              <tr key={currency.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{currency.code}</td>
                <td className="px-6 py-3">{currency.name}</td>
                <td className="px-6 py-3">{currency.symbol}</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {currency.status}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Users Management Component
function UsersList() {
  const [users] = useState([
    { id: 1, name: 'Admin User', email: 'admin@hotelhub.com', role: 'Super Admin', status: 'active' },
    { id: 2, name: 'Manager', email: 'manager@hotelhub.com', role: 'Admin', status: 'active' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Manage platform users and their access</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Create User</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Name</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Email</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Role</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{user.name}</td>
                <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{user.email}</td>
                <td className="px-6 py-3 text-sm">{user.role}</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-sm">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Roles Management Component
function RolesManagement() {
  const [roles] = useState([
    { id: 1, name: 'Super Admin', permissions: 'All', users: 1 },
    { id: 2, name: 'Admin', permissions: 'Tenant Management, Users, Reports', users: 1 },
    { id: 3, name: 'Manager', permissions: 'View Reports, User Management', users: 0 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Manage roles and permissions</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Create Role</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Role Name</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Permissions</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Users</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{role.name}</td>
                <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{role.permissions}</td>
                <td className="px-6 py-3">{role.users}</td>
                <td className="px-6 py-3 space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reports Dashboard Component
function ReportsDashboard({ tenants }: any) {
  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">View key performance indicators and platform metrics</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Tenants</p>
          <p className="text-3xl font-bold">{tenants.length}</p>
          <p className="text-xs text-slate-500 mt-2">↑ 2% from last month</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Active Tenants</p>
          <p className="text-3xl font-bold text-green-600">{tenants.filter((t: any) => t.status === 'active').length}</p>
          <p className="text-xs text-slate-500 mt-2">↑ 5% from last month</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Bookings</p>
          <p className="text-3xl font-bold">1,234</p>
          <p className="text-xs text-slate-500 mt-2">↑ 12% from last month</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Revenue</p>
          <p className="text-3xl font-bold">$45.2K</p>
          <p className="text-xs text-slate-500 mt-2">↑ 8% from last month</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Tenant Status Overview</h3>
        <div className="space-y-3">
          {[
            { label: 'Active', value: tenants.filter((t: any) => t.status === 'active').length, color: 'green' },
            { label: 'Pending', value: tenants.filter((t: any) => t.status === 'pending').length, color: 'yellow' },
            { label: 'Suspended', value: tenants.filter((t: any) => t.status === 'inactive').length, color: 'red' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{ width: `${(item.value / tenants.length) * 100}%` }}></div>
                </div>
                <span className="text-sm font-medium w-8">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Detailed Reports Component
function DetailedReports({ tenants }: any) {
  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">View detailed reports by various metrics</p>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Tenant Performance Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Tenant Name</th>
                <th className="text-left px-4 py-2 font-medium">Bookings</th>
                <th className="text-left px-4 py-2 font-medium">Revenue</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tenants.slice(0, 5).map((tenant: any) => (
                <tr key={tenant.id}>
                  <td className="px-4 py-3">{tenant.name}</td>
                  <td className="px-4 py-3">{Math.floor(Math.random() * 100 + 50)}</td>
                  <td className="px-4 py-3">${Math.floor(Math.random() * 10000 + 5000)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// MIS Section Component
function MISSection({ tenants }: any) {
  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">Management Information System - Comprehensive platform analytics</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>January</span><span className="font-medium">$25,000</span></div>
            <div className="flex justify-between"><span>February</span><span className="font-medium">$28,500</span></div>
            <div className="flex justify-between"><span>March</span><span className="font-medium">$32,100</span></div>
            <div className="flex justify-between"><span>April</span><span className="font-medium">$35,800</span></div>
            <div className="flex justify-between"><span>May</span><span className="font-medium">$40,200</span></div>
            <div className="flex justify-between"><span>June</span><span className="font-medium">$45,200</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Booking Status Distribution</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Confirmed</span><span className="font-medium">45%</span></div>
            <div className="flex justify-between"><span>Pending</span><span className="font-medium">30%</span></div>
            <div className="flex justify-between"><span>Cancelled</span><span className="font-medium">15%</span></div>
            <div className="flex justify-between"><span>Completed</span><span className="font-medium">10%</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Platform KPIs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600 dark:text-slate-400 mb-1">Avg Booking Value</p>
            <p className="text-xl font-bold">$1,245</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400 mb-1">Conversion Rate</p>
            <p className="text-xl font-bold">3.2%</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400 mb-1">Tenant Growth</p>
            <p className="text-xl font-bold">+12%</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400 mb-1">Platform Uptime</p>
            <p className="text-xl font-bold">99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
