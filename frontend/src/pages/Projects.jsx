import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Github, ExternalLink, Trash2, Edit3, X, Check } from 'lucide-react';

const STATUS_CONFIG = {
  idea:        { label: 'Idea',        color: 'bg-slate-100 text-slate-600' },
  'in-progress':{ label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
  paused:      { label: 'Paused',      color: 'bg-yellow-100 text-yellow-700' },
};
const TYPE_CONFIG = {
  aiml:     { label: 'AI/ML',           color: 'bg-purple-100 text-purple-700' },
  de:       { label: 'Data Eng',        color: 'bg-teal-100 text-teal-700' },
  college:  { label: 'College Project', color: 'bg-blue-100 text-blue-700' },
  personal: { label: 'Personal',        color: 'bg-slate-100 text-slate-600' },
};

const EMPTY = { title:'', description:'', status:'idea', type:'personal', githubUrl:'', liveUrl:'', techStack:'', notes:'' };

export default function Projects() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    API.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ ...p, techStack: (p.techStack || []).join(', ') });
    setEditId(p._id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Project title required');
    setSaving(true);
    try {
      const payload = { ...form, techStack: form.techStack ? form.techStack.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (editId) {
        const res = await API.put(`/projects/${editId}`, payload);
        setProjects(p => p.map(x => x._id === editId ? res.data : x));
        toast.success('Project updated');
      } else {
        const res = await API.post('/projects', payload);
        setProjects(p => [res.data, ...p]);
        toast.success('Project added! 🚀');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save project'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const byStatus = (s) => projects.filter(p => p.status === s);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Track your learning projects and portfolio</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className="card text-center py-3">
            <p className="text-xl font-bold text-slate-900">{byStatus(k).length}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.color}`}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg text-slate-900">{editId ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title *</label>
                <input className="input" placeholder="e.g. Movie Recommender System" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea className="input resize-none h-20" placeholder="What does this project do?" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                    {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                    {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack (comma separated)</label>
                <input className="input" placeholder="Python, FastAPI, PostgreSQL, React" value={form.techStack} onChange={e => set('techStack', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                <input className="input" placeholder="https://github.com/user/repo" value={form.githubUrl} onChange={e => set('githubUrl', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Live URL</label>
                <input className="input" placeholder="https://myproject.vercel.app" value={form.liveUrl} onChange={e => set('liveUrl', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea className="input resize-none h-16" placeholder="Any notes or todos for this project…" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Project'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Project cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No projects yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first project — it could be your minor project too!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{project.title}</h3>
                  {project.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => openEdit(project)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => remove(project._id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[project.status]?.color}`}>
                  {STATUS_CONFIG[project.status]?.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[project.type]?.color}`}>
                  {TYPE_CONFIG[project.type]?.label}
                </span>
              </div>

              {project.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.techStack.map((t, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              {project.notes && <p className="text-xs text-slate-400 italic mb-3 line-clamp-1">{project.notes}</p>}

              <div className="flex gap-3 pt-2 border-t border-slate-50">
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
                    <Github size={13} /> GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                    <ExternalLink size={13} /> Live demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
