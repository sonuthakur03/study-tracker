import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  Video, Sparkles, CheckCircle, AlertTriangle, Calendar, List,
  ExternalLink, Plus, Edit3, Trash2, Clock, Film, Save, RefreshCw, X,
  FolderKanban, Link as LinkIcon, Settings, Users, CheckSquare, Play, HelpCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  idea:       { label: 'Idea',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  scripting:  { label: 'Scripting',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  generating: { label: 'Generating', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  editing:    { label: 'Editing',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ready:      { label: 'Ready',      color: 'bg-teal-100 text-teal-700 border-teal-200' },
  published:  { label: 'Published',  color: 'bg-green-100 text-green-700 border-green-200' },
};

const EMPTY_IDEA = {
  title: '',
  concept: '',
  targetClips: 15,
  status: 'idea',
  driveUrl: '',
  promptTemplate: '',
  notes: '',
};

export default function VideoPlanner() {
  const [data, setData] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'ideas'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [generalDrive, setGeneralDrive] = useState('');
  const [savingDrive, setSavingDrive] = useState(false);

  // Video Idea Modal State
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaForm, setIdeaForm] = useState(EMPTY_IDEA);
  const [editIdeaId, setEditIdeaId] = useState(null);
  const [savingIdea, setSavingIdea] = useState(false);

  // Day Details Modal State
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayNotes, setDayNotes] = useState('');
  const [dayDriveUrl, setDayDriveUrl] = useState('');
  const [savingDay, setSavingDay] = useState(false);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    accountsCount: 5,
    bonusCreditsPerAccount: 50,
    secondsPerClip: 8,
    creditsPerClip: 10,
    targetClipsPerVideo: 15,
    monthlyPoolTotal: 1000,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSummaryAndIdeas = async () => {
    try {
      const [summaryRes, ideasRes] = await Promise.all([
        API.get('/video-planner/summary'),
        API.get('/video-planner/ideas'),
      ]);
      setData(summaryRes.data);
      setGeneralDrive(summaryRes.data.generalDriveUrl || '');
      setIdeas(ideasRes.data);

      if (summaryRes.data.settings) {
        setSettingsForm({
          accountsCount: summaryRes.data.settings.accountsCount || 5,
          bonusCreditsPerAccount: summaryRes.data.settings.bonusCreditsPerAccount || 50,
          secondsPerClip: summaryRes.data.settings.secondsPerClip || 8,
          creditsPerClip: summaryRes.data.settings.creditsPerClip || 10,
          targetClipsPerVideo: summaryRes.data.settings.targetClipsPerVideo || 15,
          monthlyPoolTotal: summaryRes.data.monthlyPoolTotal || 1000,
        });
      }
    } catch {
      toast.error('Failed to load video planner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndIdeas();
  }, []);

  const toggleDayCompletion = async (dayDate) => {
    try {
      const res = await API.post('/video-planner/toggle-day', { date: dayDate });
      toast.success(res.data.message);
      fetchSummaryAndIdeas();
      if (selectedDay && selectedDay.date === dayDate) {
        setSelectedDay((p) => ({
          ...p,
          isCompleted: res.data.log.isCompleted,
          accountsCompleted: res.data.log.accountsCompleted,
        }));
      }
    } catch {
      toast.error('Failed to update day completion');
    }
  };

  const toggleAccount = async (dayDate, accountIndex, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await API.post('/video-planner/toggle-account', { date: dayDate, accountIndex });
      toast.success(res.data.message);
      fetchSummaryAndIdeas();
      if (selectedDay && selectedDay.date === dayDate) {
        setSelectedDay((p) => ({
          ...p,
          accountsCompleted: res.data.log.accountsCompleted,
          isCompleted: res.data.log.isCompleted,
        }));
      }
    } catch {
      toast.error('Failed to update account status');
    }
  };

  const saveGeneralDrive = async () => {
    setSavingDrive(true);
    try {
      await API.put('/video-planner/state', { generalDriveUrl: generalDrive });
      toast.success('Shared Google Drive folder saved! 📁');
    } catch {
      toast.error('Failed to save Drive URL');
    } finally {
      setSavingDrive(false);
    }
  };

  const saveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      await API.put('/video-planner/state', settingsForm);
      toast.success('Planner settings updated! ⚙️');
      setShowSettingsModal(false);
      fetchSummaryAndIdeas();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const openDayModal = (day) => {
    setSelectedDay(day);
    setDayNotes(day.notes || '');
    setDayDriveUrl(day.driveUrl || '');
  };

  const saveDayDetails = async () => {
    if (!selectedDay) return;
    setSavingDay(true);
    try {
      await API.put('/video-planner/day-details', {
        date: selectedDay.date,
        notes: dayNotes,
        driveUrl: dayDriveUrl,
      });
      toast.success('Day notes & Drive link updated!');
      fetchSummaryAndIdeas();
      setSelectedDay(null);
    } catch {
      toast.error('Failed to save day details');
    } finally {
      setSavingDay(false);
    }
  };

  const openAddIdea = () => {
    setIdeaForm(EMPTY_IDEA);
    setEditIdeaId(null);
    setShowIdeaModal(true);
  };

  const openEditIdea = (idea) => {
    setIdeaForm({
      title: idea.title || '',
      concept: idea.concept || '',
      targetClips: idea.targetClips || 15,
      status: idea.status || 'idea',
      driveUrl: idea.driveUrl || '',
      promptTemplate: idea.promptTemplate || '',
      notes: idea.notes || '',
    });
    setEditIdeaId(idea._id);
    setShowIdeaModal(true);
  };

  const saveIdea = async () => {
    if (!ideaForm.title.trim()) return toast.error('Title is required');
    setSavingIdea(true);
    try {
      if (editIdeaId) {
        const res = await API.put(`/video-planner/ideas/${editIdeaId}`, ideaForm);
        setIdeas((p) => p.map((item) => (item._id === editIdeaId ? res.data : item)));
        toast.success('Video idea updated');
      } else {
        const res = await API.post('/video-planner/ideas', ideaForm);
        setIdeas((p) => [res.data, ...p]);
        toast.success('Video idea added! 💡');
      }
      setShowIdeaModal(false);
    } catch {
      toast.error('Failed to save video idea');
    } finally {
      setSavingIdea(false);
    }
  };

  const removeIdea = async (id) => {
    if (!confirm('Delete this video idea?')) return;
    try {
      await API.delete(`/video-planner/ideas/${id}`);
      setIdeas((p) => p.filter((x) => x._id !== id));
      toast.success('Video idea deleted');
    } catch {
      toast.error('Failed to delete idea');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const today = data?.today || {};
  const settings = data?.settings || {
    accountsCount: 5,
    bonusCreditsPerAccount: 50,
    secondsPerClip: 8,
    creditsPerClip: 10,
    targetClipsPerVideo: 15,
    dailyBonusCredits: 250,
    dailyBonusClips: 25,
    dailyBonusDurationFormatted: '3m 20s',
    targetVideoDurationFormatted: '2m 00s',
  };

  const monthlyPoolRemaining = data?.monthlyPoolRemaining ?? 1000;
  const poolPct = Math.round((monthlyPoolRemaining / (data?.monthlyPoolTotal || 1000)) * 100);
  const currentVideoNumber = data?.currentVideoNumber || 1;
  const currentVideoClips = data?.currentVideoClipsCount || 0;
  const currentVideoNeeded = data?.currentVideoClipsNeeded || settings.targetClipsPerVideo;
  const accountsCompletedList = today?.accountsCompleted || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Film size={18} />
            </span>
            AI Video Credit & Daily Planner
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
            <span>{settings.accountsCount} Bonus Accounts ({settings.dailyBonusCredits}c / {settings.dailyBonusDurationFormatted} daily)</span>
            <span>·</span>
            <span>{settings.secondsPerClip}s / clip (10c)</span>
            <span>·</span>
            <span>{data?.monthlyPoolTotal || 1000} monthly pool</span>
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 hover:bg-slate-100"
            title="Configure accounts, bonus credits & video duration"
          >
            <Settings size={14} className="text-slate-600" />
            <span>Settings</span>
          </button>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} /> Daily Planner
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ideas'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban size={14} /> Video Ideas ({ideas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Monthly Pool Remaining */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Pool</span>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
              {data?.monthlyPoolTotal || 1000} max
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl font-bold text-slate-900">
              {monthlyPoolRemaining} <span className="text-xs font-normal text-slate-500">credits</span>
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              ≈ {data?.monthlyPoolRemainingDurationFormatted || '0s'} footage remaining
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                poolPct > 40 ? 'bg-indigo-500' : poolPct > 15 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${poolPct}%` }}
            />
          </div>
        </div>

        {/* 2. Today's Daily Bonus Across All Accounts */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Bonus</span>
            <span className="text-xs font-mono bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
              {settings.accountsCount} accounts
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl font-bold text-green-600">
              {today.bonusCreditsUsed || (today.isCompleted ? settings.dailyBonusCredits : 0)} / {settings.dailyBonusCredits} <span className="text-xs font-normal text-slate-500">credits</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.dailyBonusClips} clips · <strong>{settings.dailyBonusDurationFormatted}</strong> bonus/day
            </p>
          </div>
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <Clock size={12} /> {today.isCompleted ? '✅ All 5 accounts claimed' : accountsCompletedList.length > 0 ? `⚡ ${accountsCompletedList.length}/${settings.accountsCount} accounts claimed` : '⚠️ Expires at midnight'}
          </span>
        </div>

        {/* 3. Current Video In Progress */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Video Progress</span>
            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
              Video #{currentVideoNumber}
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl font-bold text-purple-700">
              {currentVideoClips} <span className="text-xs font-normal text-slate-500">/ {settings.targetClipsPerVideo} clips</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {data?.currentVideoDurationFormatted || '0s'} / <strong>{settings.targetVideoDurationFormatted}</strong> ({currentVideoNeeded} clips left)
            </p>
          </div>
          {/* Segments visual bar */}
          <div className="flex gap-0.5 w-full bg-slate-100 p-0.5 rounded-md">
            {Array.from({ length: settings.targetClipsPerVideo }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm transition-all ${
                  i < currentVideoClips ? 'bg-purple-600' : 'bg-slate-200'
                }`}
                title={`Clip ${i + 1} of ${settings.targetClipsPerVideo} (${settings.secondsPerClip}s)`}
              />
            ))}
          </div>
        </div>

        {/* 4. Month Clips & Duration Total */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Output</span>
            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full">
              {data?.completedDaysCount || 0} days done
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl font-bold text-slate-900">
              {data?.totalDurationFormatted || '0s'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {data?.totalClipsGenerated || 0} clips (≈ {Math.floor((data?.totalClipsGenerated || 0) / settings.targetClipsPerVideo)} finished videos)
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {data?.skippedDaysCount > 0 ? (
              <span className="text-red-500 font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> {data.skippedDaysCount} day{data.skippedDaysCount > 1 ? 's' : ''} skipped
              </span>
            ) : (
              '🔥 100% streak on track!'
            )}
          </span>
        </div>
      </div>

      {/* Shared Google Drive Link Bar */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 flex items-center justify-between gap-4 flex-wrap p-4">
        <div className="flex items-center gap-3 flex-1 min-w-64">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <LinkIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Shared Google Drive Folder (Clips Hub)</p>
            <input
              className="input text-xs py-1 mt-1 bg-white border-blue-200 text-slate-700 w-full"
              placeholder="Paste Google Drive folder URL for storing raw & edited clips…"
              value={generalDrive}
              onChange={(e) => setGeneralDrive(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveGeneralDrive}
            disabled={savingDrive}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Save size={13} /> {savingDrive ? 'Saving…' : 'Save Drive Link'}
          </button>
          {generalDrive && (
            <a
              href={generalDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              Open Drive <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* ── DAILY PLANNER TAB ──────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Today's Hero Action Card */}
          <div className="card border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-64">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                    Today: Day {today.dayOfMonth} ({today.date})
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      today.isOddDay
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {today.cycleTitle}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Target Today:{' '}
                  <span className="text-indigo-600">
                    Generate {today.plannedClips} clips ({today.plannedDurationFormatted} · {today.plannedClips * 10} credits)
                  </span>
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {today.isOddDay ? (
                    <>
                      <strong>Odd Day (Sprint):</strong> Uses <strong>{settings.dailyBonusCredits} bonus credits</strong> ({settings.dailyBonusClips} clips / {settings.dailyBonusDurationFormatted}) across {settings.accountsCount} accounts +{' '}
                      <strong>50 monthly credits</strong> (5 clips / 40s) = <strong>{settings.dailyBonusCredits + 50} credits ({today.plannedClips} clips / {today.plannedDurationFormatted})</strong>.
                    </>
                  ) : (
                    <>
                      <strong>Even Day (Bonus Gen & Edit):</strong> Uses <strong>{settings.dailyBonusCredits} bonus credits</strong> ({settings.dailyBonusClips} clips / {settings.dailyBonusDurationFormatted}) across {settings.accountsCount} accounts +{' '}
                      <strong>0 monthly credits</strong>. Spend the remaining time editing Video #{currentVideoNumber}!
                    </>
                  )}
                </p>

                {/* Multi-Account Claim Badges / Checklist */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users size={13} className="text-indigo-600" />
                    Account Bonus Tracker ({accountsCompletedList.length}/{settings.accountsCount} Claimed):
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: settings.accountsCount }).map((_, idx) => {
                      const accNum = idx + 1;
                      const isClaimed = accountsCompletedList.includes(accNum);
                      return (
                        <button
                          key={accNum}
                          onClick={(e) => toggleAccount(today.date, accNum, e)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                            isClaimed
                              ? 'bg-green-600 text-white border-green-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                          }`}
                        >
                          <CheckSquare size={13} className={isClaimed ? 'text-white' : 'text-slate-400'} />
                          <span>Account {accNum} ({settings.bonusCreditsPerAccount}c)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => toggleDayCompletion(today.date)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-md ${
                    today.isCompleted
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                  }`}
                >
                  <CheckCircle size={18} />
                  {today.isCompleted ? 'All Accounts Completed! ✅' : `Mark All ${settings.accountsCount} Accounts Done`}
                </button>
                <button
                  onClick={() => openDayModal(today)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  Add Today's Notes / Clips Link
                </button>
              </div>
            </div>
          </div>

          {/* Month Calendar / List View Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Month Cycle Breakdown ({data?.month})
                </h3>
                <p className="text-xs text-slate-500">
                  Odd sprint days = {settings.dailyBonusClips + 5} clips ({(settings.dailyBonusClips + 5) * settings.secondsPerClip}s) · Even days = {settings.dailyBonusClips} clips ({settings.dailyBonusClips * settings.secondsPerClip}s)
                </p>
              </div>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                    viewMode === 'calendar' ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Calendar size={13} /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                    viewMode === 'list' ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List size={13} /> List
                </button>
              </div>
            </div>

            {/* GRID CALENDAR VIEW */}
            {viewMode === 'calendar' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
                {data?.days.map((day) => {
                  const dayAccs = day.accountsCompleted || [];
                  return (
                    <div
                      key={day.dayOfMonth}
                      onClick={() => openDayModal(day)}
                      className={`card p-3 rounded-xl cursor-pointer transition-all border text-left relative flex flex-col justify-between min-h-[120px] ${
                        day.isToday
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20'
                          : day.isCompleted
                          ? 'border-green-200 bg-green-50/30 hover:border-green-300'
                          : day.isPartiallyCompleted
                          ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                          : day.isSkipped
                          ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 font-mono">
                          Day {day.dayOfMonth}
                        </span>
                        {day.isCompleted ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : day.isPartiallyCompleted ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {dayAccs.length}/{settings.accountsCount}
                          </span>
                        ) : day.isSkipped ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            Skipped
                          </span>
                        ) : day.isToday ? (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        ) : null}
                      </div>

                      <div className="my-1 space-y-0.5">
                        <p
                          className={`text-xs font-semibold ${
                            day.isOddDay ? 'text-purple-700' : 'text-teal-700'
                          }`}
                        >
                          {day.plannedClips} clips ({day.plannedDurationFormatted})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {day.isOddDay ? `${settings.dailyBonusCredits}b + 50m` : `${settings.dailyBonusCredits}b only`}
                        </p>
                      </div>

                      {day.isSkipped ? (
                        <span className="text-[10px] text-red-500 font-medium">⚠️ Lost {settings.dailyBonusCredits}b</span>
                      ) : day.isCompleted ? (
                        <span className="text-[10px] text-green-600 font-medium">✅ {day.actualDurationFormatted} generated</span>
                      ) : day.isPartiallyCompleted ? (
                        <span className="text-[10px] text-amber-600 font-medium">⚡ {day.actualDurationFormatted} ({dayAccs.length}/{settings.accountsCount} accs)</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Target: {day.plannedDurationFormatted}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="card p-0 overflow-hidden divide-y divide-slate-100">
                {data?.days.map((day) => {
                  const dayAccs = day.accountsCompleted || [];
                  return (
                    <div
                      key={day.dayOfMonth}
                      className={`flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors ${
                        day.isToday ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold font-mono text-xs flex items-center justify-center flex-shrink-0 ${
                            day.isCompleted
                              ? 'bg-green-100 text-green-700'
                              : day.isPartiallyCompleted
                              ? 'bg-amber-100 text-amber-700'
                              : day.isSkipped
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {day.dayOfMonth}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900">{day.date}</span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                day.isOddDay
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : 'bg-teal-50 text-teal-700 border border-teal-100'
                              }`}
                            >
                              {day.cycleTitle}
                            </span>
                            {day.isToday && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Target: {day.plannedClips} clips ({day.plannedDurationFormatted} · {day.plannedClips * 10}c) —{' '}
                            {day.isOddDay
                              ? `${settings.dailyBonusCredits} bonus (${settings.accountsCount} accounts) + 50 monthly`
                              : `${settings.dailyBonusCredits} bonus (${settings.accountsCount} accounts) only`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Account completion mini pills */}
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: settings.accountsCount }).map((_, idx) => {
                            const accNum = idx + 1;
                            const isAccClaimed = dayAccs.includes(accNum);
                            return (
                              <button
                                key={accNum}
                                onClick={(e) => toggleAccount(day.date, accNum, e)}
                                title={`Toggle Account ${accNum} (${settings.bonusCreditsPerAccount} credits)`}
                                className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${
                                  isAccClaimed
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                                }`}
                              >
                                {accNum}
                              </button>
                            );
                          })}
                        </div>

                        {day.isSkipped && (
                          <span className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-2 py-1 rounded-lg flex items-center gap-1">
                            <AlertTriangle size={12} /> Missed {settings.dailyBonusCredits}b
                          </span>
                        )}

                        <button
                          onClick={() => toggleDayCompletion(day.date)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            day.isCompleted
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'btn-secondary text-xs'
                          }`}
                        >
                          {day.isCompleted ? '✅ Done' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => openDayModal(day)}
                          className="p-1.5 text-slate-400 hover:text-slate-600"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEO IDEAS HUB TAB ────────────────────────────────────────────── */}
      {activeTab === 'ideas' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Collaborative Video Ideas & Drive Links</h2>
              <p className="text-slate-500 text-sm">
                Shared workspace for all users & admin to brainstorm, assign clips, and attach Drive links
              </p>
            </div>
            <button onClick={openAddIdea} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Video Idea
            </button>
          </div>

          {ideas.length === 0 ? (
            <div className="card text-center py-16">
              <Video size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No video ideas yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Add ideas for your {settings.targetClipsPerVideo}-clip videos ({settings.targetVideoDurationFormatted}) and organize Google Drive links.
              </p>
              <button onClick={openAddIdea} className="btn-primary mt-4 text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <Plus size={14} /> Add First Video Idea
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {ideas.map((idea) => {
                const statusStyle = STATUS_CONFIG[idea.status] || STATUS_CONFIG.idea;
                const ideaClips = idea.targetClips || settings.targetClipsPerVideo;
                const ideaDuration = `${ideaClips * settings.secondsPerClip}s (${Math.floor((ideaClips * settings.secondsPerClip) / 60)}m ${(ideaClips * settings.secondsPerClip) % 60}s)`;
                return (
                  <div key={idea._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-base">{idea.title}</h3>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle.color}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium mb-2">
                        <Film size={13} /> {ideaClips} clips ≈ {ideaDuration}
                      </div>

                      {idea.concept && (
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">{idea.concept}</p>
                      )}

                      {idea.promptTemplate && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-mono text-slate-700 mb-3">
                          <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold mb-0.5">
                            Prompt / Style Guide
                          </span>
                          {idea.promptTemplate}
                        </div>
                      )}

                      {idea.notes && (
                        <p className="text-xs text-slate-400 italic mb-3">
                          <strong>Notes:</strong> {idea.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {idea.driveUrl ? (
                          <a
                            href={idea.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink size={12} /> Google Drive Folder
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Drive link attached</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditIdea(idea)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit idea"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => removeIdea(idea._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete idea"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: PLANNER SETTINGS ────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Planner & Video Settings</h3>
                  <p className="text-xs text-slate-500">Configure account bonus pools & clip generation math</p>
                </div>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveSettings} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bonus Accounts Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={settingsForm.accountsCount}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, accountsCount: parseInt(e.target.value, 10) || 1 }))}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">e.g. 5 accounts</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Bonus Credits / Account
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={settingsForm.bonusCreditsPerAccount}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, bonusCreditsPerAccount: parseInt(e.target.value, 10) || 1 }))}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">e.g. 50 credits/account</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seconds per Clip (10 credits)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={settingsForm.secondsPerClip}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, secondsPerClip: parseInt(e.target.value, 10) || 1 }))}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 8 seconds</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Clips per Finished Video
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={settingsForm.targetClipsPerVideo}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, targetClipsPerVideo: parseInt(e.target.value, 10) || 1 }))}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">15 clips = 120s (2m 00s)</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Paid / Main Credit Pool
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={settingsForm.monthlyPoolTotal}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, monthlyPoolTotal: parseInt(e.target.value, 10) || 0 }))}
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 1,000 monthly credits</span>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1 text-indigo-900">
                <p className="font-bold flex items-center gap-1 text-indigo-800">
                  <Sparkles size={13} /> Active Configuration Summary:
                </p>
                <p>
                  • <strong>Daily Bonus:</strong> {settingsForm.accountsCount} accounts × {settingsForm.bonusCreditsPerAccount}c ={' '}
                  <strong>{settingsForm.accountsCount * settingsForm.bonusCreditsPerAccount} bonus credits/day</strong> ({Math.floor((settingsForm.accountsCount * settingsForm.bonusCreditsPerAccount) / (settingsForm.creditsPerClip || 10))} clips / {Math.floor((settingsForm.accountsCount * settingsForm.bonusCreditsPerAccount) / (settingsForm.creditsPerClip || 10)) * settingsForm.secondsPerClip}s)
                </p>
                <p>
                  • <strong>Single Video Duration:</strong> {settingsForm.targetClipsPerVideo} clips × {settingsForm.secondsPerClip}s ={' '}
                  <strong>{settingsForm.targetClipsPerVideo * settingsForm.secondsPerClip} seconds ({Math.floor((settingsForm.targetClipsPerVideo * settingsForm.secondsPerClip) / 60)}m {(settingsForm.targetClipsPerVideo * settingsForm.secondsPerClip) % 60}s)</strong>
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button type="submit" disabled={savingSettings} className="btn-primary flex-1 text-xs py-2">
                  {savingSettings ? 'Saving…' : 'Save Settings'}
                </button>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary text-xs py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT VIDEO IDEA ───────────────────────────────────── */}
      {showIdeaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-slate-900">
                {editIdeaId ? 'Edit Video Concept' : 'New Video Concept'}
              </h3>
              <button
                onClick={() => setShowIdeaModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Video Title *</label>
                <input
                  className="input"
                  placeholder="e.g. Nepal Tech Ecosystem AI Documentary"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm((p) => ({ ...p, title: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Concept / Synopsis</label>
                <textarea
                  className="input resize-none h-20 text-xs"
                  placeholder="Outline the story, theme, and 15-clip structure…"
                  value={ideaForm.concept}
                  onChange={(e) => setIdeaForm((p) => ({ ...p, concept: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="input"
                    value={ideaForm.status}
                    onChange={(e) => setIdeaForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Clips</label>
                  <input
                    type="number"
                    className="input"
                    value={ideaForm.targetClips}
                    onChange={(e) =>
                      setIdeaForm((p) => ({ ...p, targetClips: parseInt(e.target.value, 10) || settings.targetClipsPerVideo }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Drive Folder URL (Clips & Assets)
                </label>
                <input
                  className="input"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={ideaForm.driveUrl}
                  onChange={(e) => setIdeaForm((p) => ({ ...p, driveUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Veo 3.1 Prompt Style / Template
                </label>
                <input
                  className="input font-mono text-xs"
                  placeholder="Cinematic 8k, hyper-realistic, volumetric lighting..."
                  value={ideaForm.promptTemplate}
                  onChange={(e) => setIdeaForm((p) => ({ ...p, promptTemplate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input
                  className="input text-xs"
                  placeholder="Additional notes for editor/generator..."
                  value={ideaForm.notes}
                  onChange={(e) => setIdeaForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t">
              <button onClick={saveIdea} disabled={savingIdea} className="btn-primary flex-1">
                {savingIdea ? 'Saving…' : editIdeaId ? 'Save Changes' : 'Create Video Idea'}
              </button>
              <button onClick={() => setShowIdeaModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DAY DETAILS & MULTI-ACCOUNT TOGGLE ──────────────────────── */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Day {selectedDay.dayOfMonth} ({selectedDay.date})
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedDay.cycleTitle}</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <p>
                  <strong>Target:</strong> {selectedDay.plannedClips} clips ({selectedDay.plannedDurationFormatted} · {selectedDay.plannedClips * 10} credits)
                </p>
                <p>
                  <strong>Budget Source:</strong>{' '}
                  {selectedDay.isOddDay ? `${settings.dailyBonusCredits} daily bonus + 50 monthly pool` : `${settings.dailyBonusCredits} daily bonus only`}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  {selectedDay.isCompleted ? (
                    <span className="text-green-600 font-bold">✅ Completed ({selectedDay.actualDurationFormatted})</span>
                  ) : (selectedDay.accountsCompleted || []).length > 0 ? (
                    <span className="text-amber-600 font-bold">⚡ Partially Completed ({(selectedDay.accountsCompleted || []).length}/{settings.accountsCount} accounts)</span>
                  ) : selectedDay.isSkipped ? (
                    <span className="text-red-500 font-bold">⚠️ Skipped (Lost {settings.dailyBonusCredits} bonus credits)</span>
                  ) : (
                    <span className="text-slate-500">Pending</span>
                  )}
                </p>

                {/* Account check buttons */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold block mb-1 text-slate-700">Account Claims:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: settings.accountsCount }).map((_, idx) => {
                      const accNum = idx + 1;
                      const isClaimed = (selectedDay.accountsCompleted || []).includes(accNum);
                      return (
                        <button
                          key={accNum}
                          type="button"
                          onClick={(e) => toggleAccount(selectedDay.date, accNum, e)}
                          className={`p-1.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
                            isClaimed
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>Account {accNum}</span>
                          <span>{isClaimed ? '✅' : '⚪'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Drive Folder for Today's Clips
                </label>
                <input
                  className="input text-xs"
                  placeholder="https://drive.google.com/..."
                  value={dayDriveUrl}
                  onChange={(e) => setDayDriveUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Prompts Generated</label>
                <textarea
                  className="input resize-none h-20 text-xs"
                  placeholder="e.g. Generated clips for Video #2 scenes 1-4 on accounts 1 to 5..."
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t">
              <button onClick={saveDayDetails} disabled={savingDay} className="btn-primary flex-1 text-xs">
                {savingDay ? 'Saving…' : 'Save Notes & Link'}
              </button>
              <button
                onClick={() => toggleDayCompletion(selectedDay.date)}
                className="btn-secondary text-xs px-3"
              >
                {selectedDay.isCompleted ? 'Mark Incomplete' : 'Mark Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
