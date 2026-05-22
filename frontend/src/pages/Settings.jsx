import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Bell, User, Lock, Target } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name||'', college: user?.college||'', semester: user?.semester||'5th', selectedPath: user?.selectedPath||'both' });
  const [prefs, setPrefs]     = useState({ emailReminders: user?.emailReminders ?? true, studyTarget: user?.studyTarget || 2, reminderTime: user?.reminderTime || '07:00' });
  const [passwd, setPasswd]   = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving]   = useState('');

  const saveProfile = async () => {
    setSaving('profile');
    try {
      const res = await API.put('/auth/profile', profile);
      updateUser(res.data);
      toast.success('Profile saved');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(''); }
  };

  const savePrefs = async () => {
    setSaving('prefs');
    try {
      const res = await API.put('/auth/profile', prefs);
      updateUser(res.data);
      toast.success('Preferences saved');
    } catch { toast.error('Failed to save preferences'); }
    finally { setSaving(''); }
  };

  const changePassword = async () => {
    if (passwd.newPassword !== passwd.confirm) return toast.error('Passwords do not match');
    if (passwd.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving('passwd');
    try {
      await API.put('/auth/change-password', { currentPassword: passwd.currentPassword, newPassword: passwd.newPassword });
      toast.success('Password changed');
      setPasswd({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(''); }
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Icon size={16} className="text-indigo-600" />
        </div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Section icon={User} title="Profile">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input className="input" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
              <input className="input" value={profile.college} onChange={e => setProfile(p => ({...p, college: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
              <select className="input" value={profile.semester} onChange={e => setProfile(p => ({...p, semester: e.target.value}))}>
                {['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Learning Path</label>
            <select className="input" value={profile.selectedPath} onChange={e => setProfile(p => ({...p, selectedPath: e.target.value}))}>
              <option value="aiml">AI / ML Only</option>
              <option value="de">Data Engineering Only</option>
              <option value="both">Both Paths</option>
            </select>
          </div>
          <button onClick={saveProfile} disabled={saving === 'profile'} className="btn-primary">
            {saving === 'profile' ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </Section>

      <Section icon={Bell} title="Email Reminders">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Daily Morning Email</p>
              <p className="text-sm text-slate-500">Get your study plan, DSA question & reminders every morning</p>
            </div>
            <button
              onClick={() => setPrefs(p => ({...p, emailReminders: !p.emailReminders}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs.emailReminders ? 'bg-indigo-500' : 'bg-slate-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${prefs.emailReminders ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Study Target (hours)</label>
              <input type="number" min="0.5" max="12" step="0.5" className="input" value={prefs.studyTarget}
                onChange={e => setPrefs(p => ({...p, studyTarget: parseFloat(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred reminder time</label>
              <input type="time" className="input" value={prefs.reminderTime}
                onChange={e => setPrefs(p => ({...p, reminderTime: e.target.value}))} />
              <p className="text-xs text-slate-400 mt-1">Server sends at 7:00 AM NPT daily</p>
            </div>
          </div>
          <button onClick={savePrefs} disabled={saving === 'prefs'} className="btn-primary">
            {saving === 'prefs' ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </Section>

      <Section icon={Lock} title="Change Password">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input type="password" className="input" value={passwd.currentPassword}
              onChange={e => setPasswd(p => ({...p, currentPassword: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input type="password" className="input" value={passwd.newPassword}
              onChange={e => setPasswd(p => ({...p, newPassword: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input type="password" className="input" value={passwd.confirm}
              onChange={e => setPasswd(p => ({...p, confirm: e.target.value}))} />
          </div>
          <button onClick={changePassword} disabled={saving === 'passwd'} className="btn-primary">
            {saving === 'passwd' ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </Section>

      {/* Account info */}
      <div className="card bg-slate-50 border-slate-100">
        <p className="text-sm font-medium text-slate-600 mb-2">Account Info</p>
        <div className="space-y-1 text-sm text-slate-500">
          <p>Email: <span className="text-slate-700">{user?.email}</span></p>
          <p>Role: <span className="text-slate-700 capitalize">{user?.role}</span></p>
          <p>Member since: <span className="text-slate-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></p>
          <p>Longest streak: <span className="text-orange-600 font-semibold">{user?.longestStreak || 0} days</span></p>
        </div>
      </div>
    </div>
  );
}
