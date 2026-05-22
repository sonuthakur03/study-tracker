import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ExternalLink, ChevronDown, ChevronUp, BookOpen, Database } from 'lucide-react';

const PHASE_COLORS = ['bg-violet-500','bg-teal-500','bg-amber-500','bg-indigo-500','bg-rose-500','bg-sky-500'];
const PHASE_LIGHT  = ['bg-violet-50 border-violet-100','bg-teal-50 border-teal-100','bg-amber-50 border-amber-100','bg-indigo-50 border-indigo-100','bg-rose-50 border-rose-100','bg-sky-50 border-sky-100'];
const PHASE_TEXT   = ['text-violet-700','text-teal-700','text-amber-700','text-indigo-700','text-rose-700','text-sky-700'];

export default function Roadmap() {
  const [topics, setTopics]   = useState([]);
  const [path, setPath]       = useState('aiml');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchTopics = async (p) => {
    setLoading(true);
    try {
      const r = await API.get(`/roadmap?path=${p}`);
      setTopics(r.data);
    } catch { toast.error('Failed to load roadmap'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTopics(path); }, [path]);

  const toggle = async (topic) => {
    try {
      const res = await API.post(`/roadmap/${topic._id}/toggle`);
      setTopics(p => p.map(t => t._id === topic._id ? { ...t, completed: res.data.completed } : t));
      toast.success(res.data.completed ? 'Topic completed! ✅' : 'Marked incomplete');
    } catch { toast.error('Failed to update'); }
  };

  const toggleExpand = (phase) => setExpanded(p => ({ ...p, [phase]: !p[phase] }));

  // Group by phase
  const phases = topics.reduce((acc, t) => {
    const key = `${t.phase}-${t.phaseTitle}`;
    if (!acc[key]) acc[key] = { phase: t.phase, title: t.phaseTitle, topics: [] };
    acc[key].topics.push(t);
    return acc;
  }, {});

  const totalTopics     = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;
  const pct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learning Roadmap</h1>
        <p className="text-slate-500 text-sm mt-1">Track your progress through every topic</p>
      </div>

      {/* Path selector */}
      <div className="flex gap-3">
        <button onClick={() => setPath('aiml')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all ${path === 'aiml' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
          <BookOpen size={16} /> AI / ML Path
        </button>
        <button onClick={() => setPath('de')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all ${path === 'de' ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
          <Database size={16} /> Data Engineering Path
        </button>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-slate-900">{path === 'aiml' ? 'AI/ML' : 'Data Engineering'} Progress</span>
          <span className="text-indigo-600 font-bold">{completedTopics}/{totalTopics} topics</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${path === 'aiml' ? 'bg-indigo-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{pct}% complete · ~{Math.max(0, totalTopics - completedTopics)} topics remaining</p>
      </div>

      {/* Phases */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading roadmap…</div>
      ) : (
        <div className="space-y-3">
          {Object.values(phases).map((group) => {
            const phaseIdx = group.phase - 1;
            const isOpen = expanded[group.phase] !== false; // default open
            const doneInPhase = group.topics.filter(t => t.completed).length;
            const phasePct = Math.round((doneInPhase / group.topics.length) * 100);
            const allDone = doneInPhase === group.topics.length;

            return (
              <div key={group.phase} className={`rounded-xl border ${PHASE_LIGHT[phaseIdx % 6]} overflow-hidden`}>
                <button onClick={() => toggleExpand(group.phase)} className="w-full flex items-center gap-3 p-4 text-left hover:opacity-90 transition-opacity">
                  <div className={`w-8 h-8 rounded-lg ${PHASE_COLORS[phaseIdx % 6]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {group.phase}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${PHASE_TEXT[phaseIdx % 6]}`}>{group.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white/60 rounded-full h-1.5 max-w-32">
                        <div className={`${PHASE_COLORS[phaseIdx % 6]} h-1.5 rounded-full`} style={{ width: `${phasePct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{doneInPhase}/{group.topics.length}</span>
                      {allDone && <span className="text-xs text-green-600 font-semibold">✅ Complete</span>}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {group.topics.map(topic => (
                      <div key={topic._id} className="bg-white rounded-xl border border-white/80 p-3 flex items-start gap-3 shadow-sm">
                        <button onClick={() => toggle(topic)} className="mt-0.5 flex-shrink-0">
                          {topic.completed
                            ? <CheckCircle size={20} className={path === 'aiml' ? 'text-indigo-500' : 'text-teal-500'} />
                            : <Circle size={20} className="text-slate-300 hover:text-slate-500 transition-colors" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${topic.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{topic.title}</p>
                          {topic.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{topic.description}</p>}
                          {topic.weekTarget && <p className="text-xs text-slate-400 mt-1">{topic.weekTarget}</p>}
                          {topic.resources?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {topic.resources.map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors">
                                  <ExternalLink size={10} /> {r.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
