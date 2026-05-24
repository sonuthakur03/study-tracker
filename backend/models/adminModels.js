const mongoose = require('mongoose');

// ── Admin-managed subjects (visible to all users) ────────────────────────────
const adminSubjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  semester:    { type: String, default: '5th' },
  color:       { type: String, default: '#6366F1' },
  description: { type: String },
  topics: [{
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Email settings (singleton — only ever 1 document) ────────────────────────
const emailSettingsSchema = new mongoose.Schema({
  // Admin's custom daily message shown at top of every email
  dailyMessage:    { type: String, default: '' },
  footerText:      { type: String, default: 'Keep going! Every line of code counts. 💜' },
  customSubject:   { type: String, default: '' }, // overrides default subject line if set

  // Toggle email sections on/off
  showStreak:      { type: Boolean, default: true },
  showTasks:       { type: Boolean, default: true },
  showDSA:         { type: Boolean, default: true },
  showRoadmap:     { type: Boolean, default: true },
  showAssignments: { type: Boolean, default: true },
}, { timestamps: true });

// Helper: get or create the single EmailSettings document
emailSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = {
  AdminSubject:  mongoose.model('AdminSubject',  adminSubjectSchema),
  EmailSettings: mongoose.model('EmailSettings', emailSettingsSchema),
};
