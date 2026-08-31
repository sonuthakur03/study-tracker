const cron = require('node-cron');
const User = require('../models/User');
const { Assignment, VideoCreditState } = require('../models/index');
const {
  sendDailyEmailToUser,
  sendAssignmentReminderToUser,
  sendBatchEmails,
} = require('./emailService');

const startCronJobs = () => {
  console.log('⏰ Cron jobs registered');

  // Daily morning email — 7:00 AM Nepal Time (1:15 AM UTC)
  cron.schedule(
    '15 1 * * *',
    async () => {
      console.log('📧 Running daily email job —', new Date().toISOString());
      try {
        const users = await User.find({ emailReminders: true });
        const sent = await sendBatchEmails(users, (u) => sendDailyEmailToUser(u), 400);
        console.log(`✅ Daily emails done — Sent: ${sent}`);
      } catch (err) {
        console.error('❌ Daily email cron error:', err);
      }
    },
    { timezone: 'UTC' }
  );

  // Assignment reminders — 6:00 PM Nepal Time (12:15 PM UTC)
  cron.schedule(
    '15 12 * * *',
    async () => {
      console.log('📅 Running assignment reminder job —', new Date().toISOString());
      try {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const now = new Date();

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
            await new Promise((r) => setTimeout(r, 400));
          } catch (err) {
            console.error(`❌ Assignment reminder failed for ${user.email}:`, err.message);
          }
        }
        console.log(`✅ Assignment reminders done — Sent: ${sent}`);
      } catch (err) {
        console.error('❌ Assignment reminder cron error:', err);
      }
    },
    { timezone: 'UTC' }
  );

  // Streak reset — midnight Nepal Time (6:15 PM UTC)
  cron.schedule(
    '15 18 * * *',
    async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const result = await User.updateMany(
          { lastStudyDate: { $lt: yesterday }, streak: { $gt: 0 } },
          { $set: { streak: 0 } }
        );
        console.log(`✅ Streak reset for ${result.modifiedCount} users`);
      } catch (err) {
        console.error('❌ Streak reset error:', err);
      }
    },
    { timezone: 'UTC' }
  );

  // Reset todayStudyHours — 12:01 AM Nepal (6:16 PM UTC)
  cron.schedule(
    '16 18 * * *',
    async () => {
      try {
        const res = await User.updateMany({}, { $set: { todayStudyHours: 0 } });
        console.log(`✅ Daily study hours reset for ${res.modifiedCount} users`);
      } catch (err) {
        console.error('❌ Study hours reset error:', err);
      }
    },
    { timezone: 'UTC' }
  );

  // Monthly AI Video Credit Pool Reset — 12:00 AM on 1st of month (18:15 UTC previous day)
  cron.schedule(
    '15 18 28-31 * *',
    async () => {
      try {
        const now = new Date();
        // Check if tomorrow in UTC (or current in NPT) is the 1st of a new month
        const nextDay = new Date(now.getTime() + 6 * 60 * 60 * 1000); // adjust forward into NPT
        if (nextDay.getDate() === 1) {
          const year = nextDay.getFullYear();
          const month = String(nextDay.getMonth() + 1).padStart(2, '0');
          const yearMonth = `${year}-${month}`;
          await VideoCreditState.findOneAndUpdate(
            { yearMonth },
            { monthlyPoolTotal: 1000, monthlyPoolUsed: 0, totalClipsGenerated: 0 },
            { upsert: true, setDefaultsOnInsert: true }
          );
          console.log(`✅ Monthly AI Video Credit Pool (1,000 credits) initialized for ${yearMonth}`);
        }
      } catch (err) {
        console.error('❌ Monthly credit pool reset error:', err);
      }
    },
    { timezone: 'UTC' }
  );
};

module.exports = { startCronJobs };
