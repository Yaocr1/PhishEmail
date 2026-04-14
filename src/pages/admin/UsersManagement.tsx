import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { apiUrl, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type ManagedUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  scanCount: number;
};

export const UsersManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!user) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(apiUrl('/api/admin/users'), {
        headers: {
          'x-user-role': user.role,
        },
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage('Failed to load users.', null, response.status));
      }

      const payload = (await response.json()) as ManagedUser[];
      setUsers(payload);
    } catch (usersError) {
      setError(getApiErrorMessage('Failed to load users.', usersError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/user" replace />;
  }

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: getApiErrorMessage('Failed to create user.', null, response.status) }));
        throw new Error(payload.error || getApiErrorMessage('Failed to create user.', null, response.status));
      }

      setEmail('');
      setPassword('');
      await loadUsers();
    } catch (createError) {
      setError(getApiErrorMessage('Failed to create user.', createError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/admin/users/${id}`), {
        method: 'DELETE',
        headers: {
          'x-user-role': user.role,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: getApiErrorMessage('Failed to delete user.', null, response.status) }));
        throw new Error(payload.error || getApiErrorMessage('Failed to delete user.', null, response.status));
      }

      await loadUsers();
    } catch (deleteError) {
      setError(getApiErrorMessage('Failed to delete user.', deleteError));
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">User Management</h1>
        <p className="text-sm text-gray-400 mt-1">Create standard user accounts and manage registered users.</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Create User Account</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min 8 chars)"
            className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-neon-blue text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-[#00cce6] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3">Admin role cannot be created from this panel. A single default admin account is provisioned automatically.</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold">Registered Users</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500 text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Scans</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {users.map((entry) => (
                  <tr key={entry.id}>
                    <td className="p-4 text-gray-200">{entry.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${entry.role === 'ADMIN' ? 'text-neon-blue border-neon-blue/30 bg-neon-blue/10' : 'text-gray-300 border-white/20'}`}>
                        {entry.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{entry.scanCount}</td>
                    <td className="p-4 text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {entry.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(entry.id)}
                          className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
};
