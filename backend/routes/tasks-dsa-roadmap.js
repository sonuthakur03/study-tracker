const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');

// ─── TASKS ROUTER ─────────────────────────────────────────────────────────────
// Users: GET (view) + PUT (toggle complete)
// Admin: POST (create for any user) + DELETE
const tasksRouter = require('express').Router();
const { Task } = require('../models/index');

// GET — users see their own tasks
tasksRouter.get('/', auth, async (req, res) => {
  try {
    const { date, type, completed } = req.query;
    const filter = { user: req.user._id };
    if (date)      filter.date      = date;
    if (type)      filter.type      = type;
    if (completed !== undefined) filter.completed = completed === 'true';
    const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT — users can toggle complete on their own tasks
tasksRouter.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.completed && !updates.completedAt) updates.completedAt = new Date();
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates, { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST + DELETE — admin only
tasksRouter.post('/', adminAuth, async (req, res) => {
  try {
    // Admin can specify userId or push to all users
    const { userId, pushToAll, ...taskData } = req.body;
    if (pushToAll) {
      const User = require('../models/User');
      const users = await User.find({});
      const docs  = users.map(u => ({ ...taskData, user: u._id }));
      await Task.insertMany(docs);
      return res.status(201).json({ message: `Task pushed to ${users.length} users` });
    }
    const task = await Task.create({ ...taskData, user: userId || req.user._id });
    res.status(201).json(task);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

tasksRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DSA ROUTER ───────────────────────────────────────────────────────────────
const dsaRouter = require('express').Router();
const { DSAQuestion } = require('../models/index');

dsaRouter.get('/', auth, async (req, res) => {
  try {
    const questions = await DSAQuestion.find().sort({ dayNumber: 1 });
    const withProgress = questions.map(q => ({
      ...q.toObject(),
      completed: q.completedBy.includes(req.user._id),
    }));
    res.json(withProgress);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
dsaRouter.post('/', adminAuth, async (req, res) => {
  try { const q = await DSAQuestion.create(req.body); res.status(201).json(q); }
  catch (err) { res.status(400).json({ message: err.message }); }
});
dsaRouter.put('/:id', adminAuth, async (req, res) => {
  try { const q = await DSAQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(q); }
  catch (err) { res.status(400).json({ message: err.message }); }
});
dsaRouter.delete('/:id', adminAuth, async (req, res) => {
  try { await DSAQuestion.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
dsaRouter.post('/:id/toggle', auth, async (req, res) => {
  try {
    const q = await DSAQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id;
    const idx = q.completedBy.indexOf(uid);
    if (idx > -1) q.completedBy.splice(idx, 1);
    else q.completedBy.push(uid);
    await q.save();
    res.json({ completed: idx === -1 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ROADMAP ROUTER ───────────────────────────────────────────────────────────
const roadmapRouter = require('express').Router();
const { RoadmapTopic } = require('../models/index');
const User = require('../models/User');

roadmapRouter.get('/', auth, async (req, res) => {
  try {
    const { path } = req.query;
    const filter = path ? { path } : {};
    const topics = await RoadmapTopic.find(filter).sort({ phase: 1, order: 1 });
    const withProgress = topics.map(t => ({
      ...t.toObject(),
      completed: t.completedBy.includes(req.user._id),
    }));
    res.json(withProgress);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
roadmapRouter.post('/', adminAuth, async (req, res) => {
  try { const t = await RoadmapTopic.create(req.body); res.status(201).json(t); }
  catch (err) { res.status(400).json({ message: err.message }); }
});
roadmapRouter.put('/:id', adminAuth, async (req, res) => {
  try { const t = await RoadmapTopic.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(t); }
  catch (err) { res.status(400).json({ message: err.message }); }
});
roadmapRouter.delete('/:id', adminAuth, async (req, res) => {
  try { await RoadmapTopic.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
roadmapRouter.post('/:id/toggle', auth, async (req, res) => {
  try {
    const topic = await RoadmapTopic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id;
    const idx = topic.completedBy.indexOf(uid);
    if (idx > -1) topic.completedBy.splice(idx, 1);
    else topic.completedBy.push(uid);
    await topic.save();
    if (idx === -1) {
      const update = topic.path === 'aiml' ? { aimlPhase: topic.phase } : { dePhase: topic.phase };
      await User.findByIdAndUpdate(uid, update);
    }
    res.json({ completed: idx === -1 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = { tasksRouter, dsaRouter, roadmapRouter };
