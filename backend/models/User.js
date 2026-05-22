const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  password:        { type: String, required: true, minlength: 6 },
  role:            { type: String, enum: ['user', 'admin'], default: 'user' },

  // Study stats
  streak:          { type: Number, default: 0 },
  longestStreak:   { type: Number, default: 0 },
  lastStudyDate:   { type: Date },
  totalStudyHours: { type: Number, default: 0 },
  todayStudyHours: { type: Number, default: 0 },
  lastResetDate:   { type: Date, default: Date.now },

  // Roadmap progress
  aimlPhase:       { type: Number, default: 0 },
  dePhase:         { type: Number, default: 0 },
  selectedPath:    { type: String, enum: ['aiml', 'de', 'both'], default: 'both' },

  // Settings
  emailReminders:  { type: Boolean, default: true },
  reminderTime:    { type: String, default: '07:00' },
  studyTarget:     { type: Number, default: 2 }, // hours per day

  // College
  semester:        { type: String, default: '5th' },
  college:         { type: String, default: 'TU BCA' },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
