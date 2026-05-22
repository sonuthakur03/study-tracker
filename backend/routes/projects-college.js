// ─── PROJECTS ROUTER ──────────────────────────────────────────────────────────
const projectsRouter = require('express').Router();
const { Project } = require('../models/index');
const { auth } = require('../middleware/auth');

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
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

projectsRouter.delete('/:id', async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── COLLEGE ROUTER ───────────────────────────────────────────────────────────
const collegeRouter = require('express').Router();
const { Assignment, Schedule } = require('../models/index');

collegeRouter.use(auth);

// Schedule
collegeRouter.get('/schedule', async (req, res) => {
  try {
    const schedule = await Schedule.find({ user: req.user._id }).sort({ day: 1, startTime: 1 });
    res.json(schedule);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

collegeRouter.post('/schedule', async (req, res) => {
  try {
    const item = await Schedule.create({ ...req.body, user: req.user._id });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

collegeRouter.put('/schedule/:id', async (req, res) => {
  try {
    const item = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

collegeRouter.delete('/schedule/:id', async (req, res) => {
  try {
    await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Assignments
collegeRouter.get('/assignments', async (req, res) => {
  try {
    const { completed } = req.query;
    const filter = { user: req.user._id };
    if (completed !== undefined) filter.completed = completed === 'true';
    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

collegeRouter.post('/assignments', async (req, res) => {
  try {
    const a = await Assignment.create({ ...req.body, user: req.user._id });
    res.status(201).json(a);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

collegeRouter.put('/assignments/:id', async (req, res) => {
  try {
    const updates = req.body;
    if (updates.completed && !updates.completedAt) updates.completedAt = new Date();
    const a = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, updates, { new: true }
    );
    res.json(a);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

collegeRouter.delete('/assignments/:id', async (req, res) => {
  try {
    await Assignment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = { projectsRouter, collegeRouter };
