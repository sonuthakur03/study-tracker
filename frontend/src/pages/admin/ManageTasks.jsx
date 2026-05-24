import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Send, Calendar, CheckSquare, Clock } from 'lucide-react';

const TASK_TYPES     = ['general','aiml','de','college','dsa','project'];
const PRIORITIES     = ['low','medium','high'];
const DAYS           = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TYPE_COLORS    = { aiml:'bg-purple-100 text-purple-700', de:'bg-teal-100 text-teal-700', college:'bg-blue-100 text-blue-700', dsa:'bg-orange-100 text-orange-700', project:'bg-green-100 text-green-700', general:'bg-slate-100 text-slate-600' };
const PRIORITY_COLORS = { high:'text-red-500', medium:'text-yellow-500', low:'text-slate-400' };

const today = new Date().toISOString().slice(0, 10);

const EMPTY_TASK = { title:'', type:'general', priority:'medium', date: today, description:'' };
const EMPTY_SCHED = { day:'Monday', subject:'', startTime:'09:00', endTime:'10:00', room:'', type:'lecture' };

export default function ManageTasks() {
  const [tab, setTab]           = useState('tasks');
  const [tasks, setTasks]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [schedForm, setSchedForm] = useState(EMPTY_SCHED);
  const [selectedUser, setSelectedUser] = useState('all');
  const [pushing, setPushing]   = useState(false);
  const [filterDate, setFilterDate] = useState(today);

  useEffect(() => {
    Promise.all([
      API.get('/admin/users'),
      API.get('/admin/subjects'),
    ]).then(([u, s]) => {
      setUsers(u.data);
      setSubjects(s.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'tasks') fetchTasks();
  }, [tab, filterDate, selectedUser]);

  const fetchTasks = async () => {
    try {
      // Admin fetches tasks for a specific user by date
      if (selectedUser === 'all') {
        // Fetch for all users — aggregate
        const results = await Promise.all(
          users.map(u => API.get(`/tasks?date=${filterDate}`).catch(() => ({ data: [] })))
        );
        // Just show count info since we can't easily query all users tasks from user route
        // We'll show a simple push form instead
        setTasks([]);
      } else {
        const res = await API.get(`/tasks?date=${filterDate}`);
        setTasks(res.data);
      }
    } catch { /* silent */ }
  };

  const pushTask = async () => {
    if (!taskForm.title.trim()) return toast.error('Task title required');
    setPushing(true);
    try {
      const payload = selectedUser === 'all'
        ? { ...taskForm, pushToAll: true }
        : { ...taskForm, userId: selectedUser };
      const res = await API.post('/tasks', payload);
      toast.success(typeof res.data.message === 'string' ? res.data.message : 'Task pushed!');
      setTaskForm(EMPTY_TASK);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to push task'); }
    finally { setPushing(false); }
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(p => p.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const pushSchedule = async () => {
    if (!schedForm.subject.trim()) return toast.error('Subject required');
    setPushing(true);
    try {
      const payload = selectedUser === 'all'
        ? { ...schedForm, pushToAll: true }
        : { ...schedForm, userId: selectedUser };
      const res = await API.post('/college/schedule', payload);
      toast.success(typeof res.data.message === 'string' ? res.data.message : 'Schedule added!');
      setSchedForm(EMPTY_SCHED);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add schedule'); }
    finally { setPushing(false); }
  };

  const setT = (k, v) => setTaskForm(p => ({ ...p, [k]: v }));
  const setS = (k, v) => setSchedForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="text-center py-12 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Tasks & Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">Push tasks and class schedules to users</p>
      </div>

      {/* Target user selector */}
      <div className="card">
        <p className="text-sm font-medium text-slate-700 mb-2">Push to</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedUser('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedUser === 'all' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
            All Users
          </button>
          {users.filter(u => u.role !== 'admin').map(u => (
            <button key={u._id} onClick={() => setSelectedUser(u._id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedUser === u._id ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
              {u.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100">
        {[['tasks','Tasks', CheckSquare],['schedule','Class Schedule', Calendar]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {/* Push task form */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Send size={15} className="text-indigo-500" /> Push Task</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Task Title *</label>
              <input className="input" placeholder="e.g. Watch Andrew Ng Lecture 3 — Gradient Descent"
                value={taskForm.title} onChange={e => setT('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && pushTask()} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select className="input" value={taskForm.type} onChange={e => setT('type', e.target.value)}>
                  {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <select className="input" value={taskForm.priority} onChange={e => setT('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" className="input" value={taskForm.date} onChange={e => setT('date', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description <span className="text-slate-400">(optional)</span></label>
              <input className="input" placeholder="Extra details…" value={taskForm.description} onChange={e => setT('description', e.target.value)} />
            </div>
            <button onClick={pushTask} disabled={pushing} className="btn-primary flex items-center gap-2">
              <Send size={14} /> {pushing ? 'Pushing…' : `Push to ${selectedUser === 'all' ? 'All Users' : users.find(u => u._id === selectedUser)?.name}`}
            </button>
          </div>

          {/* Quick push common tasks */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Push — Common Tasks</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { title: 'Review today\'s class notes', type: 'college' },
                { title: 'Complete daily DSA problem', type: 'dsa' },
                { title: 'Watch AI/ML lecture', type: 'aiml' },
                { title: 'Push code to GitHub', type: 'project' },
                { title: 'Study for upcoming exam', type: 'college' },
                { title: 'Practice SQL problems on LeetCode', type: 'de' },
              ].map(qt => (
                <button key={qt.title}
                  onClick={() => { setTaskForm(p => ({ ...p, title: qt.title, type: qt.type })); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors text-slate-600">
                  {qt.title}
                </button>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
            <p className="font-medium mb-1">How it works</p>
            <p className="text-indigo-600 text-xs">Tasks you push appear on the selected user's Dashboard under the specified date. Users can only mark tasks complete — they cannot add or delete tasks. Use "All Users" to push the same task to everyone at once.</p>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Calendar size={15} className="text-indigo-500" /> Add Class to Schedule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
                <select className="input" value={schedForm.day} onChange={e => setS('day', e.target.value)}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <input className="input" list="sched-subjects" placeholder="Artificial Intelligence"
                  value={schedForm.subject} onChange={e => setS('subject', e.target.value)} />
                <datalist id="sched-subjects">
                  {subjects.map(s => <option key={s._id} value={s.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                <input type="time" className="input" value={schedForm.startTime} onChange={e => setS('startTime', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                <input type="time" className="input" value={schedForm.endTime} onChange={e => setS('endTime', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Room</label>
                <input className="input" placeholder="Room 101" value={schedForm.room} onChange={e => setS('room', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select className="input" value={schedForm.type} onChange={e => setS('type', e.target.value)}>
                  <option>lecture</option><option>lab</option><option>tutorial</option>
                </select>
              </div>
            </div>
            <button onClick={pushSchedule} disabled={pushing} className="btn-primary flex items-center gap-2">
              <Send size={14} /> {pushing ? 'Adding…' : `Add to ${selectedUser === 'all' ? 'All Users' : users.find(u => u._id === selectedUser)?.name + "'s"} Schedule`}
            </button>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
            <p className="font-medium mb-1">How it works</p>
            <p className="text-indigo-600 text-xs">Schedule entries you add appear on the College page for the selected users. Use "All Users" to push the full class timetable to everyone at once. To delete a schedule entry, use the College page while logged in — or add a delete endpoint here if needed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
