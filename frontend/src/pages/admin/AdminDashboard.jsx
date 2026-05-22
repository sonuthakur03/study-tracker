import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, Code2, Map, CheckSquare, Send, Mail, Megaphone } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [announce, setAnnounce] = useState({ title:'', content:'', type:'info', sendEmail: false });
  const [sending, setSending] = useState('');

  useEffect(() => {
    API.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const sendAnnouncement = async () => {
    if (!announce.title || !announce.content) return toast.error('Title and content required');
    setSending('announce');
    try {
      const res = await API.post('/admin/announce', announce);
      toast.success(`Announcement sent${announce.sendEmail ? ` — ${res.data.emailsSent} emails sent` : ''}`);
      setAnnounce({ title:'', content:'', type:'info', sendEmail: false });
    } catch { toast.error('Failed to send announcement'); }
    finally { setSending(''); }
  };

  const triggerDailyEmail = async (userId = null) => {
    setSending('email');
    try {
      const res = await API.post('/admin/send-daily-email', userId ? { userId } : {});
      toast.success(res.data.message);
    } catch { toast.error('Failed to send emails'); }
    finally { setSending(''); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'DSA Questions', value: stats.totalDSA, icon: Code2, color: 'bg-orange-100 text-orange-600' },
    { label: 'Roadmap Topics', value: stats.totalTopics, icon: Map, color: 'bg-teal-100 text-teal-600' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'bg-purple-100 text-purple-600' },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage users, content, and send communications</p>
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Announcement */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-900">Send Announcement</h2>
              </div>
              <div className="space-y-3">
                <input className="input" placeholder="Announcement title" value={announce.title}
                  onChange={e => setAnnounce(p => ({...p, title: e.target.value}))} />
                <textarea className="input resize-none h-24" placeholder="Announcement content…" value={announce.content}
                  onChange={e => setAnnounce(p => ({...p, content: e.target.value}))} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input" value={announce.type} onChange={e => setAnnounce(p => ({...p, type: e.target.value}))}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={announce.sendEmail} onChange={e => setAnnounce(p => ({...p, sendEmail: e.target.checked}))} className="w-4 h-4 accent-indigo-500" />
                    <span className="text-sm text-slate-700">Also send email</span>
                  </label>
                </div>
                <button onClick={sendAnnouncement} disabled={sending === 'announce'} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send size={15} /> {sending === 'announce' ? 'Sending…' : 'Send Announcement'}
                </button>
              </div>
            </div>

            {/* Email controls */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-900">Email Controls</h2>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <p className="font-medium text-slate-800 mb-1">Automatic Schedule</p>
                  <p>Daily emails send automatically at <strong>7:00 AM Nepal Time</strong> (1:15 AM UTC) via node-cron.</p>
                  <p className="mt-2 text-xs text-slate-400">Streak reset: midnight NPT | Study hours reset: midnight NPT</p>
                </div>
                <button onClick={() => triggerDailyEmail()} disabled={sending === 'email'} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Mail size={15} /> {sending === 'email' ? 'Sending…' : 'Trigger Daily Email (All Users)'}
                </button>
                <p className="text-xs text-slate-400 text-center">Only sends to users with email reminders enabled</p>
              </div>
            </div>
          </div>

          {/* Recent users */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users size={16} /> Recent Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">Name</th>
                    <th className="text-left py-2 font-medium text-slate-500">Email</th>
                    <th className="text-left py-2 font-medium text-slate-500">Streak</th>
                    <th className="text-left py-2 font-medium text-slate-500">Hours</th>
                    <th className="text-left py-2 font-medium text-slate-500">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentUsers || []).map(u => (
                    <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-800">{u.name}</td>
                      <td className="py-2.5 text-slate-500">{u.email}</td>
                      <td className="py-2.5 text-orange-600 font-semibold">{u.streak} 🔥</td>
                      <td className="py-2.5 text-indigo-600">{Math.round(u.totalStudyHours)}h</td>
                      <td className="py-2.5 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
