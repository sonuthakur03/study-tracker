const mongoose = require('mongoose');

// ── Admin-managed subjects ─────────────────────────────────────────────────────
const adminSubjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, index: true },
  code:        { type: String, trim: true, index: true },
  semester:    { type: String, default: '5th', index: true },
  color:       { type: String, default: '#6366F1' },
  description: { type: String, trim: true },

  topics: [{
    title:       { type: String, required: true, trim: true },
    order:       { type: Number, default: 0 },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],

  // Resources — YouTube, notes, websites etc.
  resources: [{
    name:         { type: String, required: true, trim: true },
    url:          { type: String, required: true, trim: true },
    resourceType: { type: String, enum: ['video','notes','website','book','practice'], default: 'video' },
    language:     { type: String, enum: ['Hindi','Nepali','English','Other'], default: 'English' },
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

adminSubjectSchema.index({ semester: 1, name: 1 });

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

/**
 * Atomically retrieves or creates the singleton configuration document (ACID Atomicity).
 */
emailSettingsSchema.statics.getSingleton = async function () {
  return this.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  AdminSubject:  mongoose.model('AdminSubject',  adminSubjectSchema),
  EmailSettings: mongoose.model('EmailSettings', emailSettingsSchema),
};
