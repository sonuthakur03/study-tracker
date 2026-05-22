import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ExternalLink, Search, Filter } from 'lucide-react';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const DIFF_COLORS = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
const DIFF_BAR   = { Easy: 'bg-green-500', Medium: 'bg-yellow-500', Hard: 'bg-red-500' };

export default function DSATracker() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [diff, setDiff]           = useState('All');
  const [topic, setTopic]         = useState('All');

  useEffect(() => {
    API.get('/dsa')
      .then(r => setQuestions(r.data))
      .catch(() => toast.error('Failed to load DSA questions'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (q) => {
    try {
      const res = await API.post(`/dsa/${q._id}/toggle`);
      setQuestions(p => p.map(x => x._id === q._id ? { ...x, completed: res.data.completed } : x));
      toast.success(res.data.message);
    } catch { toast.error('Failed to update'); }
  };

  const topics = ['All', ...new Set(questions.map(q => q.topic))];

  const filtered = questions.filter(q => {
    const matchDiff  = diff  === 'All' || q.difficulty === diff;
    const matchTopic = topic === 'All' || q.topic === topic;
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchTopic && matchSearch;
  });

  const total     = questions.length;
  const completed = questions.filter(q => q.completed).length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  const byDiff = (d) => ({ total: questions.filter(q => q.difficulty === d).length, done: questions.filter(q => q.difficulty === d && q.completed).length });
  const easy   = byDiff('Easy');
  const medium = byDiff('Medium');
  const hard   = byDiff('Hard');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">DSA Tracker</h1>
        <p className="text-slate-500 text-sm mt-1">Daily coding practice — one problem at a time</p>
      </div>

      {/* Progress overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-slate-900">Overall Progress</span>
          <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
          <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Easy', easy, 'text-green-600'], ['Medium', medium, 'text-yellow-600'], ['Hard', hard, 'text-red-600']].map(([label, stat, cls]) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold ${cls}`}>{stat.done}/{stat.total}</p>
              <p className="text-xs text-slate-500">{label}</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                <div className={`${DIFF_BAR[label]} h-1.5 rounded-full`} style={{ width: `${stat.total ? (stat.done/stat.total)*100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${diff === d ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
              {d}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={topic} onChange={e => setTopic(e.target.value)}>
          {topics.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Question list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading questions…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No questions match your filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <div key={q._id} className={`card flex items-center gap-4 py-3.5 transition-all ${q.completed ? 'opacity-70' : ''}`}>
              <button onClick={() => toggle(q)} className="flex-shrink-0">
                {q.completed
                  ? <CheckCircle size={22} className="text-green-500" />
                  : <Circle size={22} className="text-slate-300 hover:text-indigo-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {q.dayNumber && <span className="text-xs text-slate-400 font-mono">Day {q.dayNumber}</span>}
                  <p className={`font-medium text-slate-900 ${q.completed ? 'line-through text-slate-400' : ''}`}>{q.title}</p>
                  <span className={DIFF_COLORS[q.difficulty]}>{q.difficulty}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{q.topic}</span>
                  <span className="text-xs text-slate-400">{q.platform}</span>
                </div>
                {q.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.description}</p>}
              </div>
              {q.resourceUrl && (
                <a href={q.resourceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-indigo-500 hover:text-indigo-700 transition-colors" title="Open problem">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
