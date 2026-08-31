import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, X } from 'lucide-react';

const EMPTY_DSA = {
  title: '',
  difficulty: 'Easy',
  topic: '',
  description: '',
  resourceUrl: '',
  platform: 'LeetCode',
  dayNumber: '',
  hints: '',
  solution: '',
};

export default function ManageDSA() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_DSA);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/dsa')
      .then((r) => setQuestions(r.data))
      .catch(() => toast.error('Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setForm(EMPTY_DSA);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (q) => {
    setForm({ ...q, hints: (q.hints || []).join(', ') });
    setEditId(q._id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.topic) return toast.error('Title and topic required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        dayNumber: Number(form.dayNumber) || undefined,
        hints: form.hints
          ? form.hints
              .split(',')
              .map((h) => h.trim())
              .filter(Boolean)
          : [],
      };
      if (editId) {
        const res = await API.put(`/dsa/${editId}`, payload);
        setQuestions((p) => p.map((x) => (x._id === editId ? res.data : x)));
        toast.success('Question updated');
      } else {
        const res = await API.post('/dsa', payload);
        setQuestions((p) => [...p, res.data]);
        toast.success('Question added');
      }
      setShowForm(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await API.delete(`/dsa/${id}`);
      setQuestions((p) => p.filter((x) => x._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const DIFF_CLS = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage DSA Questions</h1>
          <p className="text-slate-500 text-sm">{questions.length} questions total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Question
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{editId ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['title', 'Title *', 'text'],
                ['topic', 'Topic *', 'text'],
                ['description', 'Description', 'text'],
                ['resourceUrl', 'Resource URL', 'url'],
                ['solution', 'Solution Notes', 'text'],
              ].map(([k, label, type]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    className="input"
                    type={type}
                    value={form[k] || ''}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
                  <select
                    className="input"
                    value={form.difficulty}
                    onChange={(e) => set('difficulty', e.target.value)}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Platform</label>
                  <select
                    className="input"
                    value={form.platform}
                    onChange={(e) => set('platform', e.target.value)}
                  >
                    {['LeetCode', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'Other'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Day #</label>
                  <input
                    type="number"
                    className="input"
                    value={form.dayNumber || ''}
                    onChange={(e) => set('dayNumber', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hints (comma separated)</label>
                <input
                  className="input"
                  value={form.hints || ''}
                  onChange={(e) => set('hints', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : editId ? 'Save' : 'Add Question'}
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
          {questions.map((q) => (
            <div key={q._id} className="card flex items-center gap-4 py-3">
              <div className="text-xs text-slate-400 font-mono w-10 flex-shrink-0">
                Day {q.dayNumber || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800">{q.title}</span>
                  <span className={DIFF_CLS[q.difficulty]}>{q.difficulty}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {q.topic} · {q.platform}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(q)}
                  className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => remove(q._id)}
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
