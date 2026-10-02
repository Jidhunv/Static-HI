'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Plus, Edit2, Trash2, LayoutDashboard, Building2, Settings, Users, BarChart3, FileText, Database, LogOut } from 'lucide-react';

interface PaymentMode {
  id: string;
  name: string;
  paymentGateway: boolean;
  isDefaultGateway: boolean;
  wallet: boolean;
  isDefaultWallet: boolean;
  attribute?: string;
  amount?: number;
  amountType: 'flat' | 'percent';
  walletType: 'debit' | 'credit';
  unlimitedCreditLimit: boolean;
  creditLimit?: number;
  creditLimitExpiryDate?: string;
  thresholdCreditLimit?: number;
  status: 'active' | 'inactive';
}

export default function PaymentConfigurationPage() {
  const router = useRouter();
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Partial<PaymentMode>>({
    name: '',
    paymentGateway: false,
    isDefaultGateway: false,
    wallet: false,
    isDefaultWallet: false,
    attribute: '',
    amount: undefined,
    amountType: 'flat',
    walletType: 'debit',
    unlimitedCreditLimit: false,
    creditLimit: undefined,
    creditLimitExpiryDate: '',
    thresholdCreditLimit: undefined,
    status: 'active',
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login/admin');
      return;
    }
    fetchPaymentModes();
  }, [router]);

  const fetchPaymentModes = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData: PaymentMode[] = [
        {
          id: '1',
          name: 'Credit Card Payment',
          paymentGateway: true,
          isDefaultGateway: true,
          wallet: false,
          isDefaultWallet: false,
          attribute: 'Stripe Integration',
          amount: 2.5,
          amountType: 'percent',
          walletType: 'debit',
          unlimitedCreditLimit: false,
          creditLimit: undefined,
          creditLimitExpiryDate: '',
          thresholdCreditLimit: 1000,
          status: 'active',
        },
      ];
      setPaymentModes(mockData);
    } catch (error) {
      console.error('Error fetching payment modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMode = async () => {
    if (!formData.name) {
      alert('Please enter a payment mode name');
      return;
    }

    if (!formData.paymentGateway && !formData.wallet) {
      alert('Please select at least Payment Gateway or Wallet');
      return;
    }

    try {
      if (isEditing && selectedMode) {
        // TODO: Replace with actual API call
        const updated = { ...selectedMode, ...formData } as PaymentMode;
        setPaymentModes(paymentModes.map((m) => (m.id === selectedMode.id ? updated : m)));
        setSelectedMode(updated);
      } else {
        // TODO: Replace with actual API call
        const newMode: PaymentMode = {
          id: Date.now().toString(),
          ...formData,
        } as PaymentMode;
        setPaymentModes([...paymentModes, newMode]);
      }

      setShowForm(false);
      setIsEditing(false);
      setFormData({
        name: '',
        paymentGateway: false,
        isDefaultGateway: false,
        wallet: false,
        isDefaultWallet: false,
        attribute: '',
        amount: undefined,
        amountType: 'flat',
        walletType: 'debit',
        unlimitedCreditLimit: false,
        creditLimit: undefined,
        creditLimitExpiryDate: '',
        thresholdCreditLimit: undefined,
        status: 'active',
      });
    } catch (error) {
      console.error('Error saving payment mode:', error);
    }
  };

  const handleEdit = (mode: PaymentMode) => {
    setFormData(mode);
    setSelectedMode(mode);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment mode?')) return;

    try {
      // TODO: Replace with actual API call
      setPaymentModes(paymentModes.filter((m) => m.id !== id));
      if (selectedMode?.id === id) {
        setSelectedMode(null);
      }
    } catch (error) {
      console.error('Error deleting payment mode:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'tenants', label: 'Tenant Management', icon: Building2, href: '/admin/dashboard' },
    { id: 'masters', label: 'Masters', icon: Database, href: '/admin/dashboard' },
    { id: 'currency-mgmt', label: 'Currency Management', icon: BarChart3, href: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Users, href: '/admin/dashboard' },
    { id: 'payments', label: 'Payment Setup', icon: FileText, href: '/admin/dashboard' },
    { id: 'payment-config', label: 'Payment Configuration', icon: Settings, href: '/admin/payment-configuration' },
    { id: 'ledgers', label: 'Tenant Ledger', icon: BarChart3, href: '/admin/dashboard' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin/dashboard' },
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
            <Link
              key={item.id}
              href={item.href || '#'}
              className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              router.replace('/login/admin');
            }}
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
          <h1 className="text-2xl font-bold">Payment Configuration</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-gray-600">Configure payment modes, gateways, and credit settings</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
            setFormData({
              name: '',
              paymentGateway: false,
              isDefaultGateway: false,
              wallet: false,
              isDefaultWallet: false,
              attribute: '',
              amount: undefined,
              amountType: 'flat',
              walletType: 'debit',
              unlimitedCreditLimit: false,
              creditLimit: undefined,
              creditLimitExpiryDate: '',
              thresholdCreditLimit: undefined,
              status: 'active',
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Payment Mode
        </button>
      </div>

      {/* Payment Modes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {paymentModes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => setSelectedMode(mode)}
            className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition ${
              selectedMode?.id === mode.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{mode.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(mode);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(mode.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {mode.paymentGateway && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Payment Gateway {mode.isDefaultGateway && '(Default)'}</span>
                </div>
              )}
              {mode.wallet && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>
                    {mode.walletType === 'credit' ? 'Credit' : 'Debit'} Wallet
                    {mode.isDefaultWallet && ' (Default)'}
                  </span>
                </div>
              )}
              {mode.amount && (
                <div className="text-gray-600">
                  {mode.amount} {mode.amountType === 'percent' ? '%' : '₹'}
                </div>
              )}
              {mode.creditLimit && (
                <div className="text-gray-600">Credit Limit: ₹{mode.creditLimit.toFixed(2)}</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  mode.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {mode.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Payment Mode' : 'Add Payment Mode'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Payment Mode Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Mode Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, Bank Transfer, Wallet"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Payment Gateway */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="paymentGateway"
                    checked={formData.paymentGateway || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentGateway: e.target.checked,
                        isDefaultGateway: e.target.checked ? formData.isDefaultGateway : false,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="paymentGateway" className="font-semibold">
                    Payment Gateway
                  </label>
                  {formData.paymentGateway && (
                    <input
                      type="radio"
                      id="gatewayDefault"
                      name="gatewayDefault"
                      checked={formData.isDefaultGateway || false}
                      onChange={(e) =>
                        setFormData({ ...formData, isDefaultGateway: e.target.checked })
                      }
                      className="w-4 h-4 ml-auto"
                    />
                  )}
                  {formData.paymentGateway && (
                    <label htmlFor="gatewayDefault" className="text-sm text-gray-600">
                      Default
                    </label>
                  )}
                </div>

                {formData.paymentGateway && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Attribute</label>
                    <input
                      type="text"
                      value={formData.attribute || ''}
                      onChange={(e) => setFormData({ ...formData, attribute: e.target.value })}
                      placeholder="e.g., Stripe Integration, PayPal, Razorpay"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Threshold Credit Limit */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-red-600">
                    Threshold Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.thresholdCreditLimit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thresholdCreditLimit: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Enter threshold amount"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Right Column - Wallet */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="wallet"
                    checked={formData.wallet || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wallet: e.target.checked,
                        isDefaultWallet: e.target.checked ? formData.isDefaultWallet : false,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="wallet" className="font-semibold">
                    Wallet
                  </label>
                  {formData.wallet && (
                    <input
                      type="radio"
                      id="walletDefault"
                      name="walletDefault"
                      checked={formData.isDefaultWallet || false}
                      onChange={(e) =>
                        setFormData({ ...formData, isDefaultWallet: e.target.checked })
                      }
                      className="w-4 h-4 ml-auto"
                    />
                  )}
                  {formData.wallet && (
                    <label htmlFor="walletDefault" className="text-sm text-gray-600">
                      Default
                    </label>
                  )}
                </div>

                {formData.wallet && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Wallet Type</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="walletType"
                            value="debit"
                            checked={formData.walletType === 'debit'}
                            onChange={(e) =>
                              setFormData({ ...formData, walletType: e.target.value as 'debit' | 'credit' })
                            }
                            className="w-4 h-4"
                          />
                          <span>Debit Wallet</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="walletType"
                            value="credit"
                            checked={formData.walletType === 'credit'}
                            onChange={(e) =>
                              setFormData({ ...formData, walletType: e.target.value as 'debit' | 'credit' })
                            }
                            className="w-4 h-4"
                          />
                          <span>Credit Wallet</span>
                        </label>
                      </div>
                    </div>

                    {formData.walletType === 'credit' && (
                      <>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.unlimitedCreditLimit || false}
                            onChange={(e) =>
                              setFormData({ ...formData, unlimitedCreditLimit: e.target.checked })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Unlimited Credit Limit</span>
                        </label>

                        {!formData.unlimitedCreditLimit && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-2">Credit Limit</label>
                              <input
                                type="number"
                                value={formData.creditLimit || ''}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    creditLimit: e.target.value ? Number(e.target.value) : undefined,
                                  })
                                }
                                placeholder="0.000"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Credit Limit Expiry Date
                              </label>
                              <input
                                type="date"
                                value={formData.creditLimitExpiryDate || ''}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    creditLimitExpiryDate: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Amount Configuration */}
            {(formData.paymentGateway || formData.wallet) && (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount Type</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="amountType"
                        value="flat"
                        checked={formData.amountType === 'flat'}
                        onChange={(e) =>
                          setFormData({ ...formData, amountType: e.target.value as 'flat' | 'percent' })
                        }
                        className="w-4 h-4"
                      />
                      <span>Flat</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="amountType"
                        value="percent"
                        checked={formData.amountType === 'percent'}
                        onChange={(e) =>
                          setFormData({ ...formData, amountType: e.target.value as 'flat' | 'percent' })
                        }
                        className="w-4 h-4"
                      />
                      <span>Percent</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-4 h-4"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-4 h-4"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMode}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
        </div>
      </div>
    </div>
  );
}
