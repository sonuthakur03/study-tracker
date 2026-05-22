import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, Edit3, X, Check, BookOpen } from 'lucide-react';

const COLORS = [
  { hex: '#6366F1', label: 'Indigo' },
  { hex: '#10B981', label: 'Green'  },
  { hex: '#F59E0B', label: 'Amber'  },
  { hex: '#EF4444', label: 'Red'    },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#06B6D4', label: 'Cyan'   },
  { hex: '#EC4899', label: 'Pink'   },
  { hex: '#64748B', label: 'Slate'  },
];

const PRESET_SUBJECTS = [
  { name: 'Artificial Intelligence',       code: 'CSC-351' },
  { name: 'Data Warehousing & Data Mining', code: 'CSC-352' },
  { name: 'Distributed System',            code: 'CSC-353' },
  { name: 'Internet & Intranet',           code: 'CSC-354' },
  { name: 'Minor Project',                 code: 'CSC-355' },
];

const EMPTY_SUBJ = { name: '', code: '', semester: '5th', color: '#6366F1' };

export default function Subjects() {
  const [subjects, setSubjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState({});
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [subjForm, setSubjForm]     = useState(EMPTY_SUBJ);
  const [editSubjId, setEditSubjId] = useState(null);
  const [savingSubj, setSavingSubj] = useState(false);
  const [newTopics, setNewTopics]   = useState({}); // { subjectId: inputValue }
  const [editTopic, setEditTopic]   = useState(null); // { subjId, topicId, title, notes }

  useEffect(() => {
    API.get('/subjects')
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  // ── Subject actions ────────────────────────────────────────────────────────

  const saveSubject = async () => {
    if (!subjForm.name.trim()) return toast.error('Subject name is required');
    setSavingSubj(true);
    try {
      if (editSubjId) {
        const res = await API.put(`/subjects/${editSubjId}`, subjForm);
        setSubjects(p => p.map(s => s._id === editSubjId ? res.data : s));
        toast.success('Subject updated');
      } else {
        const res = await API.post('/subjects', subjForm);
        setSubjects(p => [...p, res.data]);
        setExpanded(p => ({ ...p, [res.data._id]: true }));
        toast.success('Subject added');
      }
      setShowAddSubj(false);
      setEditSubjId(null);
      setSubjForm(EMPTY_SUBJ);
    } catch { toast.error('Failed to save subject'); }
    finally { setSavingSubj(false); }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject and all its topics?')) return;
    try {
      await API.delete(`/subjects/${id}`);
      setSubjects(p => p.filter(s => s._id !== id));
      toast.success('Subject deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEditSubj = (s) => {
    setSubjForm({ name: s.name, code: s.code || '', semester: s.semester || '5th', color: s.color || '#6366F1' });
    setEditSubjId(s._id);
    setShowAddSubj(true);
  };

  const usePreset = (p) => {
    setSubjForm(prev => ({ ...prev, name: p.name, code: p.code }));
  };

  // ── Topic actions ──────────────────────────────────────────────────────────

  const addTopic = async (subjId) => {
    const title = (newTopics[subjId] || '').trim();
    if (!title) return;
    try {
      const res = await API.post(`/subjects/${subjId}/topics`, { title });
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
      setNewTopics(p => ({ ...p, [subjId]: '' }));
    } catch { toast.error('Failed to add topic'); }
  };

  const toggleTopic = async (subjId, topicId, current) => {
    try {
      const res = await API.put(`/subjects/${subjId}/topics/${topicId}`, { completed: !current });
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
    } catch { toast.error('Failed to update'); }
  };

  const deleteTopic = async (subjId, topicId) => {
    try {
      const res = await API.delete(`/subjects/${subjId}/topics/${topicId}`);
      setSubjects(p => p.map(s => s._id === subjId ? res.data : s));
    } catch { toast.error('Failed to delete topic'); }
  };

  const saveTopicEdit = async () => {
    if (!editTopic) return;
    try {
      const res = await API.put(`/subjects/${editTopic.subjId}/topics/${editTopic.topicId}`, {
        title: editTopic.title,
        notes: editTopic.notes,
      });
      setSubjects(p => p.map(s => s._id === editTopic.subjId ? res.data : s));
      setEditTopic(null);
      toast.success('Topic updated');
    } catch { toast.error('Failed to update topic'); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalTopics     = subjects.reduce((a, s) => a + s.topics.length, 0);
  const completedTopics = subjects.reduce((a, s) => a + s.topics.filter(t => t.completed).length, 0);
  const overallPct      = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">College Subjects</h1>
          <p className="text-slate-500 text-sm mt-1">Add your subjects and track every topic</p>
        </div>
        <button
          onClick={() => { setSubjForm(EMPTY_SUBJ); setEditSubjId(null); setShowAddSubj(p => !p); }}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Overall progress */}
      {subjects.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 text-sm">Overall Syllabus Progress</span>
            <span className="font-bold text-indigo-600">{completedTopics}/{totalTopics} topics</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{overallPct}% complete across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Add / Edit subject form */}
      {showAddSubj && (
        <div className="card border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{editSubjId ? 'Edit Subject' : 'Add New Subject'}</h3>
            <button onClick={() => { setShowAddSubj(false); setEditSubjId(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {/* Presets — only show when adding */}
          {!editSubjId && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">BCA 5th Sem quick-fill:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SUBJECTS.map(p => (
                  <button key={p.code} onClick={() => usePreset(p)}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors text-slate-600">
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject Name *</label>
              <input className="input" placeholder="e.g. Artificial Intelligence"
                value={subjForm.name} onChange={e => setSubjForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject Code</label>
              <input className="input" placeholder="e.g. CSC-351"
                value={subjForm.code} onChange={e => setSubjForm(p => ({ ...p, code: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
              <select className="input" value={subjForm.semester} onChange={e => setSubjForm(p => ({ ...p, semester: e.target.value }))}>
                {['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c.hex} onClick={() => setSubjForm(p => ({ ...p, color: c.hex }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: c.hex }} title={c.label}>
                  {subjForm.color === c.hex && <Check size={13} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveSubject} disabled={savingSubj} className="btn-primary">
              {savingSubj ? 'Saving…' : editSubjId ? 'Save Changes' : 'Add Subject'}
            </button>
            <button onClick={() => { setShowAddSubj(false); setEditSubjId(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Subject list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading subjects…</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-indigo-400" />
          </div>
          <p className="text-slate-600 font-medium">No subjects yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your BCA subjects and track every topic in your syllabus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subj => {
            const done  = subj.topics.filter(t => t.completed).length;
            const total = subj.topics.length;
            const pct   = total ? Math.round((done / total) * 100) : 0;
            const isOpen = expanded[subj._id] !== false; // default open

            return (
              <div key={subj._id} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                {/* Subject header */}
                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                  onClick={() => setExpanded(p => ({ ...p, [subj._id]: !isOpen }))}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: subj.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{subj.name}</span>
                      {subj.code && <span className="text-xs text-slate-400 font-mono">{subj.code}</span>}
                      {subj.semester && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{subj.semester} sem</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: subj.color }} />
                      </div>
                      <span className="text-xs text-slate-400">{done}/{total} topics</span>
                      {pct === 100 && total > 0 && <span className="text-xs text-green-600 font-semibold">✅ Done!</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditSubj(subj)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteSubject(subj._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </div>

                {/* Topics */}
                {isOpen && (
                  <div className="border-t border-slate-50 px-4 pb-4 pt-2">
                    {/* Add topic input */}
                    <div className="flex gap-2 mb-3">
                      <input
                        className="input text-sm flex-1"
                        placeholder="Add a topic (e.g. A* Search Algorithm)…"
                        value={newTopics[subj._id] || ''}
                        onChange={e => setNewTopics(p => ({ ...p, [subj._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addTopic(subj._id)}
                      />
                      <button
                        onClick={() => addTopic(subj._id)}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                        style={{ background: subj.color }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Topic list */}
                    {subj.topics.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">No topics yet — type above and press Enter to add</p>
                    ) : (
                      <div className="space-y-1">
                        {subj.topics.map(topic => (
                          <div key={topic._id}>
                            {/* Normal view */}
                            {editTopic?.topicId !== topic._id ? (
                              <div className={`flex items-start gap-2.5 p-2 rounded-lg group hover:bg-slate-50 transition-colors ${topic.completed ? 'opacity-60' : ''}`}>
                                <button onClick={() => toggleTopic(subj._id, topic._id, topic.completed)} className="mt-0.5 flex-shrink-0">
                                  {topic.completed
                                    ? <CheckCircle size={17} style={{ color: subj.color }} />
                                    : <Circle size={17} className="text-slate-300 hover:text-slate-400 transition-colors" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${topic.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{topic.title}</p>
                                  {topic.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{topic.notes}</p>}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button onClick={() => setEditTopic({ subjId: subj._id, topicId: topic._id, title: topic.title, notes: topic.notes || '' })}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition-colors">
                                    <Edit3 size={12} />
                                  </button>
                                  <button onClick={() => deleteTopic(subj._id, topic._id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Edit mode */
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <input className="input text-sm" value={editTopic.title}
                                  onChange={e => setEditTopic(p => ({ ...p, title: e.target.value }))} autoFocus />
                                <input className="input text-sm" placeholder="Notes (optional)…" value={editTopic.notes}
                                  onChange={e => setEditTopic(p => ({ ...p, notes: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && saveTopicEdit()} />
                                <div className="flex gap-2">
                                  <button onClick={saveTopicEdit} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: subj.color }}>Save</button>
                                  <button onClick={() => setEditTopic(null)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</button>
                                </div>
                              </div>
                            )}
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
