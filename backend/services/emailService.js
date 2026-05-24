const { Resend } = require('resend');
const { DSAQuestion, RoadmapTopic, Assignment, Task } = require('../models/index');
const { EmailSettings } = require('../models/adminModels');

const getDayName = () =>
  ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

const getDSAOfDay = async () => {
  const questions = await DSAQuestion.find().sort({ dayNumber: 1 });
  if (!questions.length) return null;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return questions[dayOfYear % questions.length];
};

const getNextTopic = async (user, path) => {
  const phase = path === 'aiml' ? user.aimlPhase : user.dePhase;
  return RoadmapTopic.findOne({
    path, phase: { $gte: phase }, completedBy: { $nin: [user._id] },
  }).sort({ phase: 1, order: 1 });
};

const buildEmailHtml = async (user, options = {}) => {
  const { announcement } = options;

  // Fetch admin email settings
  const cfg = await EmailSettings.getSingleton();

  const dsa       = cfg.showDSA         ? await getDSAOfDay() : null;
  const aimlTopic = cfg.showRoadmap && user.selectedPath !== 'de'   ? await getNextTopic(user, 'aiml') : null;
  const deTopic   = cfg.showRoadmap && user.selectedPath !== 'aiml' ? await getNextTopic(user, 'de')   : null;

  const today = new Date().toISOString().slice(0, 10);
  const [todayTasks, dueAssignments] = await Promise.all([
    cfg.showTasks       ? Task.find({ user: user._id, date: today, completed: false }).limit(5) : Promise.resolve([]),
    cfg.showAssignments ? Assignment.find({
      user: user._id, completed: false,
      dueDate: { $lte: new Date(Date.now() + 3 * 86400000) },
    }).sort({ dueDate: 1 }).limit(5) : Promise.resolve([]),
  ]);

  const taskRows = todayTasks.length
    ? todayTasks.map(t =>
        `<li style="margin:6px 0;color:#334155;">${t.title}
          <span style="background:#EEF2FF;color:#6366F1;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:6px;">${t.type}</span>
        </li>`).join('')
    : '<li style="color:#94A3B8;">No tasks set for today — log in and add some!</li>';

  const assignmentRows = dueAssignments.length
    ? dueAssignments.map(a => {
        const days = Math.ceil((new Date(a.dueDate) - Date.now()) / 86400000);
        const color = days <= 1 ? '#EF4444' : days <= 2 ? '#F59E0B' : '#10B981';
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #F1F5F9;">${a.subject}</td>
          <td style="padding:8px;border-bottom:1px solid #F1F5F9;">${a.title}</td>
          <td style="padding:8px;border-bottom:1px solid #F1F5F9;color:${color};font-weight:600;">
            ${days <= 0 ? 'OVERDUE!' : days === 1 ? 'Tomorrow' : `${days} days`}
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#94A3B8;text-align:center;">No urgent assignments 🎉</td></tr>';

  const announceBlock = announcement
    ? `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-weight:600;color:#92400E;">📢 ${announcement.title || 'Announcement'}</p>
        <p style="margin:0;color:#78350F;">${announcement.content}</p>
      </div>` : '';

  // Admin's custom daily message
  const adminMsgBlock = cfg.dailyMessage
    ? `<div style="background:#EFF6FF;border-left:4px solid #6366F1;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-weight:600;color:#3730A3;">📌 Message from Admin</p>
        <p style="margin:0;color:#1E40AF;">${cfg.dailyMessage}</p>
      </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
    <h1 style="margin:0 0 4px;color:#fff;font-size:26px;">Good Morning, ${user.name}! 🌄</h1>
    <p style="margin:0;color:#C7D2FE;font-size:14px;">${formatDate()}</p>
    ${cfg.showStreak ? `
    <div style="display:flex;justify-content:center;gap:32px;margin-top:16px;">
      <div style="color:#fff;text-align:center;">
        <div style="font-size:24px;font-weight:700;">${user.streak || 0}</div>
        <div style="font-size:12px;color:#C7D2FE;">Day Streak 🔥</div>
      </div>
      <div style="color:#fff;text-align:center;">
        <div style="font-size:24px;font-weight:700;">${Math.round(user.totalStudyHours || 0)}</div>
        <div style="font-size:12px;color:#C7D2FE;">Total Hours</div>
      </div>
      <div style="color:#fff;text-align:center;">
        <div style="font-size:24px;font-weight:700;">${user.studyTarget || 2}h</div>
        <div style="font-size:12px;color:#C7D2FE;">Today's Target</div>
      </div>
    </div>` : ''}
  </div>

  ${adminMsgBlock}
  ${announceBlock}

  ${cfg.showTasks ? `
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 16px;font-size:16px;color:#0F172A;">📋 Today's Tasks</h2>
    <ul style="margin:0;padding-left:20px;">${taskRows}</ul>
  </div>` : ''}

  ${dsa ? `
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:16px;color:#0F172A;">💻 DSA Challenge — Day ${dsa.dayNumber || '?'}</h2>
    <p style="margin:0 0 12px;color:#64748B;font-size:13px;">${dsa.topic}</p>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px;border-left:4px solid ${dsa.difficulty==='Easy'?'#10B981':dsa.difficulty==='Medium'?'#F59E0B':'#EF4444'};">
      <div style="margin-bottom:8px;">
        <span style="font-weight:600;color:#0F172A;margin-right:8px;">${dsa.title}</span>
        <span style="background:${dsa.difficulty==='Easy'?'#DCFCE7':dsa.difficulty==='Medium'?'#FEF3C7':'#FEE2E2'};
          color:${dsa.difficulty==='Easy'?'#166534':dsa.difficulty==='Medium'?'#92400E':'#991B1B'};
          padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">${dsa.difficulty}</span>
      </div>
      ${dsa.description ? `<p style="margin:0 0 10px;color:#475569;font-size:14px;">${dsa.description}</p>` : ''}
      ${dsa.resourceUrl ? `<a href="${dsa.resourceUrl}" style="background:#6366F1;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block;">Solve on ${dsa.platform} →</a>` : ''}
    </div>
  </div>` : ''}

  ${aimlTopic ? `
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:16px;color:#0F172A;">🤖 AI/ML — Next Topic</h2>
    <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Phase ${aimlTopic.phase}: ${aimlTopic.phaseTitle}</p>
    <p style="margin:0;font-weight:500;color:#0F172A;">${aimlTopic.title}</p>
  </div>` : ''}

  ${deTopic ? `
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 4px;font-size:16px;color:#0F172A;">⚙️ Data Engineering — Next Topic</h2>
    <p style="margin:0 0 6px;color:#64748B;font-size:13px;">Phase ${deTopic.phase}: ${deTopic.phaseTitle}</p>
    <p style="margin:0;font-weight:500;color:#0F172A;">${deTopic.title}</p>
  </div>` : ''}

  ${cfg.showAssignments ? `
  <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <h2 style="margin:0 0 16px;font-size:16px;color:#0F172A;">🎓 Upcoming Assignments</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#F8FAFC;">
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Subject</th>
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Title</th>
        <th style="padding:8px;text-align:left;color:#64748B;font-weight:600;">Due</th>
      </tr></thead>
      <tbody>${assignmentRows}</tbody>
    </table>
  </div>` : ''}

  <div style="text-align:center;color:#94A3B8;font-size:13px;padding-bottom:16px;">
    <p style="margin:0 0 4px;">${cfg.footerText || 'Keep going! Every line of code counts. 💜'}</p>
    <p style="margin:0;">StudyTrack Nepal 🇳🇵</p>
  </div>
</div>
</body>
</html>`;
};

// ── Send daily email ───────────────────────────────────────────────────────────
const sendDailyEmailToUser = async (user, options = {}) => {
  if (!user.emailReminders) return;
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set — skipping email for', user.email);
    return;
  }
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const cfg     = await EmailSettings.getSingleton();
  const html    = await buildEmailHtml(user, options);
  const subject = cfg.customSubject
    ? cfg.customSubject.replace('{{name}}', user.name).replace('{{day}}', getDayName())
    : `📚 Good Morning ${user.name}! Study plan for ${getDayName()}`;

  const { data, error } = await resend.emails.send({
    from:    'StudyTrack Nepal <onboarding@resend.dev>',
    to:      user.email,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
  console.log(`✅ Daily email sent to ${user.email} — id: ${data.id}`);
};

// ── Send assignment reminder ───────────────────────────────────────────────────
const sendAssignmentReminderToUser = async (user, assignment) => {
  if (!user.emailReminders) return;
  if (!process.env.RESEND_API_KEY) return;

  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dueDate = new Date(assignment.dueDate);
  const days    = Math.ceil((dueDate - Date.now()) / 86400000);
  const urgency = days <= 1 ? '#EF4444' : days <= 2 ? '#F59E0B' : '#6366F1';
  const dueLabel = days <= 0 ? 'OVERDUE!' : days === 1 ? 'Due Tomorrow!' : `Due in ${days} days`;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,sans-serif;">
<div style="max-width:500px;margin:0 auto;padding:24px 16px;">
  <div style="background:${urgency};border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
    <h1 style="margin:0 0 6px;color:#fff;font-size:22px;">📚 Assignment Reminder</h1>
    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">${dueLabel}</p>
  </div>
  <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Subject</p>
    <p style="margin:0 0 16px;font-weight:600;color:#0F172A;font-size:16px;">${assignment.subject}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Assignment</p>
    <p style="margin:0 0 16px;font-weight:600;color:#0F172A;font-size:16px;">${assignment.title}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#64748B;">Due Date</p>
    <p style="margin:0;font-weight:600;color:${urgency};font-size:16px;">
      ${dueDate.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
    </p>
  </div>
  <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:16px;">StudyTrack Nepal 🇳🇵</p>
</div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from:    'StudyTrack Nepal <onboarding@resend.dev>',
    to:      user.email,
    subject: `⚠️ Assignment ${dueLabel}: ${assignment.title} — ${assignment.subject}`,
    html,
  });
  if (error) throw new Error(error.message);
  console.log(`✅ Assignment reminder sent to ${user.email}`);
};

module.exports = { sendDailyEmailToUser, sendAssignmentReminderToUser };
