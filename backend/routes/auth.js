const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, college, semester } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password, college, semester });
  const token = signToken(user._id);
  res.status(201).json({ token, user });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user._id);
  res.json({ token, user });
}));

// GET /api/auth/me
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
}));

// PUT /api/auth/profile
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const allowed = ['name', 'college', 'semester', 'emailReminders', 'studyTarget', 'selectedPath', 'reminderTime'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
  res.json(user);
}));

// PUT /api/auth/change-password
router.put('/change-password', auth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  const user = await User.findById(req.user._id);
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
}));

// POST /api/auth/log-hours
router.post('/log-hours', auth, asyncHandler(async (req, res) => {
  const { hours } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.logStudyHours(hours);
  await user.save();

  res.json({ user, message: `Logged ${hours} hours` });
}));

module.exports = router;
