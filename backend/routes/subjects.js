const router   = require('express').Router();
const { auth } = require('../middleware/auth');
const { AdminSubject } = require('../models/adminModels');

router.use(auth);

// ── GET all admin subjects with per-user completion status ────────────────────
router.get('/', async (req, res) => {
  try {
    const uid      = req.user._id;
    const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 });

    const withProgress = subjects.map(s => ({
      ...s.toObject(),
      topics: s.topics.map(t => ({
        ...t.toObject(),
        completed:   t.completedBy.map(id => id.toString()).includes(uid.toString()),
        completedBy: undefined, // don't expose to client
      })),
    }));

    res.json(withProgress);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST toggle a topic complete for current user ─────────────────────────────
router.post('/:subjectId/topics/:topicId/toggle', async (req, res) => {
  try {
    const uid     = req.user._id;
    const subject = await AdminSubject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const topic = subject.topics.id(req.params.topicId);
    if (!topic)   return res.status(404).json({ message: 'Topic not found' });

    const idx = topic.completedBy.map(id => id.toString()).indexOf(uid.toString());
    if (idx > -1) topic.completedBy.splice(idx, 1);
    else          topic.completedBy.push(uid);

    await subject.save();

    res.json({
      completed: idx === -1,
      topicId:   topic._id,
      message:   idx === -1 ? 'Topic marked complete ✅' : 'Marked incomplete',
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
