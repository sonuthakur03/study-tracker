import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    college: 'TU BCA',
    semester: '5th',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start your AI/ML & Data Engineering journey">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            className="input"
            type="text"
            placeholder="Aarav Sharma"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
            <input
              className="input"
              type="text"
              placeholder="TU BCA"
              value={form.college}
              onChange={(e) => set('college', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select
              className="input"
              value={form.semester}
              onChange={(e) => set('semester', e.target.value)}
            >
              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map((s) => (
                <option key={s} value={s}>
                  {s} Semester
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
