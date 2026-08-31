const router = require('express').Router();
const { Task } = require('../models/index');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.use(auth);

// GET /api/tasks — Users see their own tasks
router.get('/', asyncHandler(async (req, res) => {
  const { date, type, completed } = req.query;
  const filter = { user: req.user._id };
  if (date) filter.date = date;
  if (type) filter.type = type;
  if (completed !== undefined) filter.completed = completed === 'true';

  const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 });
  res.json(tasks);
}));

// PUT /api/tasks/:id — Users toggle complete or update their own tasks
router.put('/:id', asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.completed && !updates.completedAt) {
    updates.completedAt = new Date();
  } else if (updates.completed === false) {
    updates.completedAt = null;
  }

  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };

  const task = await Task.findOneAndUpdate(
    query,
    updates,
    { new: true, runValidators: true }
  );

  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}));

// POST /api/tasks — Users create their own tasks; Admin can also push to specific user or all users
router.post('/', asyncHandler(async (req, res) => {
  const { userId, pushToAll, ...taskData } = req.body;
  if (!taskData.title || !taskData.title.trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  // Admin push to all users
  if (pushToAll && req.user.role === 'admin') {
    const users = await User.find({ role: 'user' }).select('_id');
    const docs = users.map((u) => ({ ...taskData, user: u._id }));
    if (docs.length > 0) {
      await Task.insertMany(docs);
    }
    return res.status(201).json({ message: `Task pushed to ${users.length} users` });
  }

  // Admin assigning to a specific user, otherwise assigned to the requesting user
  const targetUser = (req.user.role === 'admin' && userId) ? userId : req.user._id;
  const task = await Task.create({ ...taskData, user: targetUser });
  res.status(201).json(task);
}));

// DELETE /api/tasks/:id — Users delete their own tasks; Admins can delete any task
router.delete('/:id', asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const task = await Task.findOneAndDelete(query);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
}));

module.exports = router;
