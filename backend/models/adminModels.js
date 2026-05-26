const mongoose = require('mongoose');

// ── Admin-managed subjects (visible to all users) ────────────────────────────
const adminSubjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  semester:    { type: String, default: '5th' },
  color:       { type: String, default: '#6366F1' },
  description: { type: String },
  topics: [{
    title:       { type: String, required: true },
    order:       { type: Number, default: 0 },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Email settings (singleton) ────────────────────────────────────────────────
const emailSettingsSchema = new mongoose.Schema({
  dailyMessage:    { type: String, default: '' },
  footerText:      { type: String, default: 'Keep going! Every line of code counts. 💜' },
  customSubject:   { type: String, default: '' },
  showStreak:      { type: Boolean, default: true },
  showTasks:       { type: Boolean, default: true },
  showDSA:         { type: Boolean, default: true },
  showRoadmap:     { type: Boolean, default: true },
  showAssignments: { type: Boolean, default: true },
}, { timestamps: true });

emailSettingsSchema.statics.getSingleton = async function () {
  let s = await this.findOne();
  if (!s) s = await this.create({});
  return s;
};

module.exports = {
  AdminSubject:  mongoose.model('AdminSubject',  adminSubjectSchema),
  EmailSettings: mongoose.model('EmailSettings', emailSettingsSchema),
};
