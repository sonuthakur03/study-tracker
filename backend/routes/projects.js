const router = require('express').Router();
const { Project } = require('../models/index');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

router.use(auth);

// GET /api/projects — User views own projects
router.get('/', asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
  res.json(projects);
}));

// POST /api/projects — User creates project
router.post('/', asyncHandler(async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: 'Project title is required' });
  }
  const project = await Project.create({ ...req.body, user: req.user._id });
  res.status(201).json(project);
}));

// PUT /api/projects/:id — User updates own project
router.put('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}));

// DELETE /api/projects/:id — User deletes own project
router.delete('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ message: 'Deleted' });
}));

module.exports = router;
