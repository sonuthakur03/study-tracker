import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

const AuthShell = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
          <BookOpen size={20} className="text-white" />
        </div>
        <div className="text-white">
          <p className="font-bold text-lg leading-none">StudyTrack</p>
          <p className="text-xs text-indigo-300">Nepal 🇳🇵</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
        <p className="text-slate-500 text-sm mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
);

// ─── LOGIN ──────────────────────────────────────────────────────────────────
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your learning journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        No account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register here</Link>
      </p>
    </AuthShell>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', college: 'TU BCA', semester: '5th' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start your AI/ML & Data Engineering journey">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input className="input" type="text" placeholder="Aarav Sharma" value={form.name}
            onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={form.email}
            onChange={e => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
            onChange={e => set('password', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
            <input className="input" type="text" placeholder="TU BCA" value={form.college}
              onChange={e => set('college', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)}>
              {['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(s => (
                <option key={s} value={s}>{s} Semester</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export default Login;
