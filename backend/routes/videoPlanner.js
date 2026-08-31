const router = require('express').Router();
const { VideoDailyLog, VideoCreditState, VideoIdea } = require('../models/index');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.use(auth);

// Helper: Get days in month
const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

// Helper: Get current date strings in Nepal/local time
const getCurrentMonthAndDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    year,
    monthIndex: now.getMonth(),
    yearMonth: `${year}-${month}`,
    todayDate: `${year}-${month}-${day}`,
    todayDayNumber: now.getDate(),
  };
};

// Helper: Format seconds into human readable duration
const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''} ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs}s`;
};

// ── GET /api/video-planner/summary ───────────────────────────────────────────
router.get('/summary', asyncHandler(async (req, res) => {
  const { todayDate, todayDayNumber, yearMonth: defaultMonth } = getCurrentMonthAndDate();
  const month = req.query.month || defaultMonth;
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const totalDays = getDaysInMonth(year, monthIndex);

  // 1. Get or create VideoCreditState
  let state = await VideoCreditState.findOne({ yearMonth: month });
  if (!state) {
    state = await VideoCreditState.create({ yearMonth: month });
  }

  const accountsCount = state.accountsCount || 5;
  const bonusCreditsPerAccount = state.bonusCreditsPerAccount || 50;
  const secondsPerClip = state.secondsPerClip || 8;
  const creditsPerClip = state.creditsPerClip || 10;
  const targetClipsPerVideo = state.targetClipsPerVideo || 15;
  const monthlyPoolTotal = state.monthlyPoolTotal || 1000;
  const dailyBonusCredits = accountsCount * bonusCreditsPerAccount; // e.g. 5 * 50 = 250
  const dailyBonusClips = Math.floor(dailyBonusCredits / creditsPerClip); // e.g. 25 clips
  const sprintMonthlyCredits = 50;
  const sprintMonthlyClips = Math.floor(sprintMonthlyCredits / creditsPerClip); // 5 clips

  // 2. Fetch existing daily logs for this month
  const existingLogs = await VideoDailyLog.find({ month }).populate('completedBy', 'name email');
  const logMap = new Map();
  existingLogs.forEach((log) => logMap.set(log.dayOfMonth, log));

  // 3. Build day-by-day array (1 to totalDays)
  let totalClips = 0;
  let monthlyCreditsSpent = 0;
  let completedDaysCount = 0;
  let skippedDaysCount = 0;

  const days = [];
  for (let day = 1; day <= totalDays; day++) {
    const isOdd = day % 2 !== 0;
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const plannedClips = isOdd ? (dailyBonusClips + sprintMonthlyClips) : dailyBonusClips;
    const monthlyCreditsPlanned = isOdd ? sprintMonthlyCredits : 0;
    const cycleType = isOdd ? 'generation_sprint' : 'generation_and_edit';

    let dayLog = logMap.get(day);
    const isPast = dateStr < todayDate;
    const isToday = dateStr === todayDate;

    const isFullyCompleted = Boolean(dayLog?.isCompleted);
    const completedAccounts = dayLog?.accountsCompleted && dayLog.accountsCompleted.length > 0
      ? dayLog.accountsCompleted
      : (isFullyCompleted ? Array.from({ length: accountsCount }, (_, i) => i + 1) : []);

    const actualClips = isFullyCompleted
      ? (dayLog.actualClips || plannedClips)
      : (completedAccounts.length * Math.floor(bonusCreditsPerAccount / creditsPerClip));

    const bonusCreditsUsed = isFullyCompleted
      ? dailyBonusCredits
      : (completedAccounts.length * bonusCreditsPerAccount);

    const monthlyCreditsUsed = isFullyCompleted ? monthlyCreditsPlanned : (dayLog?.monthlyCreditsUsed || 0);

    if (isFullyCompleted || completedAccounts.length > 0) {
      if (isFullyCompleted) completedDaysCount++;
      totalClips += actualClips;
      monthlyCreditsSpent += monthlyCreditsUsed;
    } else if (isPast) {
      skippedDaysCount++;
    }

    const plannedSeconds = plannedClips * secondsPerClip;
    const actualSeconds = actualClips * secondsPerClip;

    days.push({
      dayOfMonth: day,
      date: dateStr,
      isOddDay: isOdd,
      cycleType,
      cycleTitle: isOdd
        ? `Generation Sprint (${plannedClips} clips / ${formatDuration(plannedSeconds)})`
        : `Bonus Gen & Edit (${plannedClips} clips / ${formatDuration(plannedSeconds)})`,
      plannedClips,
      plannedSeconds,
      plannedDurationFormatted: formatDuration(plannedSeconds),
      bonusCreditsPlanned: dailyBonusCredits,
      monthlyCreditsPlanned,
      actualClips,
      actualSeconds,
      actualDurationFormatted: formatDuration(actualSeconds),
      bonusCreditsUsed,
      monthlyCreditsUsed,
      accountsCompleted: completedAccounts,
      accountsCount,
      isCompleted: isFullyCompleted,
      isPartiallyCompleted: !isFullyCompleted && completedAccounts.length > 0,
      isSkipped: isPast && !isFullyCompleted && completedAccounts.length === 0,
      isToday,
      isPast,
      completedAt: dayLog?.completedAt || null,
      completedBy: dayLog?.completedBy || null,
      notes: dayLog?.notes || '',
      driveUrl: dayLog?.driveUrl || '',
      _id: dayLog?._id || null,
    });
  }

  // 4. Update state running totals
  const monthlyPoolRemaining = Math.max(0, monthlyPoolTotal - monthlyCreditsSpent);
  const currentVideoNumber = Math.floor(totalClips / targetClipsPerVideo) + 1;
  const currentVideoClipsCount = totalClips % targetClipsPerVideo;
  const currentVideoClipsNeeded = targetClipsPerVideo - currentVideoClipsCount;
  const currentVideoSecondsCount = currentVideoClipsCount * secondsPerClip;
  const currentVideoSecondsTarget = targetClipsPerVideo * secondsPerClip;
  const totalSecondsGenerated = totalClips * secondsPerClip;
  const monthlyPoolRemainingSeconds = Math.floor(monthlyPoolRemaining / creditsPerClip) * secondsPerClip;

  state.monthlyPoolUsed = monthlyCreditsSpent;
  state.totalClipsGenerated = totalClips;
  await state.save();

  // 5. Today's status
  const todayEntry = days.find((d) => d.date === todayDate) || days[0];

  res.json({
    month,
    settings: {
      accountsCount,
      bonusCreditsPerAccount,
      secondsPerClip,
      creditsPerClip,
      targetClipsPerVideo,
      monthlyPoolTotal,
      dailyBonusCredits,
      dailyBonusClips,
      dailyBonusSeconds: dailyBonusClips * secondsPerClip,
      dailyBonusDurationFormatted: formatDuration(dailyBonusClips * secondsPerClip),
      targetVideoSeconds: currentVideoSecondsTarget,
      targetVideoDurationFormatted: formatDuration(currentVideoSecondsTarget),
    },
    monthlyPoolTotal,
    monthlyPoolUsed: monthlyCreditsSpent,
    monthlyPoolRemaining,
    monthlyPoolRemainingSeconds,
    monthlyPoolRemainingDurationFormatted: formatDuration(monthlyPoolRemainingSeconds),
    totalClipsGenerated: totalClips,
    totalSecondsGenerated,
    totalDurationFormatted: formatDuration(totalSecondsGenerated),
    currentVideoNumber,
    currentVideoClipsCount,
    currentVideoClipsNeeded,
    currentVideoSecondsCount,
    currentVideoDurationFormatted: formatDuration(currentVideoSecondsCount),
    currentVideoTargetFormatted: formatDuration(currentVideoSecondsTarget),
    completedDaysCount,
    skippedDaysCount,
    generalDriveUrl: state.generalDriveUrl || '',
    today: todayEntry,
    days,
  });
}));

// ── POST /api/video-planner/toggle-day ─────────────────────────────────────────
router.post('/toggle-day', asyncHandler(async (req, res) => {
  const { date, notes, driveUrl } = req.body;
  if (!date) return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });

  const [yearStr, monthStr, dayStr] = date.split('-');
  const month = `${yearStr}-${monthStr}`;
  const dayOfMonth = parseInt(dayStr, 10);
  const isOddDay = dayOfMonth % 2 !== 0;

  let state = await VideoCreditState.findOne({ yearMonth: month });
  if (!state) state = await VideoCreditState.create({ yearMonth: month });

  const accountsCount = state.accountsCount || 5;
  const bonusCreditsPerAccount = state.bonusCreditsPerAccount || 50;
  const creditsPerClip = state.creditsPerClip || 10;
  const dailyBonusCredits = accountsCount * bonusCreditsPerAccount;
  const dailyBonusClips = Math.floor(dailyBonusCredits / creditsPerClip);
  const sprintMonthlyCredits = 50;
  const sprintMonthlyClips = Math.floor(sprintMonthlyCredits / creditsPerClip);
  const plannedClips = isOddDay ? (dailyBonusClips + sprintMonthlyClips) : dailyBonusClips;
  const cycleType = isOddDay ? 'generation_sprint' : 'generation_and_edit';
  const monthlyCredits = isOddDay ? sprintMonthlyCredits : 0;

  let log = await VideoDailyLog.findOne({ month, dayOfMonth });

  if (!log) {
    log = new VideoDailyLog({
      date,
      month,
      dayOfMonth,
      isOddDay,
      cycleType,
      plannedClips,
      actualClips: plannedClips,
      bonusCreditsUsed: dailyBonusCredits,
      monthlyCreditsUsed: monthlyCredits,
      accountsCompleted: Array.from({ length: accountsCount }, (_, i) => i + 1),
      isCompleted: true,
      completedAt: new Date(),
      completedBy: req.user._id,
      notes: notes || '',
      driveUrl: driveUrl || '',
    });
    await log.save();
  } else {
    const nextCompleted = !log.isCompleted;
    log.isCompleted = nextCompleted;
    log.actualClips = nextCompleted ? plannedClips : 0;
    log.bonusCreditsUsed = nextCompleted ? dailyBonusCredits : 0;
    log.monthlyCreditsUsed = nextCompleted ? monthlyCredits : 0;
    log.accountsCompleted = nextCompleted ? Array.from({ length: accountsCount }, (_, i) => i + 1) : [];
    log.completedAt = nextCompleted ? new Date() : null;
    log.completedBy = nextCompleted ? req.user._id : null;
    if (notes !== undefined) log.notes = notes;
    if (driveUrl !== undefined) log.driveUrl = driveUrl;
    await log.save();
  }

  res.json({
    message: log.isCompleted ? 'Day marked complete! 🚀' : 'Day marked incomplete',
    log,
  });
}));

// ── POST /api/video-planner/toggle-account ───────────────────────────────────
router.post('/toggle-account', asyncHandler(async (req, res) => {
  const { date, accountIndex } = req.body;
  if (!date || accountIndex === undefined) {
    return res.status(400).json({ message: 'Date and accountIndex (1-based) are required' });
  }

  const [yearStr, monthStr, dayStr] = date.split('-');
  const month = `${yearStr}-${monthStr}`;
  const dayOfMonth = parseInt(dayStr, 10);
  const isOddDay = dayOfMonth % 2 !== 0;

  let state = await VideoCreditState.findOne({ yearMonth: month });
  if (!state) state = await VideoCreditState.create({ yearMonth: month });

  const accountsCount = state.accountsCount || 5;
  const bonusCreditsPerAccount = state.bonusCreditsPerAccount || 50;
  const creditsPerClip = state.creditsPerClip || 10;
  const dailyBonusCredits = accountsCount * bonusCreditsPerAccount;
  const dailyBonusClips = Math.floor(dailyBonusCredits / creditsPerClip);
  const sprintMonthlyCredits = 50;
  const sprintMonthlyClips = Math.floor(sprintMonthlyCredits / creditsPerClip);
  const plannedClips = isOddDay ? (dailyBonusClips + sprintMonthlyClips) : dailyBonusClips;
  const cycleType = isOddDay ? 'generation_sprint' : 'generation_and_edit';

  let log = await VideoDailyLog.findOne({ month, dayOfMonth });
  if (!log) {
    log = new VideoDailyLog({
      date,
      month,
      dayOfMonth,
      isOddDay,
      cycleType,
      plannedClips,
      actualClips: 0,
      bonusCreditsUsed: 0,
      monthlyCreditsUsed: 0,
      accountsCompleted: [],
      isCompleted: false,
    });
  }

  const currentAccounts = new Set(log.accountsCompleted || []);
  if (currentAccounts.has(accountIndex)) {
    currentAccounts.delete(accountIndex);
  } else {
    currentAccounts.add(accountIndex);
  }

  log.accountsCompleted = Array.from(currentAccounts).sort((a, b) => a - b);
  const completedAllAccounts = log.accountsCompleted.length === accountsCount;
  log.isCompleted = completedAllAccounts;

  const clipsPerAcc = Math.floor(bonusCreditsPerAccount / creditsPerClip);
  const bonusClipsDone = log.accountsCompleted.length * clipsPerAcc;
  const monthlyClipsDone = completedAllAccounts && isOddDay ? sprintMonthlyClips : 0;
  log.actualClips = bonusClipsDone + monthlyClipsDone;
  log.bonusCreditsUsed = log.accountsCompleted.length * bonusCreditsPerAccount;
  log.monthlyCreditsUsed = completedAllAccounts && isOddDay ? sprintMonthlyCredits : 0;

  if (completedAllAccounts) {
    log.completedAt = new Date();
    log.completedBy = req.user._id;
  }

  await log.save();

  res.json({
    message: `Account ${accountIndex} status updated`,
    log,
  });
}));

// ── PUT /api/video-planner/day-details ─────────────────────────────────────────
router.put('/day-details', asyncHandler(async (req, res) => {
  const { date, notes, driveUrl } = req.body;
  if (!date) return res.status(400).json({ message: 'Date is required' });

  const [yearStr, monthStr, dayStr] = date.split('-');
  const month = `${yearStr}-${monthStr}`;
  const dayOfMonth = parseInt(dayStr, 10);
  const isOddDay = dayOfMonth % 2 !== 0;

  let state = await VideoCreditState.findOne({ yearMonth: month });
  if (!state) state = await VideoCreditState.create({ yearMonth: month });

  const accountsCount = state.accountsCount || 5;
  const bonusCreditsPerAccount = state.bonusCreditsPerAccount || 50;
  const creditsPerClip = state.creditsPerClip || 10;
  const dailyBonusCredits = accountsCount * bonusCreditsPerAccount;
  const dailyBonusClips = Math.floor(dailyBonusCredits / creditsPerClip);
  const sprintMonthlyCredits = 50;
  const sprintMonthlyClips = Math.floor(sprintMonthlyCredits / creditsPerClip);
  const plannedClips = isOddDay ? (dailyBonusClips + sprintMonthlyClips) : dailyBonusClips;
  const cycleType = isOddDay ? 'generation_sprint' : 'generation_and_edit';

  let log = await VideoDailyLog.findOne({ month, dayOfMonth });
  if (!log) {
    log = new VideoDailyLog({
      date,
      month,
      dayOfMonth,
      isOddDay,
      cycleType,
      plannedClips,
      isCompleted: false,
      notes: notes || '',
      driveUrl: driveUrl || '',
    });
  } else {
    if (notes !== undefined) log.notes = notes;
    if (driveUrl !== undefined) log.driveUrl = driveUrl;
  }
  await log.save();

  res.json({ message: 'Day details updated', log });
}));

// ── PUT /api/video-planner/state ──────────────────────────────────────────────
router.put('/state', asyncHandler(async (req, res) => {
  const {
    month,
    generalDriveUrl,
    accountsCount,
    bonusCreditsPerAccount,
    secondsPerClip,
    creditsPerClip,
    targetClipsPerVideo,
    monthlyPoolTotal,
  } = req.body;
  const targetMonth = month || getCurrentMonthAndDate().yearMonth;

  const updates = {};
  if (generalDriveUrl !== undefined) updates.generalDriveUrl = generalDriveUrl;
  if (accountsCount !== undefined) updates.accountsCount = Math.max(1, parseInt(accountsCount, 10) || 5);
  if (bonusCreditsPerAccount !== undefined) updates.bonusCreditsPerAccount = Math.max(1, parseInt(bonusCreditsPerAccount, 10) || 50);
  if (secondsPerClip !== undefined) updates.secondsPerClip = Math.max(1, parseInt(secondsPerClip, 10) || 8);
  if (creditsPerClip !== undefined) updates.creditsPerClip = Math.max(1, parseInt(creditsPerClip, 10) || 10);
  if (targetClipsPerVideo !== undefined) updates.targetClipsPerVideo = Math.max(1, parseInt(targetClipsPerVideo, 10) || 15);
  if (monthlyPoolTotal !== undefined) updates.monthlyPoolTotal = Math.max(0, parseInt(monthlyPoolTotal, 10) || 1000);

  const state = await VideoCreditState.findOneAndUpdate(
    { yearMonth: targetMonth },
    updates,
    { new: true, upsert: true }
  );

  res.json(state);
}));

// ── Collaborative Video Ideas ────────────────────────────────────────────────
// GET /api/video-planner/ideas
router.get('/ideas', asyncHandler(async (req, res) => {
  const ideas = await VideoIdea.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ updatedAt: -1 });
  res.json(ideas);
}));

// POST /api/video-planner/ideas
router.post('/ideas', asyncHandler(async (req, res) => {
  const { title, concept, targetClips, status, driveUrl, promptTemplate, notes } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Video title is required' });
  }

  const idea = await VideoIdea.create({
    title,
    concept,
    targetClips: targetClips || 15,
    status: status || 'idea',
    driveUrl,
    promptTemplate,
    notes,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populated = await VideoIdea.findById(idea._id).populate('createdBy', 'name email');
  res.status(201).json(populated);
}));

// PUT /api/video-planner/ideas/:id
router.put('/ideas/:id', asyncHandler(async (req, res) => {
  const allowed = ['title', 'concept', 'targetClips', 'status', 'driveUrl', 'promptTemplate', 'notes'];
  const updates = { updatedBy: req.user._id };
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const idea = await VideoIdea.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!idea) return res.status(404).json({ message: 'Video idea not found' });
  res.json(idea);
}));

// DELETE /api/video-planner/ideas/:id
router.delete('/ideas/:id', asyncHandler(async (req, res) => {
  const idea = await VideoIdea.findByIdAndDelete(req.params.id);
  if (!idea) return res.status(404).json({ message: 'Video idea not found' });
  res.json({ message: 'Video idea deleted' });
}));

module.exports = router;
