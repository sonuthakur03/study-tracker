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
    const plannedClips = isOdd ? 10 : 5;
    const monthlyCreditsPlanned = isOdd ? 50 : 0;
    const cycleType = isOdd ? 'generation_sprint' : 'generation_and_edit';

    let dayLog = logMap.get(day);
    const isPast = dateStr < todayDate;
    const isToday = dateStr === todayDate;

    if (dayLog && dayLog.isCompleted) {
      completedDaysCount++;
      totalClips += dayLog.actualClips || plannedClips;
      monthlyCreditsSpent += dayLog.monthlyCreditsUsed;
    } else if (isPast) {
      skippedDaysCount++;
    }

    days.push({
      dayOfMonth: day,
      date: dateStr,
      isOddDay: isOdd,
      cycleType,
      cycleTitle: isOdd ? 'Generation Sprint (10 clips)' : 'Generation & Edit Day (5 clips)',
      plannedClips,
      bonusCreditsPlanned: 50,
      monthlyCreditsPlanned,
      actualClips: dayLog?.isCompleted ? (dayLog.actualClips || plannedClips) : 0,
      bonusCreditsUsed: dayLog?.isCompleted ? 50 : 0,
      monthlyCreditsUsed: dayLog?.isCompleted ? monthlyCreditsPlanned : 0,
      isCompleted: Boolean(dayLog?.isCompleted),
      isSkipped: isPast && !dayLog?.isCompleted,
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
  const monthlyPoolRemaining = Math.max(0, 1000 - monthlyCreditsSpent);
  const currentVideoNumber = Math.floor(totalClips / 15) + 1;
  const currentVideoClipsCount = totalClips % 15;
  const currentVideoClipsNeeded = 15 - currentVideoClipsCount;

  state.monthlyPoolUsed = monthlyCreditsSpent;
  state.totalClipsGenerated = totalClips;
  await state.save();

  // 5. Today's status
  const todayEntry = days.find((d) => d.date === todayDate) || {
    dayOfMonth: todayDayNumber,
    date: todayDate,
    isOddDay: todayDayNumber % 2 !== 0,
    cycleType: todayDayNumber % 2 !== 0 ? 'generation_sprint' : 'generation_and_edit',
    cycleTitle: todayDayNumber % 2 !== 0 ? 'Generation Sprint (10 clips)' : 'Generation & Edit Day (5 clips)',
    plannedClips: todayDayNumber % 2 !== 0 ? 10 : 5,
    bonusCreditsPlanned: 50,
    monthlyCreditsPlanned: todayDayNumber % 2 !== 0 ? 50 : 0,
    isCompleted: false,
    bonusCreditsUsed: 0,
    notes: '',
    driveUrl: '',
  };

  res.json({
    month,
    monthlyPoolTotal: 1000,
    monthlyPoolUsed: monthlyCreditsSpent,
    monthlyPoolRemaining,
    totalClipsGenerated: totalClips,
    currentVideoNumber,
    currentVideoClipsCount,
    currentVideoClipsNeeded,
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
  const plannedClips = isOddDay ? 10 : 5;
  const cycleType = isOddDay ? 'generation_sprint' : 'generation_and_edit';
  const monthlyCredits = isOddDay ? 50 : 0;

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
      bonusCreditsUsed: 50,
      monthlyCreditsUsed: monthlyCredits,
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
    log.bonusCreditsUsed = nextCompleted ? 50 : 0;
    log.monthlyCreditsUsed = nextCompleted ? monthlyCredits : 0;
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

// ── PUT /api/video-planner/day-details ─────────────────────────────────────────
router.put('/day-details', asyncHandler(async (req, res) => {
  const { date, notes, driveUrl } = req.body;
  if (!date) return res.status(400).json({ message: 'Date is required' });

  const [yearStr, monthStr, dayStr] = date.split('-');
  const month = `${yearStr}-${monthStr}`;
  const dayOfMonth = parseInt(dayStr, 10);
  const isOddDay = dayOfMonth % 2 !== 0;
  const plannedClips = isOddDay ? 10 : 5;
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
  const { month, generalDriveUrl } = req.body;
  const targetMonth = month || getCurrentMonthAndDate().yearMonth;

  const state = await VideoCreditState.findOneAndUpdate(
    { yearMonth: targetMonth },
    { generalDriveUrl: generalDriveUrl || '' },
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
