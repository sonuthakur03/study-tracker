import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ExternalLink, Lock, Search, ChevronDown, ChevronUp } from 'lucide-react';

const DIFF_COLORS = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
const DIFF_BAR    = { Easy: 'bg-green-500', Medium: 'bg-yellow-500', Hard: 'bg-red-500' };

export default function DSATracker() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState({});
  const [viewMode, setViewMode]   = useState('sequential');

  useEffect(() => {
    API.get('/dsa')
      .then(r => {
        const sorted = [...r.data].sort((a, b) => (a.dayNumber || 999) - (b.dayNumber || 999));
        setQuestions(sorted);
      })
      .catch(() => toast.error('Failed to load DSA questions'))
      .finally(() => setLoading(false));
  }, []);

  const isLocked = (index) => index > 0 && !questions[index - 1]?.completed;

  const toggle = async (q, index) => {
    if (isLocked(index)) {
      toast.error(`Complete Day ${questions[index - 1]?.dayNumber || index} first!`);
      return;
    }
    if (q.completed && questions[index + 1]?.completed) {
      toast.error("Can't unmark — next question is already completed");
      return;
    }
    try {
      const res = await API.post(`/dsa/${q._id}/toggle`);
      setQuestions(p => p.map(x => x._id === q._id ? { ...x, completed: res.data.completed } : x));
      if (res.data.completed) toast.success('Nice work! Next problem unlocked 🔓');
    } catch { toast.error('Failed to update'); }
  };

  const total     = questions.length;
  const completed = questions.filter(q => q.completed).length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;
  const nextUp    = questions.find((q, i) => !q.completed && !isLocked(i));
  const byDiff    = (d) => ({ total: questions.filter(q => q.difficulty === d).length, done: questions.filter(q => q.difficulty === d && q.completed).length });
  const easy = byDiff('Easy'), medium = byDiff('Medium'), hard = byDiff('Hard');

  const byTopic = questions.reduce((acc, q, i) => {
    if (!acc[q.topic]) acc[q.topic] = [];
    acc[q.topic].push({ ...q, _index: i });
    return acc;
  }, {});

  const filtered = questions.filter(q =>
    !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">DSA Tracker</h1>
        <p className="text-slate-500 text-sm mt-1">Complete in order — each problem unlocks the next 🔓</p>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-slate-900">Overall Progress</span>
          <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
          <div className="bg-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[['Easy', easy, 'text-green-600'], ['Medium', medium, 'text-yellow-600'], ['Hard', hard, 'text-red-600']].map(([label, stat, cls]) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold ${cls}`}>{stat.done}/{stat.total}</p>
              <p className="text-xs text-slate-500">{label}</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                <div className={`${DIFF_BAR[label]} h-1.5 rounded-full transition-all`} style={{ width: `${stat.total ? (stat.done / stat.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Next up banner */}
        {nextUp && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {nextUp.dayNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Up Next</p>
              <p className="text-sm font-semibold text-indigo-900 truncate">{nextUp.title}</p>
              <p className="text-xs text-indigo-500 mt-0.5">{nextUp.topic} · {nextUp.difficulty}</p>
            </div>
            {nextUp.resourceUrl && (
              <a href={nextUp.resourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                Solve <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
        {completed === total && total > 0 && (
          <div className="text-center py-3 bg-green-50 rounded-xl border border-green-100 mt-3">
            <p className="text-green-700 font-semibold">🎉 All {total} problems completed! You are a DSA champion.</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-44">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search problems…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {[['sequential','In Order'], ['topic','By Topic']].map(([key, label]) => (
            <button key={key} onClick={() => { setViewMode(key); setSearch(''); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === key ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading questions…</div>
      ) : (
        <>
          {/* SEQUENTIAL VIEW */}
          {viewMode === 'sequential' && !search && (
            <div className="space-y-2">
              {questions.map((q, i) => {
                const locked  = isLocked(i);
                const current = !q.completed && !locked;
                return (
                  <div key={q._id} onClick={() => toggle(q, i)}
                    className={`card flex items-center gap-4 py-3.5 transition-all select-none
                      ${locked    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : 'cursor-pointer'}
                      ${current   ? 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300 hover:shadow-sm' : ''}
                      ${q.completed && !locked ? 'hover:opacity-80' : ''}
                    `}>

                    <div className="flex-shrink-0">
                      {locked
                        ? <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Lock size={11} className="text-slate-400" /></div>
                        : q.completed
                          ? <CheckCircle size={22} className="text-green-500" />
                          : <Circle size={22} className={current ? 'text-indigo-400' : 'text-slate-300'} />}
                    </div>

                    <div className={`text-xs font-mono w-10 flex-shrink-0 font-semibold ${current ? 'text-indigo-500' : 'text-slate-400'}`}>
                      Day {q.dayNumber || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium ${q.completed ? 'line-through text-slate-400' : locked ? 'text-slate-400' : 'text-slate-900'}`}>
                          {q.title}
                        </p>
                        <span className={DIFF_COLORS[q.difficulty]}>{q.difficulty}</span>
                        {current && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Current</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{q.topic}</span>
                        <span className="text-xs text-slate-400">{q.platform}</span>
                      </div>
                      {locked && (
                        <p className="text-xs text-slate-400 mt-1">
                          🔒 Finish <span className="font-medium">Day {questions[i-1]?.dayNumber}</span> to unlock
                        </p>
                      )}
                      {!locked && q.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{q.description}</p>
                      )}
                    </div>

                    {!locked && q.resourceUrl && (
                      <a href={q.resourceUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex-shrink-0 text-indigo-400 hover:text-indigo-600 transition-colors p-1">
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TOPIC VIEW or SEARCH */}
          {(viewMode === 'topic' || search) && (
            <div className="space-y-3">
              {search ? (
                <div className="space-y-2">
                  {filtered.length === 0 && <p className="text-center text-slate-400 py-8">No results for "{search}"</p>}
                  {filtered.map(q => {
                    const i      = questions.findIndex(x => x._id === q._id);
                    const locked = isLocked(i);
                    return (
                      <div key={q._id} onClick={() => toggle(q, i)}
                        className={`card flex items-center gap-3 py-3 cursor-pointer hover:shadow-sm transition-all ${locked ? 'opacity-50' : ''}`}>
                        <div className="flex-shrink-0">
                          {locked ? <Lock size={18} className="text-slate-300" />
                            : q.completed ? <CheckCircle size={20} className="text-green-500" />
                            : <Circle size={20} className="text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${q.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{q.title}</span>
                            <span className={DIFF_COLORS[q.difficulty]}>{q.difficulty}</span>
                          </div>
                          <span className="text-xs text-slate-400">{q.topic}{locked ? ' · 🔒 Locked' : ''}</span>
                        </div>
                        {!locked && q.resourceUrl && (
                          <a href={q.resourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="text-indigo-400 hover:text-indigo-600 flex-shrink-0"><ExternalLink size={15} /></a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                Object.entries(byTopic).map(([topic, qs]) => {
                  const doneTopic = qs.filter(q => q.completed).length;
                  const isOpen    = expanded[topic] !== false;
                  return (
                    <div key={topic} className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                      <button onClick={() => setExpanded(p => ({ ...p, [topic]: !isOpen }))}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${qs.length ? (doneTopic / qs.length) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{doneTopic}/{qs.length}</span>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-50 divide-y divide-slate-50">
                          {qs.map(q => {
                            const locked = isLocked(q._index);
                            return (
                              <div key={q._id} onClick={() => toggle(q, q._index)}
                                className={`flex items-center gap-3 px-4 py-3 transition-colors
                                  ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                                <div className="flex-shrink-0">
                                  {locked ? <Lock size={15} className="text-slate-300" />
                                    : q.completed ? <CheckCircle size={18} className="text-green-500" />
                                    : <Circle size={18} className="text-slate-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-slate-400 font-mono">Day {q.dayNumber}</span>
                                    <span className={`text-sm font-medium ${q.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{q.title}</span>
                                    <span className={DIFF_COLORS[q.difficulty]}>{q.difficulty}</span>
                                  </div>
                                </div>
                                {!locked && q.resourceUrl && (
                                  <a href={q.resourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                    className="text-indigo-400 hover:text-indigo-600 flex-shrink-0"><ExternalLink size={14} /></a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
