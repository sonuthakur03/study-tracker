import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react';

const LANG_FLAG  = { Hindi:'🇮🇳', Nepali:'🇳🇵', English:'🇬🇧', Other:'🌐' };
const LANG_COLOR = {
  Hindi:   'bg-orange-50 text-orange-700 border-orange-100',
  Nepali:  'bg-red-50   text-red-700   border-red-100',
  English: 'bg-blue-50  text-blue-700  border-blue-100',
  Other:   'bg-slate-50 text-slate-600 border-slate-200',
};
const TYPE_ICON  = { video:'▶ Video', notes:'📄 Notes', website:'🌐 Website', book:'📚 Book', practice:'💻 Practice' };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState({}); // 'topics' | 'resources' per subject

  useEffect(() => {
    API.get('/subjects')
      .then(r => {
        setSubjects(r.data);
        const exp = {}, tabs = {};
        r.data.forEach(s => { exp[s._id] = true; tabs[s._id] = 'topics'; });
        setExpanded(exp);
        setActiveTab(tabs);
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
        <p className="text-slate-500 text-sm mt-1">Track your syllabus — tick topics as you study them</p>
      </div>

      {/* Overall progress */}
      {subjects.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 text-sm">Overall Syllabus Progress</span>
            <span className="font-bold text-indigo-600">{completedTopics}/{totalTopics} topics</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width:`${overallPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{overallPct}% complete across {subjects.length} subjects</p>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No subjects yet</p>
          <p className="text-slate-400 text-sm mt-1">Your admin hasn't added any subjects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subj => {
            const done    = subj.topics.filter(t => t.completed).length;
            const total   = subj.topics.length;
            const pct     = total ? Math.round((done / total) * 100) : 0;
            const isOpen  = expanded[subj._id];
            const curTab  = activeTab[subj._id] || 'topics';
            const allDone = done === total && total > 0;

            // Group resources by language
            const resByLang = (subj.resources || []).reduce((acc, r) => {
              if (!acc[r.language]) acc[r.language] = [];
              acc[r.language].push(r);
              return acc;
            }, {});

            return (
              <div key={subj._id} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">

                {/* Subject header */}
                <button onClick={() => setExpanded(p => ({ ...p, [subj._id]: !isOpen }))}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: subj.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{subj.name}</span>
                      {subj.code && <span className="text-xs text-slate-400 font-mono">{subj.code}</span>}
                      {allDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Complete</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`, background: subj.color }} />
                        </div>
                        <span className="text-xs text-slate-400">{done}/{total}</span>
                      </div>
                      {subj.resources?.length > 0 && (
                        <span className="text-xs text-slate-400">🔗 {subj.resources.length} resources</span>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
                           : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-50">
                    {/* Tab switcher — only show if there are resources */}
                    {subj.resources?.length > 0 && (
                      <div className="flex border-b border-slate-100">
                        {['topics','resources'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(p => ({ ...p, [subj._id]: tab }))}
                            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                              curTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}>
                            {tab === 'topics' ? `📝 Topics (${total})` : `🔗 Resources (${subj.resources.length})`}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TOPICS TAB */}
                    {curTab === 'topics' && (
                      <div className="px-4 pb-3 pt-2">
                        {subj.description && (
                          <p className="text-xs text-slate-400 italic mb-3">{subj.description}</p>
                        )}
                        {subj.topics.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-3">No topics yet</p>
                        ) : (
                          <div className="space-y-0.5">
                            {[...subj.topics]
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
                              .map(topic => (
                                <div key={topic._id}
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
                                    topic.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                  }`}>
                                    {topic.title}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* RESOURCES TAB */}
                    {curTab === 'resources' && (
                      <div className="px-4 pb-4 pt-3 space-y-4">
                        {Object.entries(resByLang).map(([lang, resources]) => (
                          <div key={lang}>
                            {/* Language header */}
                            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                              {LANG_FLAG[lang]} {lang}
                            </p>
                            <div className="space-y-2">
                              {resources.map(r => (
                                <a key={r._id} href={r.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100
                                    bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm
                                    transition-all group">
                                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base
                                    border ${LANG_COLOR[lang]}`}>
                                    {LANG_FLAG[lang]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                      {r.name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">{TYPE_ICON[r.resourceType]}</p>
                                  </div>
                                  <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />
                                </a>
                              ))}
                            </div>
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
