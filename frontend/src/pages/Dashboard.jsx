import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Flame, Clock, CheckCircle, Target, Plus, Trash2, BookOpen, TrendingUp, Bell } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);
const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

const TASK_TYPES = ['general', 'aiml', 'de', 'college', 'dsa', 'project'];
const TYPE_COLORS = { aiml:'bg-purple-100 text-purple-700', de:'bg-teal-100 text-teal-700', college:'bg-blue-100 text-blue-700', dsa:'bg-orange-100 text-orange-700', project:'bg-green-100 text-green-700', general:'bg-slate-100 text-slate-600' };

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', type: 'general', priority: 'medium' });
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [hoursInput, setHoursInput] = useState('');
  const [loggingHours, setLoggingHours] = useState(false);

  useEffect(() => {
    API.get(`/tasks?date=${today}`)
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    setAdding(true);
    try {
      const res = await API.post('/tasks', { ...newTask, date: today });
      setTasks(p => [res.data, ...p]);
      setNewTask({ title: '', type: 'general', priority: 'medium' });
      setShowAdd(false);
      toast.success('Task added');
    } catch { toast.error('Failed to add task'); }
    finally { setAdding(false); }
  };

  const toggleTask = async (task) => {
    try {
      const res = await API.put(`/tasks/${task._id}`, { completed: !task.completed });
      setTasks(p => p.map(t => t._id === task._id ? res.data : t));
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(p => p.filter(t => t._id !== id));
    } catch { toast.error('Failed to delete task'); }
  };

  const logHours = async () => {
    const h = parseFloat(hoursInput);
    if (!h || h <= 0) return toast.error('Enter valid hours');
    setLoggingHours(true);
    try {
      const res = await API.post('/auth/log-hours', { hours: h });
      updateUser(res.data.user);
      setHoursInput('');
      toast.success(`Logged ${h} hours! 🔥`);
    } catch { toast.error('Failed to log hours'); }
    finally { setLoggingHours(false); }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const targetPct = user?.studyTarget ? Math.min(Math.round((user.todayStudyHours / user.studyTarget) * 100), 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{dayName} — keep the streak alive</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Flame size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{user?.streak || 0}</p>
            <p className="text-xs text-slate-500">Day streak</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{user?.todayStudyHours?.toFixed(1) || '0'}</p>
            <p className="text-xs text-slate-500">Hours today</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{completedCount}/{tasks.length}</p>
            <p className="text-xs text-slate-500">Tasks done</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{Math.round(user?.totalStudyHours || 0)}</p>
            <p className="text-xs text-slate-500">Total hours</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-3">
          {/* Progress bar */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Today's Progress</span>
              <span className="text-sm text-slate-500">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {progressPct === 100 && <p className="text-xs text-green-600 mt-2 font-medium">🎉 All tasks completed! Great work today.</p>}
          </div>

          {/* Task list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Today's Tasks</h2>
              <button onClick={() => setShowAdd(p => !p)} className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3">
                <Plus size={14} /> Add task
              </button>
            </div>

            {/* Add task form */}
            {showAdd && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <input className="input" placeholder="Task title…" value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
                <div className="flex gap-2">
                  <select className="input flex-1" value={newTask.type} onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))}>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="input flex-1" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addTask} disabled={adding} className="btn-primary text-sm">
                    {adding ? 'Adding…' : 'Add'}
                  </button>
                  <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
            ) : tasks.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No tasks yet — add your first task for today!</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <button onClick={() => toggleTask(task)} className="mt-0.5 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-indigo-400'}`}>
                        {task.completed && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type] || TYPE_COLORS.general}`}>{task.type}</span>
                        {task.priority === 'high' && <span className="text-xs text-red-500 font-medium">High priority</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteTask(task._id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Log hours */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Clock size={16} /> Log Study Hours</h3>
            <div className="flex gap-2 mb-3">
              <input type="number" min="0.5" max="12" step="0.5" className="input" placeholder="e.g. 1.5"
                value={hoursInput} onChange={e => setHoursInput(e.target.value)} />
              <button onClick={logHours} disabled={loggingHours} className="btn-primary text-sm whitespace-nowrap">Log</button>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${targetPct}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">{user?.todayStudyHours?.toFixed(1) || 0} / {user?.studyTarget || 2} hr target</p>
          </div>

          {/* Roadmap phase */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><BookOpen size={16} /> Roadmap Phase</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">AI/ML</span>
                <span className="font-medium text-indigo-600">Phase {(user?.aimlPhase || 0) + 1}/6</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(((user?.aimlPhase || 0) + 1) / 6) * 100}%` }} />
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">Data Eng</span>
                <span className="font-medium text-teal-600">Phase {(user?.dePhase || 0) + 1}/6</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${(((user?.dePhase || 0) + 1) / 6) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Streak info */}
          <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-orange-500" />
              <span className="font-semibold text-orange-900">Study Streak</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{user?.streak || 0} days</p>
            <p className="text-xs text-orange-600 mt-1">Best: {user?.longestStreak || 0} days — keep going! 💪</p>
          </div>
        </div>
      </div>
    </div>
  );
}
