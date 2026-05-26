import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X, Check, ChevronDown, ChevronUp, ExternalLink, Link } from 'lucide-react';

const COLORS    = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#64748B'];
const SEMESTERS = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];
const RES_TYPES = ['video','notes','website','book','practice'];
const LANGUAGES = ['Hindi','Nepali','English','Other'];
const LANG_FLAG = { Hindi:'🇮🇳', Nepali:'🇳🇵', English:'🇬🇧', Other:'🌐' };
const TYPE_ICON = { video:'▶', notes:'📄', website:'🌐', book:'📚', practice:'💻' };
const EMPTY_SUBJ = { name:'', code:'', semester:'5th', color:'#6366F1', description:'' };
const EMPTY_RES  = { name:'', url:'', resourceType:'video', language:'Hindi' };

export default function ManageSubjects() {
  const [subjects, setSubjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_SUBJ);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [expanded, setExpanded]     = useState({});
  const [activeTab, setActiveTab]   = useState({}); // 'topics' | 'resources' per subject
  const [newTopic, setNewTopic]     = useState({});
  const [newRes, setNewRes]         = useState({});
  const [showResForm, setShowResForm] = useState({});

  useEffect(() => {
    API.get('/admin/subjects')
      .then(r => {
        setSubjects(r.data);
        const tabs = {};
        r.data.forEach(s => { tabs[s._id] = 'topics'; });
        setActiveTab(tabs);
      })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Subject CRUD ────────────────────────────────────────────────────────────
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
        setActiveTab(p => ({ ...p, [res.data._id]: 'topics' }));
        toast.success('Subject added');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_SUBJ);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this subject and all its topics & resources?')) return;
    try {
      await API.delete(`/admin/subjects/${id}`);
      setSubjects(p => p.filter(s => s._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (s) => {
    setForm({ name:s.name, code:s.code||'', semester:s.semester||'5th', color:s.color||'#6366F1', description:s.description||'' });
    setEditId(s._id); setShowForm(true);
  };

  // ── Topics ──────────────────────────────────────────────────────────────────
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

  // ── Resources ───────────────────────────────────────────────────────────────
  const addResource = async (subjId) => {
    const r = newRes[subjId] || EMPTY_RES;
    if (!r.name?.trim() || !r.url?.trim()) return toast.error('Name and URL required');
    if (!r.url.startsWith('http')) return toast.error('URL must start with http:// or https://');
    try {
      const res = await API.post(`/admin/subjects/${subjId}/resources`, r);
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
      setNewRes(p => ({ ...p, [subjId]: { ...EMPTY_RES } }));
      setShowResForm(p => ({ ...p, [subjId]: false }));
      toast.success('Resource added');
    } catch { toast.error('Failed to add resource'); }
  };

  const deleteResource = async (subjId, resId) => {
    try {
      const res = await API.delete(`/admin/subjects/${subjId}/resources/${resId}`);
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
    } catch { toast.error('Failed to delete resource'); }
  };

  const setRes = (subjId, k, v) =>
    setNewRes(p => ({ ...p, [subjId]: { ...(p[subjId] || EMPTY_RES), [k]: v } }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Subjects</h1>
          <p className="text-slate-500 text-sm mt-1">Add subjects, topics and study resources for users</p>
        </div>
        <button onClick={() => { setForm(EMPTY_SUBJ); setEditId(null); setShowForm(p => !p); }}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Subject form */}
      {showForm && (
        <div className="card border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editId ? 'Edit Subject' : 'New Subject'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject Name *</label>
              <input className="input" placeholder="e.g. Computer Networking" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
              <input className="input" placeholder="CACS303" value={form.code} onChange={e => set('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
              <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)}>
                {SEMESTERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input className="input" placeholder="Short description…" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
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
      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div>
        : subjects.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="font-medium">No subjects yet</p>
            <p className="text-sm mt-1">Add subjects — they appear on users' Subjects page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map(s => {
              const isOpen  = expanded[s._id];
              const curTab  = activeTab[s._id] || 'topics';
              return (
                <div key={s._id} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">

                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [s._id]: !isOpen }))}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        {s.code && <span className="text-xs text-slate-400 font-mono">{s.code}</span>}
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s.semester} sem</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.topics.length} topics · {s.resources.length} resources
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => remove(s._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      <button onClick={() => setExpanded(p => ({ ...p, [s._id]: !isOpen }))} className="p-1.5 text-slate-400">
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-50">
                      {/* Tab switcher */}
                      <div className="flex border-b border-slate-100">
                        {['topics','resources'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(p => ({ ...p, [s._id]: tab }))}
                            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                              curTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}>
                            {tab === 'topics' ? `📝 Topics (${s.topics.length})` : `🔗 Resources (${s.resources.length})`}
                          </button>
                        ))}
                      </div>

                      {/* TOPICS TAB */}
                      {curTab === 'topics' && (
                        <div className="px-4 pb-4 pt-3">
                          <div className="flex gap-2 mb-3">
                            <input className="input text-sm flex-1"
                              placeholder="Add topic (e.g. Unit 1: Introduction to Networking)…"
                              value={newTopic[s._id] || ''}
                              onChange={e => setNewTopic(p => ({ ...p, [s._id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && addTopic(s._id)} />
                            <button onClick={() => addTopic(s._id)}
                              className="px-3 py-2 rounded-lg text-white flex-shrink-0"
                              style={{ background: s.color }}>
                              <Plus size={16} />
                            </button>
                          </div>
                          {s.topics.length === 0
                            ? <p className="text-xs text-slate-400 text-center py-2">No topics yet</p>
                            : <div className="space-y-1 max-h-60 overflow-y-auto">
                                {s.topics.map(t => (
                                  <div key={t._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                    <span className="flex-1 text-sm text-slate-700 leading-relaxed">{t.title}</span>
                                    <button onClick={() => deleteTopic(s._id, t._id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                          }
                        </div>
                      )}

                      {/* RESOURCES TAB */}
                      {curTab === 'resources' && (
                        <div className="px-4 pb-4 pt-3">
                          {/* Existing resources */}
                          {s.resources.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {s.resources.map(r => (
                                <div key={r._id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg group">
                                  <span className="text-base flex-shrink-0">{TYPE_ICON[r.resourceType]}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded-full text-slate-500">
                                        {LANG_FLAG[r.language]} {r.language}
                                      </span>
                                      <span className="text-xs text-slate-400 capitalize">{r.resourceType}</span>
                                    </div>
                                  </div>
                                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 text-indigo-400 hover:text-indigo-600 flex-shrink-0">
                                    <ExternalLink size={14} />
                                  </a>
                                  <button onClick={() => deleteResource(s._id, r._id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-400 transition-all">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add resource form toggle */}
                          {!showResForm[s._id] ? (
                            <button onClick={() => setShowResForm(p => ({ ...p, [s._id]: true }))}
                              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                              <Plus size={14} /> Add Resource
                            </button>
                          ) : (
                            <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <input className="input text-sm" placeholder="Resource name (e.g. Gate Smashers - OSI Model)"
                                value={(newRes[s._id] || EMPTY_RES).name}
                                onChange={e => setRes(s._id, 'name', e.target.value)} autoFocus />
                              <input className="input text-sm" placeholder="https://youtube.com/..."
                                value={(newRes[s._id] || EMPTY_RES).url}
                                onChange={e => setRes(s._id, 'url', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addResource(s._id)} />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Language</label>
                                  <select className="input text-sm"
                                    value={(newRes[s._id] || EMPTY_RES).language}
                                    onChange={e => setRes(s._id, 'language', e.target.value)}>
                                    {LANGUAGES.map(l => (
                                      <option key={l} value={l}>{LANG_FLAG[l]} {l}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                                  <select className="input text-sm"
                                    value={(newRes[s._id] || EMPTY_RES).resourceType}
                                    onChange={e => setRes(s._id, 'resourceType', e.target.value)}>
                                    {RES_TYPES.map(t => (
                                      <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => addResource(s._id)} className="btn-primary text-sm flex-1">Add</button>
                                <button onClick={() => setShowResForm(p => ({ ...p, [s._id]: false }))} className="btn-secondary text-sm">Cancel</button>
                              </div>
                            </div>
                          )}

                          {s.resources.length === 0 && !showResForm[s._id] && (
                            <p className="text-xs text-slate-400 text-center mt-2">
                              No resources yet — add YouTube links, notes, websites
                            </p>
                          )}
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
