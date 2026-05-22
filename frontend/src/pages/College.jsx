import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle, Circle, AlertTriangle, Calendar, Clock, X } from 'lucide-react';
import { format, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT = { Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',Thursday:'Thu',Friday:'Fri',Saturday:'Sat',Sunday:'Sun' };
const TODAY_DAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const SUBJECTS_BCA5 = ['Artificial Intelligence','Data Warehousing & Data Mining','Distributed System','Internet & Intranet','Minor Project','Elective'];

export default function College() {
  const [schedule, setSchedule]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab]               = useState('schedule');
  const [loading, setLoading]       = useState(true);
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [schedForm, setSchedForm] = useState({ day:'Monday', subject:'', startTime:'09:00', endTime:'10:00', room:'', teacher:'', type:'lecture' });
  const [assignForm, setAssignForm] = useState({ subject:'', title:'', description:'', dueDate:'', priority:'medium' });

  useEffect(() => {
    Promise.all([
      API.get('/college/schedule'),
      API.get('/college/assignments'),
    ]).then(([s, a]) => {
      setSchedule(s.data);
      setAssignments(a.data);
    }).catch(() => toast.error('Failed to load college data'))
      .finally(() => setLoading(false));
  }, []);

  // Schedule
  const addSchedule = async () => {
    if (!schedForm.subject.trim()) return toast.error('Subject required');
    try {
      const res = await API.post('/college/schedule', schedForm);
      setSchedule(p => [...p, res.data]);
      setShowSchedForm(false);
      toast.success('Class added');
    } catch { toast.error('Failed to add class'); }
  };

  const deleteSchedule = async (id) => {
    try {
      await API.delete(`/college/schedule/${id}`);
      setSchedule(p => p.filter(x => x._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  // Assignments
  const addAssignment = async () => {
    if (!assignForm.subject.trim() || !assignForm.title.trim() || !assignForm.dueDate)
      return toast.error('Subject, title and due date are required');
    try {
      const res = await API.post('/college/assignments', assignForm);
      setAssignments(p => [...p, res.data]);
      setShowAssignForm(false);
      setAssignForm({ subject:'', title:'', description:'', dueDate:'', priority:'medium' });
      toast.success('Assignment added');
    } catch { toast.error('Failed to add assignment'); }
  };

  const toggleAssignment = async (a) => {
    try {
      const res = await API.put(`/college/assignments/${a._id}`, { completed: !a.completed });
      setAssignments(p => p.map(x => x._id === a._id ? res.data : x));
    } catch { toast.error('Failed to update'); }
  };

  const deleteAssignment = async (id) => {
    try {
      await API.delete(`/college/assignments/${id}`);
      setAssignments(p => p.filter(x => x._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const getDueLabel = (date) => {
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) return { label: 'Overdue!', cls: 'text-red-600 font-bold' };
    if (isToday(d)) return { label: 'Due today!', cls: 'text-red-500 font-semibold' };
    if (isTomorrow(d)) return { label: 'Due tomorrow', cls: 'text-orange-500 font-medium' };
    const days = differenceInDays(d, new Date());
    return { label: `${days} days left`, cls: days <= 3 ? 'text-yellow-600' : 'text-slate-500' };
  };

  const schedByDay = DAYS.reduce((acc, d) => {
    acc[d] = schedule.filter(s => s.day === d).sort((a,b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const pendingAssignments = assignments.filter(a => !a.completed);
  const doneAssignments    = assignments.filter(a => a.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">College — BCA 5th Sem</h1>
        <p className="text-slate-500 text-sm mt-1">Timetable, assignments & semester goals at Tribhuvan University</p>
      </div>

      {/* BCA 5th sem subjects quick ref */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <p className="text-sm font-semibold text-indigo-800 mb-2">📚 BCA 5th Sem — TU Subjects</p>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS_BCA5.map(s => (
            <span key={s} className="text-xs bg-white text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
          ))}
        </div>
        <p className="text-xs text-indigo-500 mt-2">⚠ Verify with your official TU notice board — syllabus may vary by batch.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {['schedule','assignments'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t} {t === 'assignments' && pendingAssignments.length > 0 && <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{pendingAssignments.length}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
        <>
          {/* SCHEDULE TAB */}
          {tab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowSchedForm(p => !p)} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Add Class
                </button>
              </div>

              {showSchedForm && (
                <div className="card border-indigo-100 space-y-3">
                  <h3 className="font-semibold text-slate-900">Add New Class</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
                      <select className="input" value={schedForm.day} onChange={e => setSchedForm(p => ({ ...p, day: e.target.value }))}>
                        {DAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                      <input className="input" list="subjects" placeholder="Artificial Intelligence" value={schedForm.subject}
                        onChange={e => setSchedForm(p => ({ ...p, subject: e.target.value }))} />
                      <datalist id="subjects">{SUBJECTS_BCA5.map(s => <option key={s} value={s} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                      <input type="time" className="input" value={schedForm.startTime} onChange={e => setSchedForm(p => ({ ...p, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                      <input type="time" className="input" value={schedForm.endTime} onChange={e => setSchedForm(p => ({ ...p, endTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Room</label>
                      <input className="input" placeholder="Room 101" value={schedForm.room} onChange={e => setSchedForm(p => ({ ...p, room: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                      <select className="input" value={schedForm.type} onChange={e => setSchedForm(p => ({ ...p, type: e.target.value }))}>
                        <option>lecture</option><option>lab</option><option>tutorial</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addSchedule} className="btn-primary text-sm">Add Class</button>
                    <button onClick={() => setShowSchedForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Weekly timetable */}
              <div className="space-y-3">
                {DAYS.filter(d => d !== 'Sunday').map(day => {
                  const classes = schedByDay[day];
                  const isToday = day === TODAY_DAY;
                  return (
                    <div key={day} className={`rounded-xl border ${isToday ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'} overflow-hidden`}>
                      <div className={`px-4 py-2 flex items-center gap-2 border-b ${isToday ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-700'}`}>{day}</span>
                        {isToday && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Today</span>}
                        <span className={`text-xs ml-auto ${isToday ? 'text-indigo-100' : 'text-slate-400'}`}>{classes.length} class{classes.length !== 1 ? 'es' : ''}</span>
                      </div>
                      {classes.length === 0 ? (
                        <p className="text-xs text-slate-400 px-4 py-3">No classes — add some above</p>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {classes.map(c => (
                            <div key={c._id} className="flex items-center gap-3 px-4 py-2.5">
                              <div className="text-xs text-slate-500 font-mono w-24 flex-shrink-0">{c.startTime}–{c.endTime}</div>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-slate-800">{c.subject}</span>
                                {c.room && <span className="text-xs text-slate-400 ml-2">{c.room}</span>}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'lab' ? 'bg-green-100 text-green-700' : c.type === 'tutorial' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{c.type}</span>
                              <button onClick={() => deleteSchedule(c._id)} className="text-slate-300 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ASSIGNMENTS TAB */}
          {tab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAssignForm(p => !p)} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Add Assignment
                </button>
              </div>

              {showAssignForm && (
                <div className="card border-indigo-100 space-y-3">
                  <h3 className="font-semibold text-slate-900">Add Assignment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                      <input className="input" list="asgn-subjects" placeholder="Artificial Intelligence" value={assignForm.subject}
                        onChange={e => setAssignForm(p => ({ ...p, subject: e.target.value }))} />
                      <datalist id="asgn-subjects">{SUBJECTS_BCA5.map(s => <option key={s} value={s} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                      <input className="input" placeholder="Lab report / Assignment 2" value={assignForm.title}
                        onChange={e => setAssignForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
                      <input type="date" className="input" value={assignForm.dueDate}
                        onChange={e => setAssignForm(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                      <select className="input" value={assignForm.priority} onChange={e => setAssignForm(p => ({ ...p, priority: e.target.value }))}>
                        <option>low</option><option>medium</option><option>high</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea className="input resize-none h-16" placeholder="Details…" value={assignForm.description}
                      onChange={e => setAssignForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addAssignment} className="btn-primary text-sm">Add Assignment</button>
                    <button onClick={() => setShowAssignForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Pending */}
              {pendingAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Pending ({pendingAssignments.length})</h3>
                  <div className="space-y-2">
                    {pendingAssignments.map(a => {
                      const due = getDueLabel(a.dueDate);
                      return (
                        <div key={a._id} className="card flex items-start gap-3 py-3.5">
                          <button onClick={() => toggleAssignment(a)} className="mt-0.5 flex-shrink-0">
                            <Circle size={20} className="text-slate-300 hover:text-green-400 transition-colors" />
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900">{a.title}</span>
                              {a.priority === 'high' && <AlertTriangle size={13} className="text-red-500" />}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{a.subject}</p>
                            {a.description && <p className="text-xs text-slate-400 mt-1">{a.description}</p>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-xs ${due.cls}`}>{due.label}</span>
                              <span className="text-xs text-slate-400">{format(new Date(a.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteAssignment(a._id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed */}
              {doneAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Completed ({doneAssignments.length})</h3>
                  <div className="space-y-2">
                    {doneAssignments.map(a => (
                      <div key={a._id} className="card flex items-center gap-3 py-3 opacity-60">
                        <button onClick={() => toggleAssignment(a)}>
                          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                        </button>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 line-through">{a.title}</p>
                          <p className="text-xs text-slate-400">{a.subject}</p>
                        </div>
                        <button onClick={() => deleteAssignment(a._id)} className="text-slate-200 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignments.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Calendar size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No assignments yet — add some to stay on track!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
