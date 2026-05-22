const router = require('express').Router();
const CollegeSubject = require('../models/CollegeSubject');
const { auth } = require('../middleware/auth');

router.use(auth);

// ── Subjects ─────────────────────────────────────────────────────────────────

// GET all subjects for user
router.get('/', async (req, res) => {
  try {
    const subjects = await CollegeSubject.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create subject
router.post('/', async (req, res) => {
  try {
    const { name, code, semester, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name is required' });
    const subject = await CollegeSubject.create({ user: req.user._id, name, code, semester, color });
    res.status(201).json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update subject (name, code, color, semester)
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'code', 'semester', 'color'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const subject = await CollegeSubject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates, { new: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
  try {
    await CollegeSubject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Topics ────────────────────────────────────────────────────────────────────

// POST add topic to subject
router.post('/:id/topics', async (req, res) => {
  try {
    const { title, notes, order } = req.body;
    if (!title) return res.status(400).json({ message: 'Topic title is required' });
    const subject = await CollegeSubject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    subject.topics.push({ title, notes, order: order ?? subject.topics.length });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT toggle topic complete / update notes
router.put('/:id/topics/:topicId', async (req, res) => {
  try {
    const subject = await CollegeSubject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    const topic = subject.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    if (req.body.title     !== undefined) topic.title     = req.body.title;
    if (req.body.notes     !== undefined) topic.notes     = req.body.notes;
    if (req.body.completed !== undefined) {
      topic.completed   = req.body.completed;
      topic.completedAt = req.body.completed ? new Date() : null;
    }
    await subject.save();
    res.json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE topic
router.delete('/:id/topics/:topicId', async (req, res) => {
  try {
    const subject = await CollegeSubject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    subject.topics = subject.topics.filter(t => t._id.toString() !== req.params.topicId);
    await subject.save();
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
