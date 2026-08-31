const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, index: true },
  password:        { type: String, required: true, minlength: 6 },
  role:            { type: String, enum: ['user', 'admin'], default: 'user', index: true },

  // Study stats
  streak:          { type: Number, default: 0 },
  longestStreak:   { type: Number, default: 0 },
  lastStudyDate:   { type: Date, index: true },
  totalStudyHours: { type: Number, default: 0 },
  todayStudyHours: { type: Number, default: 0 },
  lastResetDate:   { type: Date, default: Date.now },

  // Roadmap progress
  aimlPhase:       { type: Number, default: 0 },
  dePhase:         { type: Number, default: 0 },
  selectedPath:    { type: String, enum: ['aiml', 'de', 'both'], default: 'both' },

  // Settings
  emailReminders:  { type: Boolean, default: true, index: true },
  reminderTime:    { type: String, default: '07:00' },
  studyTarget:     { type: Number, default: 2 }, // hours per day

  // College
  semester:        { type: String, default: '6th' },
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

/**
 * Encapsulated study hour logging and streak calculation (DRY & ACID consistency).
 */
userSchema.methods.logStudyHours = function (hours) {
  const parsedHours = Number(hours);
  if (isNaN(parsedHours) || parsedHours <= 0) {
    throw new Error('Invalid study hours value');
  }

  const now = new Date();
  const today = now.toDateString();
  const lastStudy = this.lastStudyDate ? new Date(this.lastStudyDate).toDateString() : null;
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  this.totalStudyHours = (this.totalStudyHours || 0) + parsedHours;

  if (lastStudy === today) {
    this.todayStudyHours = (this.todayStudyHours || 0) + parsedHours;
  } else {
    this.todayStudyHours = parsedHours;
    if (lastStudy === yesterday) {
      this.streak = (this.streak || 0) + 1;
      if (this.streak > (this.longestStreak || 0)) {
        this.longestStreak = this.streak;
      }
    } else {
      this.streak = 1;
      if ((this.longestStreak || 0) === 0) {
        this.longestStreak = 1;
      }
    }
  }

  this.lastStudyDate = now;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
