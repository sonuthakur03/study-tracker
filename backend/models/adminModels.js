const mongoose = require('mongoose');

// ── Admin-managed subjects ─────────────────────────────────────────────────────
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

  // Resources — YouTube, notes, websites etc.
  // NOTE: 'resourceType' used instead of 'type' (Mongoose reserved keyword)
  resources: [{
    name:         { type: String, required: true },
    url:          { type: String, required: true },
    resourceType: { type: String, enum: ['video','notes','website','book','practice'], default: 'video' },
    language:     { type: String, enum: ['Hindi','Nepali','English','Other'], default: 'English' },
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Email settings (singleton) ─────────────────────────────────────────────────
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
