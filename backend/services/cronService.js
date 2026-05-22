const cron = require('node-cron');
const User = require('../models/User');
const { sendDailyEmailToUser } = require('./emailService');

// Nepal time is UTC+5:45
// 7:00 AM NPT = 1:15 AM UTC → cron: "15 1 * * *"
// 7:00 AM NPT for Render (which runs UTC): 15 1 * * *

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
          // Small delay to avoid Gmail rate limits
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error(`❌ Email failed for ${user.email}:`, err.message);
          failed++;
        }
      }
      console.log(`✅ Daily emails done — Sent: ${sent}, Failed: ${failed}`);
    } catch (err) {
      console.error('❌ Cron job error:', err);
    }
  }, {
    timezone: 'UTC'
  });

  // Daily streak reset check — midnight Nepal time (6:15 PM UTC previous day)
  cron.schedule('15 18 * * *', async () => {
    console.log('🔄 Running streak check —', new Date().toISOString());
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Reset streak for users who didn't study yesterday
      const result = await User.updateMany(
        {
          lastStudyDate: { $lt: yesterday },
          streak: { $gt: 0 },
        },
        { $set: { streak: 0, todayStudyHours: 0 } }
      );
      console.log(`✅ Streak reset for ${result.modifiedCount} users`);
    } catch (err) {
      console.error('❌ Streak reset error:', err);
    }
  }, { timezone: 'UTC' });

  // Reset todayStudyHours at midnight Nepal (6:15 PM UTC)
  cron.schedule('16 18 * * *', async () => {
    await User.updateMany({}, { $set: { todayStudyHours: 0 } });
    console.log('✅ Daily study hours reset');
  }, { timezone: 'UTC' });
};

module.exports = { startCronJobs };
