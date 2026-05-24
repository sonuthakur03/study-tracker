import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#64748B'];
const SEMESTERS = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];
const EMPTY = { name:'', code:'', semester:'5th', color:'#6366F1', description:'' };

export default function ManageSubjects() {
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState({});
  const [newTopic, setNewTopic]   = useState({});

  useEffect(() => {
    API.get('/admin/subjects')
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return toast.error('Subject name required');
    setSaving(true);
    try {
      if (editId) {
        const res = await API.put(`/admin/subjects/${editId}`, form);
        setSubjects(p => p.map(s => s._id === editId ? res.data : s));
        toast.success('Subject updated');
      } else {
        const res = await API.post('/admin/subjects', form);
        setSubjects(p => [...p, res.data]);
        toast.success('Subject added');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this subject? All users will lose it from their dropdowns.')) return;
    try {
      await API.delete(`/admin/subjects/${id}`);
      setSubjects(p => p.filter(s => s._id !== id));
      toast.success('Subject deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code||'', semester: s.semester||'5th', color: s.color||'#6366F1', description: s.description||'' });
    setEditId(s._id); setShowForm(true);
  };

  const addTopic = async (subjId) => {
    const title = (newTopic[subjId] || '').trim();
    if (!title) return;
    try {
      const res = await API.post(`/admin/subjects/${subjId}/topics`, { title });
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
      setNewTopic(p => ({ ...p, [subjId]: '' }));
    } catch { toast.error('Failed to add topic'); }
  };

  const deleteTopic = async (subjId, topicId) => {
    try {
      const res = await API.delete(`/admin/subjects/${subjId}/topics/${topicId}`);
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
    } catch { toast.error('Failed to delete topic'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Subjects</h1>
          <p className="text-slate-500 text-sm mt-1">Global subjects visible to all users in their assignment dropdown</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(p => !p); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editId ? 'Edit Subject' : 'New Subject'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject Name *</label>
              <input className="input" placeholder="e.g. Artificial Intelligence" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
              <input className="input" placeholder="CSC-351" value={form.code} onChange={e => set('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
              <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)}>
                {SEMESTERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input className="input" placeholder="Short description (optional)" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: c }}>
                  {form.color === c && <Check size={13} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : editId ? 'Save' : 'Add Subject'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Subject list */}
      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : subjects.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="font-medium">No subjects yet</p>
          <p className="text-sm mt-1">Add subjects here — they'll appear in users' assignment dropdowns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(s => {
            const isOpen = expanded[s._id] !== false;
            return (
              <div key={s._id} className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                  onClick={() => setExpanded(p => ({ ...p, [s._id]: !isOpen }))}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{s.name}</span>
                      {s.code && <span className="text-xs text-slate-400 font-mono">{s.code}</span>}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s.semester} sem</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{s.topics.length} topics</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => remove(s._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-slate-50 px-4 pb-4 pt-2">
                    {s.description && <p className="text-sm text-slate-500 mb-3">{s.description}</p>}
                    <div className="flex gap-2 mb-3">
                      <input className="input text-sm flex-1" placeholder="Add topic (e.g. A* Search Algorithm)…"
                        value={newTopic[s._id] || ''}
                        onChange={e => setNewTopic(p => ({ ...p, [s._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addTopic(s._id)} />
                      <button onClick={() => addTopic(s._id)}
                        className="px-3 py-2 rounded-lg text-white text-sm font-medium flex-shrink-0"
                        style={{ background: s.color }}>
                        <Plus size={16} />
                      </button>
                    </div>
                    {s.topics.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No topics yet</p>
                    ) : (
                      <div className="space-y-1">
                        {s.topics.map(t => (
                          <div key={t._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            <span className="flex-1 text-sm text-slate-700">{t.title}</span>
                            <button onClick={() => deleteTopic(s._id, t._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
