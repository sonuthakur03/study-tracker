const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { Task, DSAQuestion, RoadmapTopic, Assignment, Schedule, Announcement } = require('../models/index');
const { AdminSubject, EmailSettings } = require('../models/adminModels');
const { adminAuth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { sendDailyEmailToUser, sendAssignmentReminderToUser, sendBatchEmails } = require('../services/emailService');

router.use(adminAuth);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', asyncHandler(async (req, res) => {
  const [totalUsers, totalDSA, totalTopics, totalTasks, totalSubjects] = await Promise.all([
    User.countDocuments(),
    DSAQuestion.countDocuments(),
    RoadmapTopic.countDocuments(),
    Task.countDocuments(),
    AdminSubject.countDocuments(),
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email createdAt streak totalStudyHours');

  res.json({ totalUsers, totalDSA, totalTopics, totalTasks, totalSubjects, recentUsers });
}));

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const allowed = ['role', 'emailReminders', 'studyTarget'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

// DELETE /users/:id — Delete user with cascading cleanup (ACID Consistency)
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  const user = await User.findByIdAndDelete(targetId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Cascading cleanup of user-associated data for referential integrity
  await Promise.all([
    Task.deleteMany({ user: targetId }),
    Project.deleteMany({ user: targetId }),
    Assignment.deleteMany({ user: targetId }),
    Schedule.deleteMany({ user: targetId }),
    DSAQuestion.updateMany({ completedBy: targetId }, { $pull: { completedBy: targetId } }),
    RoadmapTopic.updateMany({ completedBy: targetId }, { $pull: { completedBy: targetId } }),
    AdminSubject.updateMany({}, { $pull: { 'topics.$[].completedBy': targetId } }),
  ]);

  res.json({ message: 'User and all associated data deleted successfully' });
}));

// ── Admin Subjects ────────────────────────────────────────────────────────────
router.get('/subjects', asyncHandler(async (req, res) => {
  const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 });
  res.json(subjects);
}));

router.post('/subjects', asyncHandler(async (req, res) => {
  const { name, code, semester, color, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Subject name required' });

  const subject = await AdminSubject.create({
    name,
    code,
    semester,
    color,
    description,
    createdBy: req.user._id,
  });
  res.status(201).json(subject);
}));

router.put('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await AdminSubject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
}));

router.delete('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await AdminSubject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json({ message: 'Subject deleted' });
}));

// Topics inside a subject
router.post('/subjects/:id/topics', asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Topic title required' });

  const subject = await AdminSubject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  subject.topics.push({ title, order: subject.topics.length });
  await subject.save();
  res.status(201).json(subject);
}));

router.delete('/subjects/:id/topics/:topicId', asyncHandler(async (req, res) => {
  const subject = await AdminSubject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  subject.topics = subject.topics.filter((t) => t._id.toString() !== req.params.topicId);
  await subject.save();
  res.json(subject);
}));

// Resources inside a subject
router.post('/subjects/:id/resources', asyncHandler(async (req, res) => {
  const { name, url, resourceType, language } = req.body;
  if (!name || !url) return res.status(400).json({ message: 'Name and URL required' });

  const resource = {
    _id: new mongoose.Types.ObjectId(),
    name,
    url,
    resourceType: resourceType || 'video',
    language: language || 'English',
  };

  const subject = await AdminSubject.findByIdAndUpdate(
    req.params.id,
    { $push: { resources: resource } },
    { new: true }
  );

  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.status(201).json(subject);
}));

router.delete('/subjects/:id/resources/:resourceId', asyncHandler(async (req, res) => {
  const subject = await AdminSubject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  subject.resources = subject.resources.filter((r) => r._id.toString() !== req.params.resourceId);
  await subject.save();
  res.json(subject);
}));

// ── Push assignment to all users ──────────────────────────────────────────────
router.post('/push-assignment', asyncHandler(async (req, res) => {
  const { subject, title, description, dueDate, priority } = req.body;
  if (!subject || !title || !dueDate) {
    return res.status(400).json({ message: 'Subject, title and due date required' });
  }

  const users = await User.find({ role: 'user' });
  if (users.length > 0) {
    await Assignment.insertMany(
      users.map((u) => ({
        user: u._id,
        subject,
        title,
        description,
        dueDate,
        priority: priority || 'medium',
      }))
    );
  }

  const emailUsers = users.filter((u) => u.emailReminders);
  const sent = await sendBatchEmails(emailUsers, (u) =>
    sendAssignmentReminderToUser(u, { subject, title, dueDate })
  );

  res.json({ message: `Pushed to ${users.length} users`, emailsSent: sent });
}));

// ── Email Settings ────────────────────────────────────────────────────────────
router.get('/email-settings', asyncHandler(async (req, res) => {
  const settings = await EmailSettings.getSingleton();
  res.json(settings);
}));

router.put('/email-settings', asyncHandler(async (req, res) => {
  const allowed = [
    'dailyMessage',
    'footerText',
    'customSubject',
    'showStreak',
    'showTasks',
    'showDSA',
    'showRoadmap',
    'showAssignments',
  ];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const settings = await EmailSettings.findOneAndUpdate({}, updates, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
  res.json(settings);
}));

// ── Announcements ─────────────────────────────────────────────────────────────
router.post('/announce', asyncHandler(async (req, res) => {
  const { title, content, type, sendEmail } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content required' });
  }

  const announcement = await Announcement.create({
    title,
    content,
    type,
    createdBy: req.user._id,
  });

  if (sendEmail) {
    const users = await User.find({ emailReminders: true });
    const sent = await sendBatchEmails(users, (u) =>
      sendDailyEmailToUser(u, { announcement: { title, content } })
    );

    announcement.sentEmail = true;
    await announcement.save();
    return res.json({ announcement, emailsSent: sent });
  }

  res.json({ announcement });
}));

router.get('/announcements', asyncHandler(async (req, res) => {
  const list = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
  res.json(list);
}));

// ── Manual email trigger ──────────────────────────────────────────────────────
router.post('/send-daily-email', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const users = userId ? await User.find({ _id: userId }) : await User.find({ emailReminders: true });

  const sent = await sendBatchEmails(users, (u) => sendDailyEmailToUser(u));
  res.json({ message: `Daily emails sent to ${sent} users` });
}));

module.exports = router;
