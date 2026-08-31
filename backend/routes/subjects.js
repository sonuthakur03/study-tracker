const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { AdminSubject } = require('../models/adminModels');
const asyncHandler = require('../middleware/asyncHandler');

router.use(auth);

// GET /api/subjects — Get all admin subjects with per-user completion status
router.get('/', asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 });

  const withProgress = subjects.map((s) => ({
    ...s.toObject(),
    topics: s.topics.map((t) => ({
      ...t.toObject(),
      completed: t.completedBy.some((id) => id.toString() === uid.toString()),
      completedBy: undefined, // do not expose IDs to client
    })),
  }));

  res.json(withProgress);
}));

// POST /api/subjects/:subjectId/topics/:topicId/toggle — User toggles topic complete (Atomic)
router.post('/:subjectId/topics/:topicId/toggle', asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const { subjectId, topicId } = req.params;

  const subject = await AdminSubject.findById(subjectId);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const topic = subject.topics.id(topicId);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });

  const isCompleted = topic.completedBy.some((id) => id.toString() === uid.toString());

  if (isCompleted) {
    await AdminSubject.updateOne(
      { _id: subjectId, 'topics._id': topicId },
      { $pull: { 'topics.$.completedBy': uid } }
    );
  } else {
    await AdminSubject.updateOne(
      { _id: subjectId, 'topics._id': topicId },
      { $addToSet: { 'topics.$.completedBy': uid } }
    );
  }

  res.json({
    completed: !isCompleted,
    topicId,
    message: !isCompleted ? 'Topic marked complete ✅' : 'Marked incomplete',
  });
}));

module.exports = router;
