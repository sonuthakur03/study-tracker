import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export default function Subjects() {
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState({});

  useEffect(() => {
    API.get('/subjects')
      .then(r => {
        setSubjects(r.data);
        // Auto-expand all subjects by default
        const exp = {};
        r.data.forEach(s => { exp[s._id] = true; });
        setExpanded(exp);
      })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  const toggleTopic = async (subjId, topicId) => {
    try {
      const res = await API.post(`/subjects/${subjId}/topics/${topicId}/toggle`);
      setSubjects(prev => prev.map(s => {
        if (s._id !== subjId) return s;
        return {
          ...s,
          topics: s.topics.map(t =>
            t._id === topicId ? { ...t, completed: res.data.completed } : t
          ),
        };
      }));
    } catch { toast.error('Failed to update'); }
  };

  const toggleExpand = (id) =>
    setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Overall stats
  const totalTopics     = subjects.reduce((a, s) => a + s.topics.length, 0);
  const completedTopics = subjects.reduce((a, s) => a + s.topics.filter(t => t.completed).length, 0);
  const overallPct      = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tick off topics as you study them — track your syllabus coverage
        </p>
      </div>

      {/* Overall progress */}
      {subjects.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 text-sm">Overall Syllabus Progress</span>
            <span className="font-bold text-indigo-600">{completedTopics}/{totalTopics} topics</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-indigo-500 h-2.5 rounded-full transition-all"
              style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {overallPct}% complete across {subjects.length} subjects
          </p>
        </div>
      )}

      {/* Subject cards */}
      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No subjects yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Your admin hasn't added any subjects yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subj => {
            const done     = subj.topics.filter(t => t.completed).length;
            const total    = subj.topics.length;
            const pct      = total ? Math.round((done / total) * 100) : 0;
            const isOpen   = expanded[subj._id];
            const allDone  = done === total && total > 0;

            return (
              <div key={subj._id}
                className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">

                {/* Subject header */}
                <button
                  onClick={() => toggleExpand(subj._id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: subj.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{subj.name}</span>
                      {subj.code && (
                        <span className="text-xs text-slate-400 font-mono">{subj.code}</span>
                      )}
                      {allDone && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          ✅ Complete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-28 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: subj.color }} />
                      </div>
                      <span className="text-xs text-slate-400">{done}/{total} topics</span>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
                    : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </button>

                {/* Topics list */}
                {isOpen && (
                  <div className="border-t border-slate-50 px-4 pb-3 pt-2">
                    {subj.description && (
                      <p className="text-xs text-slate-400 italic mb-3">{subj.description}</p>
                    )}
                    {subj.topics.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">No topics yet</p>
                    ) : (
                      <div className="space-y-0.5">
                        {subj.topics
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map(topic => (
                            <div
                              key={topic._id}
                              onClick={() => toggleTopic(subj._id, topic._id)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer
                                hover:bg-slate-50 transition-colors group
                                ${topic.completed ? 'opacity-60' : ''}`}>
                              <div className="mt-0.5 flex-shrink-0">
                                {topic.completed
                                  ? <CheckCircle size={16} style={{ color: subj.color }} />
                                  : <Circle size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />}
                              </div>
                              <p className={`text-sm leading-relaxed ${
                                topic.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-700'
                              }`}>
                                {topic.title}
                              </p>
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
