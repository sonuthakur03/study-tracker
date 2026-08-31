import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Trash2, Search } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const toggleAdmin = async (user) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      const res = await API.put(`/admin/users/${user._id}`, { role: newRole });
      setUsers((p) => p.map((u) => (u._id === user._id ? res.data : u)));
      toast.success(`${user.name} is now ${newRole}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this user and all their associated data?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers((p) => p.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Streak</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Hours</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAdmin(u)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-orange-600 font-semibold">{u.streak} 🔥</td>
                    <td className="px-4 py-3 text-indigo-600">{Math.round(u.totalStudyHours || 0)}h</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => remove(u._id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
