'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';

const PERMISSIONS = [
  'hotels.manage',
  'bookings.view',
  'bookings.manage',
  'rates.manage',
  'finance.view',
  'finance.manage',
  'reports.view',
  'b2b_agents.manage',
  'commissions.view',
  'settlements.view',
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', password: '' });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const tenantId = 'tenant-id'; // From context in real app

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users`);
      setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, roles: selectedPerms }),
      });
      if (res.ok) {
        setFormData({ email: '', firstName: '', lastName: '', password: '' });
        setSelectedPerms([]);
        setShowForm(false);
        loadUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await fetch(`/api/tenants/${tenantId}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete user?')) return;
    try {
      await fetch(`/api/tenants/${tenantId}/users/${userId}`, { method: 'DELETE' });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
          <form onSubmit={addUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                required
              />
              <input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(p)}
                      onChange={(e) =>
                        setSelectedPerms(
                          e.target.checked
                            ? [...selectedPerms, p]
                            : selectedPerms.filter((x) => x !== p)
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Save User
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Permissions</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.id, e.target.value)}
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-sm">{user.permissions?.length || 0} perms</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
