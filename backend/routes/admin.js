const router = require('express').Router();
const User = require('../models/User');
const { Task, DSAQuestion, RoadmapTopic, Assignment, Announcement } = require('../models/index');
const { AdminSubject, EmailSettings } = require('../models/adminModels');
const { adminAuth } = require('../middleware/auth');
const { sendDailyEmailToUser, sendAssignmentReminderToUser } = require('../services/emailService');

router.use(adminAuth);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDSA, totalTopics, totalTasks, totalSubjects] = await Promise.all([
      User.countDocuments(), DSAQuestion.countDocuments(),
      RoadmapTopic.countDocuments(), Task.countDocuments(), AdminSubject.countDocuments(),
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10)
      .select('name email createdAt streak totalStudyHours');
    res.json({ totalUsers, totalDSA, totalTopics, totalTasks, totalSubjects, recentUsers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['role', 'emailReminders', 'studyTarget'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin Subjects ────────────────────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/subjects', async (req, res) => {
  try {
    const { name, code, semester, color, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name required' });
    const subject = await AdminSubject.create({ name, code, semester, color, description, createdBy: req.user._id });
    res.status(201).json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
router.put('/subjects/:id', async (req, res) => {
  try {
    const subject = await AdminSubject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/subjects/:id', async (req, res) => {
  try {
    await AdminSubject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/subjects/:id/topics', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Topic title required' });
    const subject = await AdminSubject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Not found' });
    subject.topics.push({ title, order: subject.topics.length });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
router.delete('/subjects/:id/topics/:topicId', async (req, res) => {
  try {
    const subject = await AdminSubject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Not found' });
    subject.topics = subject.topics.filter(t => t._id.toString() !== req.params.topicId);
    await subject.save();
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Push assignment to all users ──────────────────────────────────────────────
router.post('/push-assignment', async (req, res) => {
  try {
    const { subject, title, description, dueDate, priority } = req.body;
    if (!subject || !title || !dueDate)
      return res.status(400).json({ message: 'Subject, title and due date required' });
    const users = await User.find({});
    await Assignment.insertMany(users.map(u => ({
      user: u._id, subject, title, description, dueDate, priority: priority || 'medium',
    })));
    const emailUsers = users.filter(u => u.emailReminders);
    let sent = 0;
    for (const u of emailUsers) {
      try { await sendAssignmentReminderToUser(u, { subject, title, dueDate }); sent++; }
      catch (e) { console.error(`Assignment email failed for ${u.email}:`, e.message); }
      await new Promise(r => setTimeout(r, 300));
    }
    res.json({ message: `Pushed to ${users.length} users`, emailsSent: sent });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Email Settings ────────────────────────────────────────────────────────────
router.get('/email-settings', async (req, res) => {
  try {
    const settings = await EmailSettings.getSingleton();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/email-settings', async (req, res) => {
  try {
    const allowed = ['dailyMessage','footerText','customSubject',
                     'showStreak','showTasks','showDSA','showRoadmap','showAssignments'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const settings = await EmailSettings.findOneAndUpdate({}, updates, { new: true, upsert: true });
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ── Announcements ─────────────────────────────────────────────────────────────
router.post('/announce', async (req, res) => {
  try {
    const { title, content, type, sendEmail } = req.body;
    const announcement = await Announcement.create({ title, content, type, createdBy: req.user._id });
    if (sendEmail) {
      const users = await User.find({ emailReminders: true });
      let sent = 0;
      for (const u of users) {
        try { await sendDailyEmailToUser(u, { announcement: { title, content } }); sent++; }
        catch (e) { console.error(`Failed to email ${u.email}:`, e.message); }
        await new Promise(r => setTimeout(r, 300));
      }
      announcement.sentEmail = true;
      await announcement.save();
      return res.json({ announcement, emailsSent: sent });
    }
    res.json({ announcement });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/announcements', async (req, res) => {
  try {
    const list = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Manual email trigger ──────────────────────────────────────────────────────
router.post('/send-daily-email', async (req, res) => {
  try {
    const { userId } = req.body;
    const users = userId ? await User.find({ _id: userId }) : await User.find({ emailReminders: true });
    let sent = 0, failed = 0;
    for (const u of users) {
      try { await sendDailyEmailToUser(u); sent++; }
      catch (err) { console.error(`Email failed for ${u.email}:`, err.message); failed++; }
      await new Promise(r => setTimeout(r, 300));
    }
    res.json({ message: `Sent: ${sent}, Failed: ${failed}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
