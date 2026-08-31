const router = require('express').Router();
const { Assignment, Schedule } = require('../models/index');
const { AdminSubject } = require('../models/adminModels');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// ── Global Subjects (for assignment dropdowns) ──────────────────────────────
router.get('/global-subjects', auth, asyncHandler(async (req, res) => {
  const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 }).select('name code semester color');
  res.json(subjects);
}));

// ── Schedule ────────────────────────────────────────────────────────────────
// GET /api/college/schedule — Users view own schedule, admin can view by userId
router.get('/schedule', auth, asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const schedule = await Schedule.find({ user: userId }).sort({ day: 1, startTime: 1 });
  res.json(schedule);
}));

// POST /api/college/schedule — Admin adds schedule item for user or all users
router.post('/schedule', adminAuth, asyncHandler(async (req, res) => {
  const { pushToAll, userId, ...schedData } = req.body;
  if (!schedData.subject || !schedData.day || !schedData.startTime || !schedData.endTime) {
    return res.status(400).json({ message: 'Subject, day, start and end time are required' });
  }

  if (pushToAll) {
    const users = await User.find({ role: 'user' }).select('_id');
    const docs = users.map((u) => ({ ...schedData, user: u._id }));
    if (docs.length > 0) {
      await Schedule.insertMany(docs);
    }
    return res.status(201).json({ message: `Schedule pushed to ${users.length} users` });
  }

  const item = await Schedule.create({ ...schedData, user: userId || req.user._id });
  res.status(201).json(item);
}));

// DELETE /api/college/schedule/:id — Admin deletes schedule item
router.delete('/schedule/:id', adminAuth, asyncHandler(async (req, res) => {
  const item = await Schedule.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Schedule item not found' });
  res.json({ message: 'Deleted' });
}));

// ── Assignments ─────────────────────────────────────────────────────────────
// GET /api/college/assignments — Users view own assignments
router.get('/assignments', auth, asyncHandler(async (req, res) => {
  const { completed } = req.query;
  const filter = { user: req.user._id };
  if (completed !== undefined) filter.completed = completed === 'true';

  const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
  res.json(assignments);
}));

// PUT /api/college/assignments/:id — Users toggle completion status
router.put('/assignments/:id', auth, asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.completed && !updates.completedAt) {
    updates.completedAt = new Date();
  } else if (updates.completed === false) {
    updates.completedAt = null;
  }

  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  res.json(assignment);
}));

// POST /api/college/assignments — Admin creates assignment for one or all users
router.post('/assignments', adminAuth, asyncHandler(async (req, res) => {
  const { pushToAll, userId, ...aData } = req.body;
  if (!aData.subject || !aData.title || !aData.dueDate) {
    return res.status(400).json({ message: 'Subject, title and due date are required' });
  }

  if (pushToAll) {
    const users = await User.find({ role: 'user' }).select('_id');
    const docs = users.map((u) => ({ ...aData, user: u._id }));
    if (docs.length > 0) {
      await Assignment.insertMany(docs);
    }
    return res.status(201).json({ message: `Assignment pushed to ${users.length} users` });
  }

  const assignment = await Assignment.create({ ...aData, user: userId || req.user._id });
  res.status(201).json(assignment);
}));

// DELETE /api/college/assignments/:id — Admin deletes assignment
router.delete('/assignments/:id', adminAuth, asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  res.json({ message: 'Deleted' });
}));

module.exports = router;
