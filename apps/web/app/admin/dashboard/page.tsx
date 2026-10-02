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
      { id: 'currency-rates', label: 'Exchange Rates' },
      { id: 'meal-types', label: 'Meal Types' },
    ]},
    { id: 'rates', label: 'Room Rates', icon: BarChart3, submenu: [
      { id: 'room-config', label: 'Room Configuration' },
      { id: 'rates-calendar', label: 'Rate Calendar' },
    ]},
    { id: 'currency-mgmt', label: 'Currency Management', icon: BarChart3, submenu: [
      { id: 'rates-table', label: 'Exchange Rates Matrix' },
      { id: 'api-credentials', label: 'API Credentials' },
    ]},
    { id: 'users', label: 'User Management', icon: Users, submenu: [
      { id: 'users-list', label: 'Users' },
      { id: 'roles', label: 'Roles' },
    ]},
    { id: 'payments', label: 'Payment Setup', icon: FileText, submenu: [
      { id: 'payment-modes', label: 'Payment Modes' },
      { id: 'payment-gateways', label: 'Payment Gateways' },
    ]},
    { id: 'payment-config', label: 'Payment Configuration', icon: Settings, submenu: [
      { id: 'payment-config-form', label: 'Payment Mode Configuration' },
    ]},
    { id: 'ledgers', label: 'Tenant Ledger', icon: BarChart3 },
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
        {activeSection === 'currency-rates' && <CurrencyRatesUpdater />}
        {activeSection === 'meal-types' && <MealTypesMaster />}

        {/* Room Rates Section */}
        {activeSection === 'room-config' && <RoomConfiguration />}
        {activeSection === 'rates-calendar' && <RateCalendar />}

        {/* Currency Management - Links to External Pages */}
        {activeSection === 'rates-table' && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Redirecting to Exchange Rates Matrix...</p>
            <a href="/admin/currency-rates-table" className="text-blue-600 underline">
              Go to Exchange Rates Matrix
            </a>
          </div>
        )}
        {activeSection === 'api-credentials' && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Redirecting to API Credentials...</p>
            <a href="/admin/api-credentials" className="text-blue-600 underline">
              Go to API Credentials
            </a>
          </div>
        )}

        {/* User Management Section */}
        {activeSection === 'users-list' && <UsersList />}
        {activeSection === 'roles' && <RolesManagement />}

        {/* Payment Setup Section */}
        {activeSection === 'payment-modes' && <PaymentModes />}
        {activeSection === 'payment-gateways' && <PaymentGateways />}
        {activeSection === 'payment-config-form' && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Redirecting to Payment Configuration...</p>
            <a href="/admin/payment-configuration" className="text-blue-600 underline">
              Go to Payment Configuration
            </a>
          </div>
        )}

        {/* Tenant Ledger Section */}
        {activeSection === 'ledgers' && <TenantLedger tenants={tenants} />}

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

// Payment Modes Component
function PaymentModes() {
  const [paymentModes] = useState([
    { id: 1, name: 'Credit', description: 'Postpaid credit facility', status: 'active', commissionRate: 2.5 },
    { id: 2, name: 'Debit', description: 'Upfront payment', status: 'active', commissionRate: 1.0 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Configure payment modes available for tenants</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Add Payment Mode</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Payment Mode</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Description</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Commission %</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paymentModes.map(mode => (
              <tr key={mode.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{mode.name}</td>
                <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{mode.description}</td>
                <td className="px-6 py-3">{mode.commissionRate}%</td>
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {mode.status}
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

// Payment Gateways Component
function PaymentGateways() {
  const [gateways] = useState([
    { id: 1, name: 'Stripe', provider: 'Stripe Inc.', status: 'active', commission: 2.9, setupFee: 0 },
    { id: 2, name: 'PayPal', provider: 'PayPal Inc.', status: 'active', commission: 3.49, setupFee: 0 },
    { id: 3, name: 'Razorpay', provider: 'Razorpay', status: 'active', commission: 2.0, setupFee: 0 },
    { id: 4, name: 'Square', provider: 'Square Inc.', status: 'inactive', commission: 2.6, setupFee: 0 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600 dark:text-slate-400">Manage payment gateway integrations and configurations</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">+ Add Gateway</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Gateway Name</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Provider</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Commission %</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {gateways.map(gateway => (
              <tr key={gateway.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-3 font-medium">{gateway.name}</td>
                <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{gateway.provider}</td>
                <td className="px-6 py-3">{gateway.commission}%</td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    gateway.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {gateway.status}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
                  <button className="text-purple-600 hover:text-purple-700 text-sm">Test</button>
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

// Tenant Ledger Component
function TenantLedger({ tenants }: any) {
  const [selectedTenant, setSelectedTenant] = useState(tenants.length > 0 ? tenants[0].id : null);
  const [editingPaymentConfig, setEditingPaymentConfig] = useState(false);
  const [paymentConfigs, setPaymentConfigs] = useState<any>({});

  // Tenant data with different ledger entries
  const tenantData: any = {
    [tenants[0]?.id]: {
      balance: 5000,
      totalCredits: 8500,
      totalDebits: 3500,
      creditLimit: 10000,
      creditUsed: 5000,
      paymentMethods: {
        credit: { enabled: true, limit: 10000, used: 5000 },
        debit: { enabled: true },
        paymentGateways: { stripe: true, razorpay: true, paypal: false }
      },
      ledger: [
        { id: 1, date: '2026-06-15', type: 'Credit', amount: 5000, balance: 5000, reference: 'INV-001', description: 'Monthly Commission' },
        { id: 2, date: '2026-06-10', type: 'Debit', amount: 2000, balance: 3000, reference: 'PAY-001', description: 'Payout' },
        { id: 3, date: '2026-06-05', type: 'Credit', amount: 3500, balance: 5000, reference: 'INV-002', description: 'Booking Commission' },
        { id: 4, date: '2026-05-28', type: 'Debit', amount: 1500, balance: 1500, reference: 'PAY-002', description: 'Service Fee' },
      ]
    },
    [tenants[1]?.id]: {
      balance: 12000,
      totalCredits: 25000,
      totalDebits: 13000,
      creditLimit: 20000,
      creditUsed: 8000,
      paymentMethods: {
        credit: { enabled: true, limit: 20000, used: 8000 },
        debit: { enabled: true },
        paymentGateways: { stripe: true, razorpay: false, paypal: true }
      },
      ledger: [
        { id: 1, date: '2026-06-18', type: 'Credit', amount: 8000, balance: 12000, reference: 'INV-003', description: 'Booking Commission' },
        { id: 2, date: '2026-06-12', type: 'Debit', amount: 5000, balance: 4000, reference: 'PAY-003', description: 'Markup Payout' },
      ]
    },
    [tenants[2]?.id]: {
      balance: 3500,
      totalCredits: 5500,
      totalDebits: 2000,
      creditLimit: 5000,
      creditUsed: 1500,
      paymentMethods: {
        credit: { enabled: false, limit: 5000, used: 1500 },
        debit: { enabled: true },
        paymentGateways: { stripe: true, razorpay: true, paypal: true }
      },
      ledger: [
        { id: 1, date: '2026-06-16', type: 'Debit', amount: 2000, balance: 3500, reference: 'PAY-004', description: 'Commission Deduction' },
      ]
    },
  };

  const currentTenantData = tenantData[selectedTenant] || {
    balance: 0,
    totalCredits: 0,
    totalDebits: 0,
    creditLimit: 0,
    creditUsed: 0,
    paymentMethods: {
      credit: { enabled: false, limit: 0, used: 0 },
      debit: { enabled: false },
      paymentGateways: { stripe: false, razorpay: false, paypal: false }
    },
    ledger: []
  };

  const handlePaymentConfigChange = (method: string, field: string, value: any) => {
    setPaymentConfigs({
      ...paymentConfigs,
      [selectedTenant]: {
        ...paymentConfigs[selectedTenant],
        [method]: {
          ...(paymentConfigs[selectedTenant]?.[method] || currentTenantData.paymentMethods[method]),
          [field]: value
        }
      }
    });
  };

  const activePaymentConfig = paymentConfigs[selectedTenant] || currentTenantData.paymentMethods;

  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">View and manage financial ledger for each tenant</p>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Select Tenant</p>
            <select
              value={selectedTenant || ''}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
            >
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-green-600">${currentTenantData.balance}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Credits</p>
            <p className="text-2xl font-bold">${currentTenantData.totalCredits}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Debits</p>
            <p className="text-2xl font-bold text-red-600">${currentTenantData.totalDebits}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-sm">Date</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Type</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Description</th>
              <th className="text-left px-6 py-3 font-medium text-sm">Reference</th>
              <th className="text-right px-6 py-3 font-medium text-sm">Amount</th>
              <th className="text-right px-6 py-3 font-medium text-sm">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentTenantData.ledger.length > 0 ? (
              currentTenantData.ledger.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-3">{entry.date}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      entry.type === 'Credit'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">{entry.description}</td>
                  <td className="px-6 py-3 text-sm font-medium">{entry.reference}</td>
                  <td className="px-6 py-3 text-right font-medium">
                    <span className={entry.type === 'Credit' ? 'text-green-600' : 'text-red-600'}>
                      {entry.type === 'Credit' ? '+' : '-'}${entry.amount}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">${entry.balance}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No ledger entries for this tenant</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Payment Methods Configuration</h3>
          {editingPaymentConfig && (
            <button
              onClick={() => setEditingPaymentConfig(false)}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Save Configuration
            </button>
          )}
          {!editingPaymentConfig && (
            <button
              onClick={() => setEditingPaymentConfig(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit Configuration
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credit Payment Mode */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-sm">Credit Payment Mode</p>
              {editingPaymentConfig && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activePaymentConfig.credit?.enabled || false}
                    onChange={(e) => handlePaymentConfigChange('credit', 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs">Enabled</span>
                </label>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Credit Limit:</span>
                {editingPaymentConfig ? (
                  <input
                    type="number"
                    value={activePaymentConfig.credit?.limit || 0}
                    onChange={(e) => handlePaymentConfigChange('credit', 'limit', parseInt(e.target.value))}
                    className="w-20 border rounded px-2 py-1 text-xs dark:bg-slate-700 dark:border-slate-600"
                  />
                ) : (
                  <span className="font-medium">${activePaymentConfig.credit?.limit || 0}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Used:</span>
                <span className="font-medium text-red-600">${activePaymentConfig.credit?.used || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Available:</span>
                <span className="font-medium text-green-600">${(activePaymentConfig.credit?.limit || 0) - (activePaymentConfig.credit?.used || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600">Status:</span>
                <span className={`font-medium text-xs px-2 py-1 rounded ${
                  activePaymentConfig.credit?.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {activePaymentConfig.credit?.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Debit/Payment Gateway */}
          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-sm">Debit / Direct Payment</p>
              {editingPaymentConfig && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activePaymentConfig.debit?.enabled || false}
                    onChange={(e) => handlePaymentConfigChange('debit', 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs">Enabled</span>
                </label>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-600">Type:</span> <span className="font-medium">Upfront Payment</span></div>
              <div><span className="text-slate-600">Processing:</span> <span className="font-medium">Immediate</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600">Status:</span>
                <span className={`font-medium text-xs px-2 py-1 rounded ${
                  activePaymentConfig.debit?.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {activePaymentConfig.debit?.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="border rounded p-4">
            <p className="font-medium text-sm mb-3">Payment Gateways</p>
            <div className="space-y-2 text-sm">
              {['stripe', 'razorpay', 'paypal'].map(gateway => (
                <label key={gateway} className="flex items-center justify-between">
                  <span className="text-slate-600 capitalize">{gateway}:</span>
                  {editingPaymentConfig ? (
                    <input
                      type="checkbox"
                      checked={activePaymentConfig.paymentGateways?.[gateway] || false}
                      onChange={(e) => handlePaymentConfigChange('paymentGateways', gateway, e.target.checked)}
                      className="w-4 h-4"
                    />
                  ) : (
                    <span className={`font-medium text-xs px-2 py-1 rounded ${
                      activePaymentConfig.paymentGateways?.[gateway]
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {activePaymentConfig.paymentGateways?.[gateway] ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencyRatesUpdater() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [fxRates, setFxRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [updateReason, setUpdateReason] = useState('manual_update');
  const [apiProvider, setApiProvider] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (selectedRate) {
      fetchRateHistory();
    }
  }, [selectedRate]);

  const fetchCurrencies = async () => {
    try {
      const [currRes, ratesRes] = await Promise.all([
        fetch('/api/currency'),
        fetch('/api/currency/latest/all'),
      ]);

      if (currRes.ok) {
        const currData = await currRes.json();
        setCurrencies(currData);
      }

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setFxRates(ratesData);
        if (ratesData.length > 0) {
          setSelectedRate(ratesData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateHistory = async () => {
    if (!selectedRate) return;

    try {
      const response = await fetch(
        `/api/currency/rate/history/${selectedRate.baseCurrency.id}/${selectedRate.quoteCurrency.id}?limit=30`
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleUpdateRate = async () => {
    if (!selectedRate || !newRate) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/currency/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCurrencyId: selectedRate.baseCurrency.id,
          quoteCurrencyId: selectedRate.quoteCurrency.id,
          rate: parseFloat(newRate),
          source: 'manual',
          updateReason,
        }),
      });

      if (response.ok) {
        setNewRate('');
        setUpdateReason('manual_update');
        await fetchCurrencies();
        setSyncMessage('Rate updated successfully!');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      setSyncMessage('Error updating rate');
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncWithAPI = async () => {
    if (!apiProvider) return;

    setUpdating(true);
    setSyncMessage('Syncing with API...');
    try {
      const sampleRates = [
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'EUR', rate: 0.92 },
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'INR', rate: 83.15 },
        { baseCurrencyCode: 'USD', quoteCurrencyCode: 'GBP', rate: 0.78 },
      ];

      const response = await fetch('/api/currency/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rates: sampleRates,
          apiProvider,
        }),
      });

      if (response.ok) {
        await fetchCurrencies();
        setSyncMessage(`Synced ${sampleRates.length} rates from ${apiProvider}`);
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error syncing with API:', error);
      setSyncMessage('Error syncing with API');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading currencies...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Currency Exchange Rates</h2>

      {/* API Connection Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 dark:bg-blue-900/20 dark:border-blue-800">
        <h3 className="font-semibold mb-4">API Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select API Provider</label>
            <select
              value={apiProvider}
              onChange={(e) => setApiProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">-- No API Connected --</option>
              <option value="forex_api">Forex API</option>
              <option value="exchangerate">ExchangeRate API</option>
              <option value="fixer">Fixer API</option>
              <option value="openexchangerates">Open Exchange Rates</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSyncWithAPI}
              disabled={!apiProvider || updating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updating ? 'Syncing...' : 'Sync Rates'}
            </button>
          </div>
          <div className="flex items-end text-sm">
            {apiProvider ? (
              <span className="text-green-600 font-medium">✓ {apiProvider}</span>
            ) : (
              <span className="text-gray-500">No API connected</span>
            )}
          </div>
        </div>
        {syncMessage && (
          <div className={`mt-4 p-3 rounded text-sm ${syncMessage.includes('Error') ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
            {syncMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rates List */}
        <div className="bg-white rounded-lg border dark:bg-slate-800 dark:border-slate-700 p-6">
          <h3 className="font-semibold mb-4">Exchange Rates</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fxRates.length === 0 ? (
              <p className="text-sm text-gray-500">No rates available</p>
            ) : (
              fxRates.map((rate) => (
                <button
                  key={rate.id}
                  onClick={() => setSelectedRate(rate)}
                  className={`w-full text-left p-3 rounded border transition ${
                    selectedRate?.id === rate.id
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {rate.baseCurrency.code} → {rate.quoteCurrency.code}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {rate.rate.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {rate.source === 'api' ? '📡' : '✏️'} {new Date(rate.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Rate Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRate ? (
            <>
              {/* Current Rate */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6 dark:from-blue-900 dark:to-blue-800">
                <p className="text-blue-100 text-sm">Current Rate</p>
                <h3 className="text-3xl font-bold mt-2">{selectedRate.rate.toFixed(6)}</h3>
                <p className="text-blue-100 mt-2">
                  1 {selectedRate.baseCurrency.code} = {selectedRate.rate.toFixed(6)} {selectedRate.quoteCurrency.code}
                </p>
              </div>

              {/* Update Form */}
              <div className="bg-white rounded-lg border dark:bg-slate-800 dark:border-slate-700 p-6">
                <h3 className="font-semibold mb-4">Update Rate</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">New Rate</label>
                    <input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder={selectedRate.rate.toString()}
                      step="0.0001"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <select
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="manual_update">Manual Update</option>
                      <option value="correction">Correction</option>
                      <option value="daily_update">Daily Update</option>
                    </select>
                  </div>

                  <button
                    onClick={handleUpdateRate}
                    disabled={!newRate || updating}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {updating ? 'Updating...' : 'Update Rate'}
                  </button>
                </div>
              </div>

              {/* History */}
              <div className="bg-white rounded-lg border dark:bg-slate-800 dark:border-slate-700 p-6">
                <h3 className="font-semibold mb-4">Rate History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500">No history</p>
                  ) : (
                    history.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                        <span>{entry.rate.toFixed(6)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-8 text-center text-gray-600">
              Select a currency pair
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MealTypesMaster() {
  const [mealTypes, setMealTypes] = useState([
    { id: 1, name: 'Room Only', code: 'RO', status: 'active' },
    { id: 2, name: 'Bed & Breakfast', code: 'BB', status: 'active' },
    { id: 3, name: 'Half Board', code: 'HB', status: 'active' },
    { id: 4, name: 'Full Board', code: 'FB', status: 'active' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', status: 'active' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meal Types Master</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Meal Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700 space-y-4">
          <input
            type="text"
            placeholder="Meal Type Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
          <input
            type="text"
            placeholder="Code (e.g., RO, BB)"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealTypes.map((mt) => (
          <div key={mt.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{mt.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Code: {mt.code}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${mt.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {mt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoomConfiguration() {
  const [roomTypes, setRoomTypes] = useState([
    { id: 1, name: 'Standard', description: 'Basic room with essential amenities', status: 'active', capacity: 2 },
    { id: 2, name: 'Deluxe', description: 'Premium room with enhanced features', status: 'active', capacity: 2 },
    { id: 3, name: 'Suite', description: 'Spacious suite with separate living area', status: 'active', capacity: 4 },
    { id: 4, name: 'Penthouse', description: 'Luxury penthouse with premium services', status: 'active', capacity: 6 },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', capacity: 2, status: 'active' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddRoomType = () => {
    if (formData.name && formData.capacity) {
      if (editingId) {
        setRoomTypes(roomTypes.map(rt => rt.id === editingId ? { ...rt, ...formData, id: rt.id } : rt));
        setEditingId(null);
      } else {
        const newRoom = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          capacity: parseInt(formData.capacity.toString()),
          status: formData.status
        };
        setRoomTypes([...roomTypes, newRoom]);
      }
      setFormData({ name: '', description: '', capacity: 2, status: 'active' });
      setShowAddForm(false);
    }
  };

  const handleEdit = (room: any) => {
    setFormData(room);
    setEditingId(room.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this room type?')) {
      setRoomTypes(roomTypes.filter(rt => rt.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Room Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage room types available in your properties</p>
        </div>
      </div>

      {/* Room Types Table */}
      <div className="bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-sm">Room Type</th>
              <th className="px-6 py-3 text-left font-semibold text-sm">Description</th>
              <th className="px-6 py-3 text-center font-semibold text-sm">Capacity</th>
              <th className="px-6 py-3 text-left font-semibold text-sm">Status</th>
              <th className="px-6 py-3 text-center font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-600">
            {roomTypes.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4 font-medium">{room.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.description}</td>
                <td className="px-6 py-4 text-center">{room.capacity} guests</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    room.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {room.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => handleEdit(room)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Room Type Button */}
      {!showAddForm && (
        <button
          onClick={() => {
            setFormData({ name: '', description: '', capacity: 2, status: 'active' });
            setEditingId(null);
            setShowAddForm(true);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Room Type
        </button>
      )}

      {/* Add/Edit Room Type Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Room Type' : 'Add New Room Type'}</h3>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room Type Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard, Deluxe, Suite"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this room type"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Capacity (guests) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddRoomType}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingId ? 'Update' : 'Add'} Room Type
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({ name: '', description: '', capacity: 2, status: 'active' });
              }}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RateConfiguration() {
  const [selectedMealType, setSelectedMealType] = useState('BB');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ roomType: '', amount: '', status: 'active' });
  const [rates, setRates] = useState({
    RO: [{ id: 1, roomType: 'Standard', amount: 100, status: 'active' }],
    BB: [{ id: 1, roomType: 'Standard', amount: 150, status: 'active' }, { id: 2, roomType: 'Deluxe', amount: 200, status: 'active' }],
    HB: [{ id: 1, roomType: 'Standard', amount: 200, status: 'active' }],
    FB: [],
  });

  const mealTypeTabs = [
    { code: 'RO', label: 'Room Only' },
    { code: 'BB', label: 'Bed & Breakfast' },
    { code: 'HB', label: 'Half Board' },
    { code: 'FB', label: 'Full Board' },
  ];

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Penthouse'];

  const handleAddRate = () => {
    if (formData.roomType && formData.amount) {
      const newRate = {
        id: Date.now(),
        roomType: formData.roomType,
        amount: parseFloat(formData.amount),
        status: formData.status
      };
      setRates({
        ...rates,
        [selectedMealType as keyof typeof rates]: [...rates[selectedMealType as keyof typeof rates], newRate]
      });
      setFormData({ roomType: '', amount: '', status: 'active' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rate Configuration</h2>
      </div>

      {/* Meal Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6 overflow-x-auto">
          {mealTypeTabs.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setSelectedMealType(tab.code)}
              className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
                selectedMealType === tab.code
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-sm">Room Type</th>
              <th className="px-6 py-3 text-left font-semibold text-sm">Amount (₹)</th>
              <th className="px-6 py-3 text-left font-semibold text-sm">Status</th>
              <th className="px-6 py-3 text-center font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-600">
            {rates[selectedMealType as keyof typeof rates].map((rate) => (
              <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4">{rate.roomType}</td>
                <td className="px-6 py-4">₹{rate.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    rate.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {rate.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Rate Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Rate
        </button>
      )}

      {/* Add Rate Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-700 rounded-lg border dark:border-slate-600 p-6">
          <h3 className="text-lg font-semibold mb-4">Add Rate for {mealTypeTabs.find(t => t.code === selectedMealType)?.label}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room Type *</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
              >
                <option value="">Select room type</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-600 dark:border-slate-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddRate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Rate
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ roomType: '', amount: '', status: 'active' });
              }}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RateCalendar() {
  const [selectedMealType, setSelectedMealType] = useState('BB');
  const [selectedRoomType, setSelectedRoomType] = useState('Standard');
  const [roomAllocation, setRoomAllocation] = useState(10);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6)); // July 2026
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rateAmount, setRateAmount] = useState('');
  const [isBlackout, setIsBlackout] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])); // Weekdays by default
  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Penthouse'];
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [selectedMarkupCategory, setSelectedMarkupCategory] = useState('public');
  const [markupConfig, setMarkupConfig] = useState({
    public: { percentage: 0, fixedAmount: 0, roundupEnabled: false, roundupValue: 1 },
    private: { percentage: 0, fixedAmount: 0, roundupEnabled: false, roundupValue: 1 },
    b2b: { percentage: 0, fixedAmount: 0, roundupEnabled: false, roundupValue: 1 },
    b2c: { percentage: 0, fixedAmount: 0, roundupEnabled: false, roundupValue: 1 },
  });
  const [dateRates, setDateRates] = useState([
    { startDate: '2026-07-15', endDate: '2026-07-20', mealType: 'BB', roomType: 'Standard', rate: 150, isBlackout: false, weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    { startDate: '2026-07-25', endDate: '2026-07-27', mealType: 'BB', roomType: 'Deluxe', rate: 0, isBlackout: true, weekdays: ['Sat', 'Sun'] },
  ]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

  const toggleWeekday = (day: string) => {
    const newWeekdays = new Set(selectedWeekdays);
    if (newWeekdays.has(day)) {
      newWeekdays.delete(day);
    } else {
      newWeekdays.add(day);
    }
    setSelectedWeekdays(newWeekdays);
  };

  const handleCalendarDateClick = (day: number) => {
    const dateStr = formatDate(day);
    if (!startDate) {
      setStartDate(dateStr);
      setEndDate('');
    } else if (!endDate) {
      if (dateStr < startDate) {
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    } else {
      setStartDate(dateStr);
      setEndDate('');
    }
  };

  const isDateInSelectedRange = (day: any) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(day);
    return dateStr >= startDate && dateStr <= endDate;
  };

  const mealTypeTabs = [
    { code: 'RO', label: 'Room Only' },
    { code: 'BB', label: 'Bed & Breakfast' },
    { code: 'HB', label: 'Half Board' },
    { code: 'FB', label: 'Full Board' },
  ];

  const getDaysInMonth = (date: any) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: any) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (day: any) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateInRange = (day: any) => {
    const date = formatDate(day);
    const dayOfWeek = weekdays[new Date(date).getDay()];
    return dateRates.some((dr, idx) => {
      const inRange = date >= dr.startDate && date <= dr.endDate && dr.mealType === selectedMealType && dr.roomType === selectedRoomType;
      const isApplicableDay = dr.weekdays && dr.weekdays.length > 0 ? dr.weekdays.includes(dayOfWeek) : true;
      return inRange && isApplicableDay;
    });
  };

  const getDateInfo = (day: any) => {
    const date = formatDate(day);
    const dayOfWeek = weekdays[new Date(date).getDay()];

    // First check for blackout periods (highest priority)
    const blackout = dateRates.findIndex(dr => {
      if (!dr.isBlackout) return false;
      const inRange = date >= dr.startDate && date <= dr.endDate && dr.mealType === selectedMealType && dr.roomType === selectedRoomType;
      const isApplicableDay = dr.weekdays && dr.weekdays.length > 0 ? dr.weekdays.includes(dayOfWeek) : true;
      return inRange && isApplicableDay;
    });

    if (blackout >= 0) {
      return dateRates[blackout];
    }

    // Then find all applicable rates and return the latest one (highest index)
    const applicableIndices = dateRates
      .map((dr, idx) => ({ dr, idx }))
      .filter(({ dr }) => {
        if (dr.isBlackout) return false;
        const inRange = date >= dr.startDate && date <= dr.endDate && dr.mealType === selectedMealType && dr.roomType === selectedRoomType;
        const isApplicableDay = dr.weekdays && dr.weekdays.length > 0 ? dr.weekdays.includes(dayOfWeek) : true;
        return inRange && isApplicableDay;
      });

    if (applicableIndices.length > 0) {
      // Return the rate with the highest index (latest added = highest priority)
      return applicableIndices.reduce((latest, current) => current.idx > latest.idx ? current : latest).dr;
    }

    return null;
  };

  const handleApplyDateRange = () => {
    if (startDate && endDate && selectedWeekdays.size > 0 && (rateAmount || isBlackout)) {
      // No longer blocking overlaps - latest rates will have priority
      setDateRates([...dateRates, {
        startDate,
        endDate,
        mealType: selectedMealType,
        roomType: selectedRoomType,
        rate: isBlackout ? 0 : parseFloat(rateAmount),
        isBlackout,
        weekdays: Array.from(selectedWeekdays)
      }]);
      setStartDate('');
      setEndDate('');
      setRateAmount('');
      setIsBlackout(false);
      setSelectedWeekdays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])); // Reset to weekdays
    }
  };

  const handleDeleteRate = (indexToDelete: number) => {
    setDateRates(dateRates.filter((_, idx) => idx !== indexToDelete));
  };

  const getRemainingRooms = (day: number) => {
    const date = formatDate(day);
    const dateInfo = getDateInfo(day);

    // If blackout, no rooms available
    if (dateInfo?.isBlackout) {
      return 0;
    }

    // If rate exists, show all rooms are available at that rate
    // In a real system, this would subtract actual bookings
    if (dateInfo?.rate !== undefined) {
      return roomAllocation;
    }

    // If no rate, all rooms available
    return roomAllocation;
  };

  const calendarDays = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Rate Calendar</h2>
        <p className="text-gray-600 dark:text-gray-400">Allocate rooms and set rates by date range and meal type</p>
      </div>

      {/* Room Allocation Section - Above Meal Type Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6">
        <h3 className="font-semibold text-lg mb-4">Room Allocation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Room Type *</label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              {roomTypes.map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Available Units *</label>
            <input
              type="number"
              value={roomAllocation}
              onChange={(e) => setRoomAllocation(parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex items-end">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Rooms</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{roomAllocation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type Tabs - Below Room Allocation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2 py-3 mr-4">Set Rates by Meal Type:</span>
        {mealTypeTabs.map((tab) => (
          <button
            key={tab.code}
            onClick={() => setSelectedMealType(tab.code)}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${
              selectedMealType === tab.code
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">←</button>
            <h3 className="text-lg font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={nextMonth} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">→</button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateInfo = day ? getDateInfo(day) : null;
              const hasRate = day && isDateInRange(day);
              const isInSelectedRange = day && isDateInSelectedRange(day);
              const isStartDate = day && formatDate(day) === startDate;
              const isEndDate = day && formatDate(day) === endDate;

              return (
                <div
                  key={idx}
                  onClick={() => day && handleCalendarDateClick(day)}
                  className={`p-3 text-center text-sm rounded border transition ${
                    day === null
                      ? 'bg-gray-50 dark:bg-slate-700/20'
                      : isStartDate || isEndDate
                      ? 'bg-green-200 dark:bg-green-900/50 border-green-500 cursor-pointer font-bold'
                      : isInSelectedRange
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-400 cursor-pointer'
                      : hasRate
                      ? dateInfo?.isBlackout
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-400 cursor-pointer'
                        : 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 cursor-pointer'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-semibold">{day}</div>
                      <div className="text-xs mt-1">
                        {dateInfo?.isBlackout ? (
                          <>
                            <span className="text-red-600 dark:text-red-400">Blackout</span>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">0 Rooms</div>
                          </>
                        ) : dateInfo ? (
                          <>
                            <span className="text-blue-600 dark:text-blue-400">₹{dateInfo.rate}</span>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">{getRemainingRooms(day)} Rooms</div>
                          </>
                        ) : (
                          <div className="text-gray-600 dark:text-gray-400">{getRemainingRooms(day)} Rooms</div>
                        )}
                      </div>
                      {(isStartDate || isEndDate) && (
                        <div className="text-xs mt-1 font-bold">
                          {isStartDate && isEndDate ? 'S-E' : isStartDate ? 'Start' : 'End'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 rounded"></div>
              <span>Rate Applied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 border border-red-400 rounded"></div>
              <span>Blackout Period (No Bookings)</span>
            </div>
          </div>
        </div>

        {/* Date Range Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6 space-y-4 h-fit">
          <div>
            <h3 className="font-semibold text-lg mb-2">Apply Rates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For: <span className="font-medium">{selectedRoomType}</span> ({roomAllocation} units) - <span className="font-medium">{mealTypeTabs.find(t => t.code === selectedMealType)?.label}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              disabled={!startDate}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Select start date first"
            />
            {!startDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select start date first</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Applicable Days *</label>
            <div className="grid grid-cols-4 gap-2">
              {weekdays.map(day => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWeekdays.has(day)}
                    onChange={() => toggleWeekday(day)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs font-medium">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t dark:border-slate-700 pt-4">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isBlackout}
                onChange={(e) => setIsBlackout(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Mark as Blackout Period</span>
            </label>

            {!isBlackout && (
              <div>
                <label className="block text-sm font-medium mb-2">Rate Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rateAmount}
                  onChange={(e) => setRateAmount(e.target.value)}
                  placeholder="Enter rate"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleApplyDateRange}
            disabled={!startDate || !endDate}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Apply to Calendar
          </button>
        </div>
      </div>

      {/* Applied Date Ranges */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6">
        <h3 className="font-semibold mb-4">Applied Rates & Blackouts - {selectedRoomType} ({roomAllocation} Units) - {mealTypeTabs.find(t => t.code === selectedMealType)?.label}</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {dateRates.map((dr, idx) => {
            if (dr.mealType !== selectedMealType) return null;
            return (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                <div>
                  <span className="font-medium">{dr.startDate} to {dr.endDate}</span>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <div>Room: <span className="font-medium">{dr.roomType}</span></div>
                    <div>Days: {dr.weekdays?.join(', ') || 'All days'}</div>
                    {dr.isBlackout ? (
                      <span className="text-red-600 dark:text-red-400">🚫 Blackout Period</span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400">₹{dr.rate} per night</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRate(idx)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded transition"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Markup Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Rate Markup Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">Configure markups and roundup for different rate categories and channels</p>
        </div>

        {/* Markup Category Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 overflow-x-auto mt-6 mb-6">
          {[
            { id: 'public', label: 'Public Data' },
            { id: 'private', label: 'Private Data' },
            { id: 'b2b', label: 'B2B' },
            { id: 'b2c', label: 'B2C' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMarkupCategory(tab.id)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                selectedMarkupCategory === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Markup Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Percentage Markup */}
          <div>
            <label className="block text-sm font-medium mb-2">Percentage Markup (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={markupConfig[selectedMarkupCategory].percentage}
                onChange={(e) => {
                  const newConfig = { ...markupConfig };
                  newConfig[selectedMarkupCategory].percentage = parseFloat(e.target.value) || 0;
                  setMarkupConfig(newConfig);
                }}
                placeholder="e.g., 10 for 10%"
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
              <span className="text-gray-600 dark:text-gray-400 py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Percentage to be added to the base rate</p>
          </div>

          {/* Fixed Amount Markup */}
          <div>
            <label className="block text-sm font-medium mb-2">Fixed Amount Markup (₹)</label>
            <div className="flex gap-2">
              <span className="text-gray-600 dark:text-gray-400 py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={markupConfig[selectedMarkupCategory].fixedAmount}
                onChange={(e) => {
                  const newConfig = { ...markupConfig };
                  newConfig[selectedMarkupCategory].fixedAmount = parseFloat(e.target.value) || 0;
                  setMarkupConfig(newConfig);
                }}
                placeholder="e.g., 50"
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fixed amount to be added to the base rate</p>
          </div>

          {/* Roundup Toggle */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={markupConfig[selectedMarkupCategory].roundupEnabled}
                onChange={(e) => {
                  const newConfig = { ...markupConfig };
                  newConfig[selectedMarkupCategory].roundupEnabled = e.target.checked;
                  setMarkupConfig(newConfig);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable Roundup</span>
            </label>

            {markupConfig[selectedMarkupCategory].roundupEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">Roundup to Nearest (₹)</label>
                <select
                  value={markupConfig[selectedMarkupCategory].roundupValue}
                  onChange={(e) => {
                    const newConfig = { ...markupConfig };
                    newConfig[selectedMarkupCategory].roundupValue = parseFloat(e.target.value);
                    setMarkupConfig(newConfig);
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                >
                  <option value="1">₹1</option>
                  <option value="5">₹5</option>
                  <option value="10">₹10</option>
                  <option value="50">₹50</option>
                  <option value="100">₹100</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Round up the final price to the nearest value</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Price Calculation Preview:</p>
            <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <p>Base Rate: ₹100</p>
              {markupConfig[selectedMarkupCategory].percentage > 0 && (
                <p>+ Percentage Markup ({markupConfig[selectedMarkupCategory].percentage}%): ₹{(100 * markupConfig[selectedMarkupCategory].percentage / 100).toFixed(2)}</p>
              )}
              {markupConfig[selectedMarkupCategory].fixedAmount > 0 && (
                <p>+ Fixed Markup: ₹{markupConfig[selectedMarkupCategory].fixedAmount.toFixed(2)}</p>
              )}
              <p className="font-medium pt-2 border-t border-blue-200 dark:border-blue-900/50">
                Calculated Price: ₹{(100 + (100 * markupConfig[selectedMarkupCategory].percentage / 100) + markupConfig[selectedMarkupCategory].fixedAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 flex gap-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
            Save Markup Configuration
          </button>
          <button className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 font-medium transition">
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
