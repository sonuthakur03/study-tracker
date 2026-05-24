import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Save, Mail, Send, ToggleLeft, ToggleRight, CalendarClock } from 'lucide-react';

const Toggle = ({ value, onChange, label, desc }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${value ? 'bg-indigo-500' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);

  // Push assignment form
  const [pushForm, setPushForm]       = useState({ subject:'', title:'', description:'', dueDate:'', priority:'medium' });
  const [subjects, setSubjects]       = useState([]);
  const [pushing, setPushing]         = useState(false);
  const [showPushForm, setShowPushForm] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/admin/email-settings'),
      API.get('/admin/subjects'),
    ]).then(([s, sub]) => {
      setSettings(s.data);
      setSubjects(sub.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await API.put('/admin/email-settings', settings);
      setSettings(res.data);
      toast.success('Email settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const triggerDailyEmail = async () => {
    setSending(true);
    try {
      const res = await API.post('/admin/send-daily-email', {}, { timeout: 30000 });
      toast.success(res.data.message);
    } catch (err) {
      if (err.code === 'ECONNABORTED') toast.error('Timed out — check Render logs');
      else toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  const pushAssignment = async () => {
    if (!pushForm.subject || !pushForm.title || !pushForm.dueDate)
      return toast.error('Subject, title and due date required');
    setPushing(true);
    try {
      const res = await API.post('/admin/push-assignment', pushForm, { timeout: 30000 });
      toast.success(res.data.message);
      setPushForm({ subject:'', title:'', description:'', dueDate:'', priority:'medium' });
      setShowPushForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to push assignment');
    } finally { setPushing(false); }
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Controls</h1>
        <p className="text-slate-500 text-sm mt-1">Control what users receive in their daily emails</p>
      </div>

      {/* Daily message */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Mail size={16} className="text-indigo-500" /> Daily Message to All Users</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Custom Message <span className="text-slate-400">(shown at top of every email)</span></label>
          <textarea className="input resize-none h-24" placeholder="e.g. Great work this week everyone! Remember to complete your lab reports before Friday. 💪"
            value={settings.dailyMessage || ''} onChange={e => set('dailyMessage', e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">Leave empty to hide this section from emails.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Custom Email Subject Line <span className="text-slate-400">(optional)</span></label>
          <input className="input" placeholder="e.g. 📚 Good Morning {{name}}! Your plan for {{day}}"
            value={settings.customSubject || ''} onChange={e => set('customSubject', e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> and <code className="bg-slate-100 px-1 rounded">{'{{day}}'}</code> as placeholders.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Footer Text</label>
          <input className="input" placeholder="Keep going! Every line of code counts. 💜"
            value={settings.footerText || ''} onChange={e => set('footerText', e.target.value)} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Section toggles */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2"><ToggleRight size={16} className="text-indigo-500" /> Email Sections</h2>
        <p className="text-xs text-slate-400 mb-3">Toggle which sections appear in every daily email</p>
        <Toggle value={settings.showStreak}      onChange={v => set('showStreak', v)}      label="Streak & Stats"    desc="Shows day streak, total hours, daily target" />
        <Toggle value={settings.showTasks}       onChange={v => set('showTasks', v)}       label="Today's Tasks"     desc="User's tasks for today" />
        <Toggle value={settings.showDSA}         onChange={v => set('showDSA', v)}         label="DSA Challenge"     desc="Question of the day" />
        <Toggle value={settings.showRoadmap}     onChange={v => set('showRoadmap', v)}     label="Roadmap Topic"     desc="Next AI/ML or DE topic to study" />
        <Toggle value={settings.showAssignments} onChange={v => set('showAssignments', v)} label="Upcoming Assignments" desc="Assignments due within 3 days" />
        <div className="pt-3">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Toggles'}
          </button>
        </div>
      </div>

      {/* Push assignment to all users */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><CalendarClock size={16} className="text-indigo-500" /> Push Assignment to All Users</h2>
          <button onClick={() => setShowPushForm(p => !p)} className="btn-secondary text-sm">
            {showPushForm ? 'Cancel' : 'New Assignment'}
          </button>
        </div>

        {showPushForm && (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                <select className="input" value={pushForm.subject} onChange={e => setPushForm(p => ({ ...p, subject: e.target.value }))}>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Due Date *</label>
                <input type="date" className="input" value={pushForm.dueDate} onChange={e => setPushForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input className="input" placeholder="e.g. Lab Report 2 — BFS & DFS" value={pushForm.title} onChange={e => setPushForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea className="input resize-none h-16" placeholder="Assignment details…" value={pushForm.description} onChange={e => setPushForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select className="input" value={pushForm.priority} onChange={e => setPushForm(p => ({ ...p, priority: e.target.value }))}>
                <option>low</option><option>medium</option><option>high</option>
              </select>
            </div>
            <div className="tip tip-blue rounded-lg p-3 bg-blue-50 text-blue-700 text-xs">
              This will add this assignment to every user's College page and send an email reminder to users with notifications enabled.
            </div>
            <button onClick={pushAssignment} disabled={pushing} className="btn-primary w-full flex items-center justify-center gap-2">
              <Send size={15} /> {pushing ? 'Pushing…' : 'Push to All Users + Send Email'}
            </button>
          </div>
        )}
      </div>

      {/* Trigger manual email */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Send size={16} className="text-indigo-500" /> Manual Email Trigger</h2>
        <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 mb-3">
          <p className="font-medium text-slate-800 mb-1">Automatic Schedule (Nepal Time)</p>
          <p>🌅 <strong>7:00 AM</strong> — Daily study plan email</p>
          <p>🌆 <strong>6:00 PM</strong> — Assignment due-tomorrow reminders</p>
          <p>🌙 <strong>12:00 AM</strong> — Streak reset + study hours reset</p>
        </div>
        <button onClick={triggerDailyEmail} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
          <Mail size={15} /> {sending ? 'Sending…' : 'Trigger Daily Email Now (All Users)'}
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">Only sends to users with email reminders enabled</p>
      </div>
    </div>
  );
}
