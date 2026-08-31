const router = require('express').Router();
const { RoadmapTopic } = require('../models/index');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/roadmap — Get roadmap topics by path
router.get('/', auth, asyncHandler(async (req, res) => {
  const { path } = req.query;
  const uid = req.user._id;
  const filter = path ? { path } : {};
  const topics = await RoadmapTopic.find(filter).sort({ phase: 1, order: 1 });

  const withProgress = topics.map((t) => ({
    ...t.toObject(),
    completed: t.completedBy.some((id) => id.toString() === uid.toString()),
  }));
  res.json(withProgress);
}));

// POST /api/roadmap — Admin creates a topic
router.post('/', adminAuth, asyncHandler(async (req, res) => {
  const topic = await RoadmapTopic.create(req.body);
  res.status(201).json(topic);
}));

// PUT /api/roadmap/:id — Admin updates a topic
router.put('/:id', adminAuth, asyncHandler(async (req, res) => {
  const topic = await RoadmapTopic.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json(topic);
}));

// DELETE /api/roadmap/:id — Admin deletes a topic
router.delete('/:id', adminAuth, asyncHandler(async (req, res) => {
  const topic = await RoadmapTopic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  res.json({ message: 'Deleted' });
}));

// POST /api/roadmap/:id/toggle — User toggles completion status (Atomic with $pull / $addToSet)
router.post('/:id/toggle', auth, asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const topic = await RoadmapTopic.findById(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });

  const isCompleted = topic.completedBy.some((id) => id.toString() === uid.toString());

  const update = isCompleted
    ? { $pull: { completedBy: uid } }
    : { $addToSet: { completedBy: uid } };

  await RoadmapTopic.findByIdAndUpdate(req.params.id, update);

  if (!isCompleted) {
    const phaseField = topic.path === 'aiml' ? 'aimlPhase' : 'dePhase';
    await User.findByIdAndUpdate(uid, { [phaseField]: topic.phase });
  }

  res.json({ completed: !isCompleted });
}));

module.exports = router;
