const cron = require('node-cron');
const User = require('../models/User');
const { Assignment } = require('../models/index');
const { sendDailyEmailToUser, sendAssignmentReminderToUser } = require('./emailService');

const startCronJobs = () => {
  console.log('⏰ Cron jobs registered');

  // Daily morning email — 7:00 AM Nepal Time (1:15 AM UTC)
  cron.schedule('15 1 * * *', async () => {
    console.log('📧 Running daily email job —', new Date().toISOString());
    try {
      const users = await User.find({ emailReminders: true });
      let sent = 0, failed = 0;
      for (const user of users) {
        try {
          await sendDailyEmailToUser(user);
          sent++;
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error(`❌ Email failed for ${user.email}:`, err.message);
          failed++;
        }
      }
      console.log(`✅ Daily emails done — Sent: ${sent}, Failed: ${failed}`);
    } catch (err) { console.error('❌ Daily email cron error:', err); }
  }, { timezone: 'UTC' });

  // Assignment reminders — 6:00 PM Nepal Time (12:15 PM UTC)
  // Sends reminders for assignments due within the next 24 hours
  cron.schedule('15 12 * * *', async () => {
    console.log('📅 Running assignment reminder job —', new Date().toISOString());
    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const now      = new Date();

      // Find all incomplete assignments due within 24 hours
      const dueAssignments = await Assignment.find({
        completed: false,
        dueDate: { $gte: now, $lte: tomorrow },
      }).populate('user');

      let sent = 0;
      for (const assignment of dueAssignments) {
        const user = assignment.user;
        if (!user || !user.emailReminders) continue;
        try {
          await sendAssignmentReminderToUser(user, assignment);
          sent++;
          await new Promise(r => setTimeout(r, 400));
        } catch (err) {
          console.error(`❌ Assignment reminder failed for ${user.email}:`, err.message);
        }
      }
      console.log(`✅ Assignment reminders done — Sent: ${sent}`);
    } catch (err) { console.error('❌ Assignment reminder cron error:', err); }
  }, { timezone: 'UTC' });

  // Streak reset — midnight Nepal Time (6:15 PM UTC)
  cron.schedule('15 18 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const result = await User.updateMany(
        { lastStudyDate: { $lt: yesterday }, streak: { $gt: 0 } },
        { $set: { streak: 0 } }
      );
      console.log(`✅ Streak reset for ${result.modifiedCount} users`);
    } catch (err) { console.error('❌ Streak reset error:', err); }
  }, { timezone: 'UTC' });

  // Reset todayStudyHours — 12:01 AM Nepal (6:16 PM UTC)
  cron.schedule('16 18 * * *', async () => {
    await User.updateMany({}, { $set: { todayStudyHours: 0 } });
    console.log('✅ Daily study hours reset');
  }, { timezone: 'UTC' });
};

module.exports = { startCronJobs };
