import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Flame, Clock, CheckCircle, Target, BookOpen, TrendingUp, Circle } from 'lucide-react';

const today    = new Date().toISOString().slice(0, 10);
const dayName  = new Date().toLocaleDateString('en-US', { weekday:'long' });
const TYPE_COLORS = {
  aiml:'bg-purple-100 text-purple-700', de:'bg-teal-100 text-teal-700',
  college:'bg-blue-100 text-blue-700',  dsa:'bg-orange-100 text-orange-700',
  project:'bg-green-100 text-green-700', general:'bg-slate-100 text-slate-600',
};

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoursInput, setHoursInput]   = useState('');
  const [loggingHours, setLoggingHours] = useState(false);

  useEffect(() => {
    API.get(`/tasks?date=${today}`)
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = async (task) => {
    try {
      const res = await API.put(`/tasks/${task._id}`, { completed: !task.completed });
      setTasks(p => p.map(t => t._id === task._id ? res.data : t));
    } catch { toast.error('Failed to update task'); }
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
  const progressPct    = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const targetPct      = user?.studyTarget
    ? Math.min(Math.round((user.todayStudyHours / user.studyTarget) * 100), 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{dayName} — keep the streak alive</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Flame,      color:'bg-orange-100 text-orange-500', value: user?.streak||0,                              label:'Day streak' },
          { icon: Clock,      color:'bg-indigo-100 text-indigo-500', value: (user?.todayStudyHours||0).toFixed(1),        label:'Hours today' },
          { icon: CheckCircle,color:'bg-green-100 text-green-500',   value: `${completedCount}/${tasks.length}`,          label:'Tasks done' },
          { icon: TrendingUp, color:'bg-purple-100 text-purple-500', value: Math.round(user?.totalStudyHours||0),         label:'Total hours' },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Task list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Today's Progress</span>
              <span className="text-sm text-slate-500">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width:`${progressPct}%` }} />
            </div>
            {progressPct === 100 && tasks.length > 0 && (
              <p className="text-xs text-green-600 mt-2 font-medium">🎉 All tasks completed! Great work today.</p>
            )}
          </div>

          {/* Tasks — view only, tick to complete */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Today's Tasks</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Admin assigns tasks</span>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm">No tasks for today yet.</p>
                <p className="text-slate-300 text-xs mt-1">Your admin will push tasks soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                    onClick={() => toggleTask(task)}>
                    <div className="mt-0.5 flex-shrink-0">
                      {task.completed
                        ? <CheckCircle size={20} className="text-green-500" />
                        : <Circle size={20} className="text-slate-300 hover:text-indigo-400 transition-colors" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type] || TYPE_COLORS.general}`}>
                          {task.type}
                        </span>
                        {task.priority === 'high' && <span className="text-xs text-red-500 font-medium">High priority</span>}
                      </div>
                    </div>
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
              <input type="number" min="0.5" max="12" step="0.5" className="input"
                placeholder="e.g. 1.5" value={hoursInput} onChange={e => setHoursInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logHours()} />
              <button onClick={logHours} disabled={loggingHours} className="btn-primary text-sm whitespace-nowrap">Log</button>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width:`${targetPct}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(user?.todayStudyHours||0).toFixed(1)} / {user?.studyTarget||2} hr target
            </p>
          </div>

          {/* Roadmap phase */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><BookOpen size={16} /> Roadmap Phase</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">AI/ML</span>
                <span className="font-medium text-indigo-600">Phase {(user?.aimlPhase||0)+1}/6</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width:`${(((user?.aimlPhase||0)+1)/6)*100}%` }} />
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">Data Eng</span>
                <span className="font-medium text-teal-600">Phase {(user?.dePhase||0)+1}/6</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width:`${(((user?.dePhase||0)+1)/6)*100}%` }} />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-orange-500" />
              <span className="font-semibold text-orange-900">Study Streak</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{user?.streak||0} days</p>
            <p className="text-xs text-orange-500 mt-1">Best: {user?.longestStreak||0} days — keep going! 💪</p>
          </div>
        </div>
      </div>
    </div>
  );
}
