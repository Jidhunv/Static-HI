'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COUNTRIES = ['US', 'IN', 'GB', 'SG', 'AU', 'CA'];
const BUSINESS_TYPES = [
  { value: 'dmc', label: 'DMC' },
  { value: 'ota', label: 'OTA' },
  { value: 'travel_agency', label: 'TRAVEL AGENCY' },
  { value: 'wholesaler', label: 'WHOLESALER' },
];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [activeTab, setActiveTab] = useState<'basic' | 'contacts' | 'profile'>('basic');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    // Basic Info
    tenantId: '',
    name: '',
    businessType: 'dmc',
    // Admin User
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    // Contacts
    salesContact: { name: '', phone: '', email: '' },
    financeContact: { name: '', phone: '', email: '' },
    owner: { name: '', phone: '', email: '' },
    // Organization Profile
    country: 'US',
    city: '',
    area: '',
    strengths: '',
    profileDescription: '',
    documentUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.tenantId || !form.name || !form.businessType) {
      setError('Please fill in all basic information');
      return;
    }
    if (!form.adminEmail || !form.adminPassword) {
      setError('Please fill in admin credentials');
      return;
    }
    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (!form.salesContact.name || !form.financeContact.name || !form.owner.name) {
      setError('Please fill in all contact information');
      return;
    }
    if (!form.country || !form.city || !form.area) {
      setError('Please fill in organization location');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: form.tenantId,
          name: form.name,
          businessType: form.businessType,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          country: form.country,
          city: form.city,
          area: form.area,
          strengths: form.strengths,
          profileDescription: form.profileDescription,
          salesContact: form.salesContact,
          financeContact: form.financeContact,
          owner: form.owner,
          documentUrl: form.documentUrl,
        })
      });

      if (res.ok) {
        setStep('success');
        setTimeout(() => router.push('/login/tenant'), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenant Created!</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Your tenant has been registered successfully. Awaiting admin approval. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block hover:opacity-70 mb-4">
            <h1 className="text-3xl font-bold">🏨 HotelHub</h1>
          </Link>
          <p className="text-sm text-slate-600 dark:text-slate-400">Complete Tenant Registration</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700 flex">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'contacts', label: 'Contact Details' },
              { id: 'profile', label: 'Organization Profile' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tenant ID *</label>
                    <input
                      type="text"
                      value={form.tenantId}
                      onChange={(e) => setForm({ ...form, tenantId: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="my-company-ltd"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="My Company Ltd"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business Type *</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                    required
                  >
                    {BUSINESS_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-medium mb-4">Admin Credentials</h4>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Email *</label>
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Password *</label>
                      <input
                        type="password"
                        value={form.adminPassword}
                        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                        className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        value={form.adminPasswordConfirm}
                        onChange={(e) => setForm({ ...form, adminPasswordConfirm: e.target.value })}
                        className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Contact Details</h3>

                {[
                  { key: 'owner' as const, label: 'Company Owner' },
                  { key: 'salesContact' as const, label: 'Sales Contact' },
                  { key: 'financeContact' as const, label: 'Finance Contact' }
                ].map(section => (
                  <div key={section.key} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">{section.label} *</h4>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={form[section.key].name}
                        onChange={(e) => setForm({
                          ...form,
                          [section.key]: { ...form[section.key], name: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="tel"
                          value={form[section.key].phone}
                          onChange={(e) => setForm({
                            ...form,
                            [section.key]: { ...form[section.key], phone: e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={form[section.key].email}
                          onChange={(e) => setForm({
                            ...form,
                            [section.key]: { ...form[section.key], email: e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Organization Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Organization Profile</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country *</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      required
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Area/Region *</label>
                    <input
                      type="text"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="Manhattan"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Organizational Strengths</label>
                  <textarea
                    value={form.strengths}
                    onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600 min-h-20"
                    placeholder="e.g., Global network, 24/7 support, competitive rates..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Organization Profile Description</label>
                  <textarea
                    value={form.profileDescription}
                    onChange={(e) => setForm({ ...form, profileDescription: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600 min-h-20"
                    placeholder="Brief description of your organization, history, mission, and services..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Documentation/Attachments URL</label>
                  <input
                    type="url"
                    value={form.documentUrl}
                    onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600"
                    placeholder="https://example.com/documents"
                  />
                  <p className="text-xs text-slate-500 mt-1">Link to KYC documents, licenses, certifications, etc.</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/"
                className="flex-1 border rounded px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login/tenant" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
