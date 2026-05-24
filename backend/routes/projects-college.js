const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');

// ─── PROJECTS ROUTER ──────────────────────────────────────────────────────────
// Projects remain user-managed (personal portfolio)
const projectsRouter = require('express').Router();
const { Project } = require('../models/index');

projectsRouter.use(auth);
projectsRouter.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
projectsRouter.post('/', async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, user: req.user._id });
    res.status(201).json(project);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
projectsRouter.put('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json(project);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
projectsRouter.delete('/:id', async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── COLLEGE ROUTER ───────────────────────────────────────────────────────────
// Users: GET schedule/assignments + PUT (toggle assignment complete)
// Admin: POST/DELETE everything
const collegeRouter = require('express').Router();
const { Assignment, Schedule } = require('../models/index');

// Schedule — GET for users, POST/DELETE admin only
collegeRouter.get('/schedule', auth, async (req, res) => {
  try {
    // Users see their own; admin can see by userId query
    const userId = (req.user.role === 'admin' && req.query.userId) ? req.query.userId : req.user._id;
    const schedule = await Schedule.find({ user: userId }).sort({ day: 1, startTime: 1 });
    res.json(schedule);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
collegeRouter.post('/schedule', adminAuth, async (req, res) => {
  try {
    // Admin can push schedule to one user or all
    const { pushToAll, userId, ...schedData } = req.body;
    if (pushToAll) {
      const User = require('../models/User');
      const users = await User.find({});
      await Schedule.insertMany(users.map(u => ({ ...schedData, user: u._id })));
      return res.status(201).json({ message: `Schedule pushed to ${users.length} users` });
    }
    const item = await Schedule.create({ ...schedData, user: userId || req.user._id });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
collegeRouter.delete('/schedule/:id', adminAuth, async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Assignments — GET + PUT (toggle) for users, POST/DELETE admin only
collegeRouter.get('/assignments', auth, async (req, res) => {
  try {
    const { completed } = req.query;
    const filter = { user: req.user._id };
    if (completed !== undefined) filter.completed = completed === 'true';
    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
collegeRouter.put('/assignments/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.completed && !updates.completedAt) updates.completedAt = new Date();
    const a = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, updates, { new: true }
    );
    res.json(a);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
collegeRouter.post('/assignments', adminAuth, async (req, res) => {
  try {
    const { pushToAll, userId, ...aData } = req.body;
    if (pushToAll) {
      const User = require('../models/User');
      const users = await User.find({});
      await Assignment.insertMany(users.map(u => ({ ...aData, user: u._id })));
      return res.status(201).json({ message: `Assignment pushed to ${users.length} users` });
    }
    const a = await Assignment.create({ ...aData, user: userId || req.user._id });
    res.status(201).json(a);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
collegeRouter.delete('/assignments/:id', adminAuth, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = { projectsRouter, collegeRouter };
