import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

const EMPTY_TOPIC = {
  path: 'aiml',
  phase: 1,
  phaseTitle: '',
  title: '',
  description: '',
  weekTarget: '',
  tags: '',
  resources: '',
};

export default function ManageRoadmap() {
  const [topics, setTopics] = useState([]);
  const [path, setPath] = useState('aiml');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_TOPIC);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTopics = () => {
    setLoading(true);
    API.get(`/roadmap?path=${path}`)
      .then((r) => setTopics(r.data))
      .catch(() => toast.error('Failed to load roadmap'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTopics();
  }, [path]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setForm({ ...EMPTY_TOPIC, path });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({
      ...t,
      resources: JSON.stringify(t.resources || []),
      tags: (t.tags || []).join(', '),
    });
    setEditId(t._id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.phaseTitle) {
      return toast.error('Title and phase title required');
    }
    setSaving(true);
    try {
      let resources = [];
      try {
        resources = JSON.parse(form.resources || '[]');
      } catch {
        resources = [];
      }
      const payload = {
        ...form,
        phase: Number(form.phase),
        order: Number(form.order || 0),
        resources,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      if (editId) {
        const res = await API.put(`/roadmap/${editId}`, payload);
        setTopics((p) => p.map((x) => (x._id === editId ? res.data : x)));
        toast.success('Topic updated');
      } else {
        const res = await API.post('/roadmap', payload);
        setTopics((p) => [...p, res.data]);
        toast.success('Topic added');
      }
      setShowForm(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this roadmap topic?')) return;
    try {
      await API.delete(`/roadmap/${id}`);
      setTopics((p) => p.filter((x) => x._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Roadmap</h1>
          <p className="text-slate-500 text-sm">
            {topics.length} topics in {path.toUpperCase()} path
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            {['aiml', 'de'].map((p) => (
              <button
                key={p}
                onClick={() => setPath(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  path === p
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Topic
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{editId ? 'Edit Topic' : 'Add Topic'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Path</label>
                  <select
                    className="input"
                    value={form.path}
                    onChange={(e) => set('path', e.target.value)}
                  >
                    <option value="aiml">AI/ML</option>
                    <option value="de">Data Eng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phase</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="input"
                    value={form.phase}
                    onChange={(e) => set('phase', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={form.order || ''}
                    onChange={(e) => set('order', e.target.value)}
                  />
                </div>
              </div>
              {[
                ['phaseTitle', 'Phase Title (e.g. Python Fundamentals)'],
                ['title', 'Topic Title *'],
                ['description', 'Description'],
                ['weekTarget', 'Week Target (e.g. Weeks 1-6)'],
                ['tags', 'Tags (comma separated)'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    className="input"
                    value={form[k] || ''}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resources (JSON array)</label>
                <textarea
                  className="input resize-none h-20 font-mono text-xs"
                  placeholder='[{"name":"Course name","url":"https://...","type":"course"}]'
                  value={form.resources || ''}
                  onChange={(e) => set('resources', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editId ? 'Save' : 'Add Topic'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <div key={t._id} className="card flex items-center gap-4 py-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {t.phase}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-xs text-slate-400 truncate">
                  {t.phaseTitle} · {t.weekTarget}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => remove(t._id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
