const router = require('express').Router();
const User = require('../models/User');
const { Task, DSAQuestion, RoadmapTopic, Assignment, Announcement } = require('../models/index');
const { adminAuth } = require('../middleware/auth');
const { sendDailyEmailToUser } = require('../services/emailService');

router.use(adminAuth);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDSA, totalTopics, totalTasks] = await Promise.all([
      User.countDocuments(),
      DSAQuestion.countDocuments(),
      RoadmapTopic.countDocuments(),
      Task.countDocuments(),
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10).select('name email createdAt streak totalStudyHours');
    res.json({ totalUsers, totalDSA, totalTopics, totalTasks, recentUsers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['role', 'emailReminders', 'studyTarget'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/announce
router.post('/announce', async (req, res) => {
  try {
    const { title, content, type, sendEmail } = req.body;
    const announcement = await Announcement.create({ title, content, type, createdBy: req.user._id });

    if (sendEmail) {
      const users = await User.find({ emailReminders: true });
      let sent = 0;
      for (const u of users) {
        try {
          await sendDailyEmailToUser(u, { announcement: { title, content } });
          sent++;
        } catch (e) { console.error(`Failed to email ${u.email}:`, e.message); }
      }
      announcement.sentEmail = true;
      await announcement.save();
      return res.json({ announcement, emailsSent: sent });
    }
    res.json({ announcement });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    const list = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/send-daily-email — manually trigger for a user or all
router.post('/send-daily-email', async (req, res) => {
  try {
    const { userId } = req.body;
    const users = userId
      ? await User.find({ _id: userId })
      : await User.find({ emailReminders: true });

    let sent = 0, failed = 0;
    for (const u of users) {
      try {
        await sendDailyEmailToUser(u);
        sent++;
      } catch (e) {
        console.error(`Email failed for ${u.email}:`, e.message);
        failed++;
      }
    }
    res.json({ message: `Sent: ${sent}, Failed: ${failed}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
