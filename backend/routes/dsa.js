const router = require('express').Router();
const { DSAQuestion } = require('../models/index');
const { auth, adminAuth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/dsa — Get all questions with user progress
router.get('/', auth, asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const questions = await DSAQuestion.find().sort({ dayNumber: 1 });
  const withProgress = questions.map((q) => ({
    ...q.toObject(),
    completed: q.completedBy.some((id) => id.toString() === uid.toString()),
  }));
  res.json(withProgress);
}));

// POST /api/dsa — Admin adds a question
router.post('/', adminAuth, asyncHandler(async (req, res) => {
  const question = await DSAQuestion.create(req.body);
  res.status(201).json(question);
}));

// PUT /api/dsa/:id — Admin updates a question
router.put('/:id', adminAuth, asyncHandler(async (req, res) => {
  const question = await DSAQuestion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json(question);
}));

// DELETE /api/dsa/:id — Admin deletes a question
router.delete('/:id', adminAuth, asyncHandler(async (req, res) => {
  const question = await DSAQuestion.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json({ message: 'Deleted' });
}));

// POST /api/dsa/:id/toggle — User toggles completion status (Atomic with $pull / $addToSet)
router.post('/:id/toggle', auth, asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const question = await DSAQuestion.findById(req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const isCompleted = question.completedBy.some((id) => id.toString() === uid.toString());

  const update = isCompleted
    ? { $pull: { completedBy: uid } }
    : { $addToSet: { completedBy: uid } };

  await DSAQuestion.findByIdAndUpdate(req.params.id, update);

  res.json({ completed: !isCompleted });
}));

module.exports = router;
