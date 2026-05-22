// ─── ManageDSA ────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

const EMPTY_DSA = { title:'', difficulty:'Easy', topic:'', description:'', resourceUrl:'', platform:'LeetCode', dayNumber:'', hints:'', solution:'' };
const EMPTY_TOPIC = { path:'aiml', phase:1, phaseTitle:'', title:'', description:'', weekTarget:'', tags:'', resources:'' };

export function ManageDSA() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_DSA);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    API.get('/dsa').then(r => setQuestions(r.data)).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY_DSA); setEditId(null); setShowForm(true); };
  const openEdit = (q) => { setForm({ ...q, hints: (q.hints||[]).join(', ') }); setEditId(q._id); setShowForm(true); };

  const save = async () => {
    if (!form.title || !form.topic) return toast.error('Title and topic required');
    setSaving(true);
    try {
      const payload = { ...form, dayNumber: Number(form.dayNumber) || undefined, hints: form.hints ? form.hints.split(',').map(h => h.trim()).filter(Boolean) : [] };
      if (editId) {
        const res = await API.put(`/dsa/${editId}`, payload);
        setQuestions(p => p.map(x => x._id === editId ? res.data : x));
        toast.success('Updated');
      } else {
        const res = await API.post('/dsa', payload);
        setQuestions(p => [...p, res.data]);
        toast.success('Question added');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await API.delete(`/dsa/${id}`); setQuestions(p => p.filter(x => x._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const DIFF_CLS = { Easy:'badge-easy', Medium:'badge-medium', Hard:'badge-hard' };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Manage DSA Questions</h1><p className="text-slate-500 text-sm">{questions.length} questions total</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Question</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{editId ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-3">
              {[['title','Title *','text'],['topic','Topic *','text'],['description','Description','text'],['resourceUrl','Resource URL','url'],['solution','Solution Notes','text']].map(([k,label,type]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input className="input" type={type} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
                  <select className="input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Platform</label>
                  <select className="input" value={form.platform} onChange={e => set('platform', e.target.value)}>
                    {['LeetCode','HackerRank','Codeforces','GeeksForGeeks','Other'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Day #</label>
                  <input type="number" className="input" value={form.dayNumber} onChange={e => set('dayNumber', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hints (comma separated)</label>
                <input className="input" value={form.hints} onChange={e => set('hints', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editId ? 'Save' : 'Add Question'}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q._id} className="card flex items-center gap-4 py-3">
              <div className="text-xs text-slate-400 font-mono w-10 flex-shrink-0">Day {q.dayNumber || '?'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800">{q.title}</span>
                  <span className={DIFF_CLS[q.difficulty]}>{q.difficulty}</span>
                </div>
                <span className="text-xs text-slate-400">{q.topic} · {q.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit3 size={15}/></button>
                <button onClick={() => remove(q._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ManageRoadmap ────────────────────────────────────────────────────────────
export function ManageRoadmap() {
  const [topics, setTopics]   = useState([]);
  const [path, setPath]       = useState('aiml');
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY_TOPIC);
  const [editId, setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);

  const fetch = () => {
    setLoading(true);
    API.get(`/roadmap?path=${path}`).then(r => setTopics(r.data)).finally(() => setLoading(false));
  };
  useEffect(fetch, [path]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm({ ...EMPTY_TOPIC, path }); setEditId(null); setShowForm(true); };
  const openEdit = (t) => { setForm({ ...t, resources: JSON.stringify(t.resources||[]), tags: (t.tags||[]).join(', ') }); setEditId(t._id); setShowForm(true); };

  const save = async () => {
    if (!form.title || !form.phaseTitle) return toast.error('Title and phase title required');
    setSaving(true);
    try {
      let resources = [];
      try { resources = JSON.parse(form.resources || '[]'); } catch { resources = []; }
      const payload = { ...form, phase: Number(form.phase), order: Number(form.order||0), resources, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (editId) {
        const res = await API.put(`/roadmap/${editId}`, payload);
        setTopics(p => p.map(x => x._id === editId ? res.data : x));
        toast.success('Updated');
      } else {
        const res = await API.post('/roadmap', payload);
        setTopics(p => [...p, res.data]);
        toast.success('Topic added');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/roadmap/${id}`); setTopics(p => p.filter(x => x._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Manage Roadmap</h1><p className="text-slate-500 text-sm">{topics.length} topics in {path} path</p></div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            {['aiml','de'].map(p => <button key={p} onClick={() => setPath(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${path===p?'bg-indigo-500 text-white border-indigo-500':'bg-white text-slate-600 border-slate-200'}`}>{p.toUpperCase()}</button>)}
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Topic</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{editId ? 'Edit Topic' : 'Add Topic'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Path</label>
                  <select className="input" value={form.path} onChange={e => set('path', e.target.value)}><option value="aiml">AI/ML</option><option value="de">Data Eng</option></select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phase</label>
                  <input type="number" min="1" max="6" className="input" value={form.phase} onChange={e => set('phase', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order</label>
                  <input type="number" min="1" className="input" value={form.order||''} onChange={e => set('order', e.target.value)} />
                </div>
              </div>
              {[['phaseTitle','Phase Title (e.g. Python Fundamentals)'],['title','Topic Title *'],['description','Description'],['weekTarget','Week Target (e.g. Weeks 1-6)'],['tags','Tags (comma separated)']].map(([k,label]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input className="input" value={form[k]||''} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resources (JSON array)</label>
                <textarea className="input resize-none h-20 font-mono text-xs" placeholder='[{"name":"Course name","url":"https://...","type":"course"}]' value={form.resources||''} onChange={e => set('resources', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editId ? 'Save' : 'Add Topic'}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t._id} className="card flex items-center gap-4 py-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{t.phase}</div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400">{t.phaseTitle} · {t.weekTarget}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit3 size={15}/></button>
                <button onClick={() => remove(t._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ManageUsers ──────────────────────────────────────────────────────────────
export function ManageUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleAdmin = async (user) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      const res = await API.put(`/admin/users/${user._id}`, { role: newRole });
      setUsers(p => p.map(u => u._id === user._id ? res.data : u));
      toast?.success(`${user.name} is now ${newRole}`);
    } catch { toast?.error('Failed to update'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await API.delete(`/admin/users/${id}`); setUsers(p => p.filter(u => u._id !== id)); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
      </div>
      <input className="input max-w-xs" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Streak</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAdmin(u)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${u.role==='admin' ? 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'}`}>
                        {u.role}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-orange-600 font-semibold">{u.streak}🔥</td>
                    <td className="px-4 py-3 text-indigo-600">{Math.round(u.totalStudyHours)}h</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(u._id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
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

export default ManageDSA;
