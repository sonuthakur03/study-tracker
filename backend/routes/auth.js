const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college, semester } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, college, semester });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'college', 'semester', 'emailReminders', 'studyTarget', 'selectedPath', 'reminderTime'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/log-hours
router.post('/log-hours', auth, async (req, res) => {
  try {
    const { hours } = req.body;
    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    user.totalStudyHours += hours;
    if (lastStudy === today) {
      user.todayStudyHours += hours;
    } else {
      user.todayStudyHours = hours;
      if (lastStudy === yesterday) {
        user.streak += 1;
        if (user.streak > user.longestStreak) user.longestStreak = user.streak;
      } else if (lastStudy !== today) {
        user.streak = 1;
      }
    }
    user.lastStudyDate = new Date();
    await user.save();
    res.json({ user, message: `Logged ${hours} hours` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
