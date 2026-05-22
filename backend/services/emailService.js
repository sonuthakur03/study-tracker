const nodemailer = require('nodemailer');
const { DSAQuestion, RoadmapTopic, Assignment, Task } = require('../models/index');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const getDayName = () =>
  ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

// Get a DSA question of the day (cycles through questions by day of year)
const getDSAOfDay = async () => {
  const questions = await DSAQuestion.find().sort({ dayNumber: 1 });
  if (!questions.length) return null;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return questions[dayOfYear % questions.length];
};

// Get next roadmap topic for user
const getNextTopic = async (user, path) => {
  const phase = path === 'aiml' ? user.aimlPhase : user.dePhase;
  const topic = await RoadmapTopic.findOne({
    path,
    phase: { $gte: phase },
    completedBy: { $nin: [user._id] },
  }).sort({ phase: 1, order: 1 });
  return topic;
};

const buildEmailHtml = async (user, options = {}) => {
  const { announcement } = options;
  const dsa = await getDSAOfDay();
  const aimlTopic = user.selectedPath !== 'de' ? await getNextTopic(user, 'aiml') : null;
  const deTopic = user.selectedPath !== 'aiml' ? await getNextTopic(user, 'de') : null;

  const today = new Date().toISOString().slice(0, 10);
  const [todayTasks, dueAssignments] = await Promise.all([
    Task.find({ user: user._id, date: today, completed: false }).limit(5),
    Assignment.find({ user: user._id, completed: false, dueDate: { $lte: new Date(Date.now() + 3 * 86400000) } }).sort({ dueDate: 1 }).limit(3),
  ]);

  const taskRows = todayTasks.length
    ? todayTasks.map(t => `<li style="margin:6px 0;color:#334155;">${t.title} <span style="background:#EEF2FF;color:#6366F1;padding:2px 8px;border-radius:12px;font-size:11px;">${t.type}</span></li>`).join('')
    : '<li style="color:#94A3B8;">No tasks set for today. Add some!</li>';

  const assignmentRows = dueAssignments.length
    ? dueAssignments.map(a => {
        const due = new Date(a.dueDate);
        const days = Math.ceil((due - Date.now()) / 86400000);
        const urgency = days <= 1 ? '#EF4444' : days <= 2 ? '#F59E0B' : '#10B981';
        return `<tr><td style="padding:8px;border-bottom:1px solid #F1F5F9;">${a.subject}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;">${a.title}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;color:${urgency};font-weight:600;">${days <= 0 ? 'OVERDUE' : days === 1 ? 'Tomorrow' : `${days} days`}</td></tr>`;
      }).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#94A3B8;text-align:center;">No urgent assignments</td></tr>';

  const announceBlock = announcement
    ? `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-weight:600;color:#92400E;">📢 Announcement</p>
        <p style="margin:0;color:#78350F;">${announcement.content}</p>
      </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
    <h1 style="margin:0 0 4px;color:#fff;font-size:28px;">Good Morning, ${user.name}! 🌄</h1>
    <p style="margin:0;color:#C7D2FE;font-size:15px;">${formatDate()}</p>
    <div style="display:inline-flex;gap:24px;margin-top:16px;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 24px;">
      <div style="color:#fff;text-align:center;">
        <div style="font-size:22px;font-weight:700;">${user.streak}</div>
        <div style="font-size:12px;color:#C7D2FE;">Day Streak 🔥</div>
      </div>
      <div style="color:#fff;text-align:center;">
        <div style="font-size:22px;font-weight:700;">${Math.round(user.totalStudyHours)}</div>
        <div style="font-size:12px;color:#C7D2FE;">Total Hours</div>
      </div>
      <div style="color:#fff;text-align:center;">
        <div style="font-size:22px;font-weight:700;">${user.studyTarget}</div>
        <div style="font-size:12px;color:#C7D2FE;">Target Today</div>
      </div>
    </div>
  </div>

  ${announceBlock}

  <!-- Today's Tasks -->
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 16px;font-size:17px;color:#0F172A;">📋 Today's Tasks</h2>
    <ul style="margin:0;padding-left:20px;">${taskRows}</ul>
  </div>

  <!-- DSA Question -->
  ${dsa ? `<div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:17px;color:#0F172A;">💻 DSA Challenge — Day ${dsa.dayNumber || '?'}</h2>
    <p style="margin:0 0 12px;color:#64748B;font-size:13px;">${dsa.topic}</p>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px;border-left:4px solid ${dsa.difficulty==='Easy'?'#10B981':dsa.difficulty==='Medium'?'#F59E0B':'#EF4444'};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-weight:600;color:#0F172A;">${dsa.title}</span>
        <span style="background:${dsa.difficulty==='Easy'?'#DCFCE7':dsa.difficulty==='Medium'?'#FEF3C7':'#FEE2E2'};color:${dsa.difficulty==='Easy'?'#166534':dsa.difficulty==='Medium'?'#92400E':'#991B1B'};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">${dsa.difficulty}</span>
      </div>
      ${dsa.description ? `<p style="margin:0 0 10px;color:#475569;font-size:14px;">${dsa.description}</p>` : ''}
      ${dsa.resourceUrl ? `<a href="${dsa.resourceUrl}" style="background:#6366F1;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Solve on ${dsa.platform} →</a>` : ''}
    </div>
  </div>` : ''}

  <!-- Roadmap Progress -->
  ${aimlTopic ? `<div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:17px;color:#0F172A;">🤖 AI/ML — Next Topic</h2>
    <p style="margin:0 0 8px;color:#64748B;font-size:13px;">Phase ${aimlTopic.phase}: ${aimlTopic.phaseTitle}</p>
    <p style="margin:0;color:#0F172A;font-size:15px;font-weight:500;">${aimlTopic.title}</p>
    ${aimlTopic.description ? `<p style="margin:8px 0 0;color:#64748B;font-size:14px;">${aimlTopic.description}</p>` : ''}
  </div>` : ''}

  ${deTopic ? `<div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:17px;color:#0F172A;">⚙️ Data Engineering — Next Topic</h2>
    <p style="margin:0 0 8px;color:#64748B;font-size:13px;">Phase ${deTopic.phase}: ${deTopic.phaseTitle}</p>
    <p style="margin:0;color:#0F172A;font-size:15px;font-weight:500;">${deTopic.title}</p>
  </div>` : ''}

  <!-- College Assignments -->
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 16px;font-size:17px;color:#0F172A;">🎓 Upcoming Assignments</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#F8FAFC;">
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Subject</th>
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Title</th>
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Due</th>
      </tr></thead>
      <tbody>${assignmentRows}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align:center;color:#94A3B8;font-size:13px;">
    <p>Keep going, ${user.name}! Every line of code counts. 💜</p>
    <p>StudyTrack Nepal · <a href="#" style="color:#6366F1;">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
};

const sendDailyEmailToUser = async (user, options = {}) => {
  if (!user.emailReminders) return;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email credentials not configured — skipping email for', user.email);
    return;
  }
  const transporter = createTransporter();
  const html = await buildEmailHtml(user, options);
  await transporter.sendMail({
    from: `"${process.env.APP_NAME || 'StudyTrack'}" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `📚 Good Morning ${user.name}! Here's your study plan for ${getDayName()}`,
    html,
  });
  console.log(`✅ Email sent to ${user.email}`);
};

module.exports = { sendDailyEmailToUser };
