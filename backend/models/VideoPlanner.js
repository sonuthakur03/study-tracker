const mongoose = require('mongoose');

// ─── Video Daily Log ───────────────────────────────────────────────────────────
const videoDailyLogSchema = new mongoose.Schema({
  date:               { type: String, required: true, index: true }, // 'YYYY-MM-DD'
  month:              { type: String, required: true, index: true }, // 'YYYY-MM'
  dayOfMonth:         { type: Number, required: true },              // 1 - 31
  isOddDay:           { type: Boolean, required: true },             // true for odd days, false for even
  cycleType:          { type: String, enum: ['generation_sprint', 'generation_and_edit'], required: true },
  plannedClips:       { type: Number, required: true },              // 10 for odd days, 5 for even days
  actualClips:        { type: Number, default: 0 },
  bonusCreditsUsed:   { type: Number, default: 0 },                  // e.g. up to 250 (5 accounts * 50)
  monthlyCreditsUsed: { type: Number, default: 0 },                  // 50 on odd days, 0 on even days
  accountsCompleted:  { type: [Number], default: [] },               // indices of completed accounts (1-based, e.g. [1,2,3,4,5])
  isCompleted:        { type: Boolean, default: false, index: true },
  completedAt:        { type: Date },
  completedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:              { type: String, trim: true },
  driveUrl:           { type: String, trim: true },
}, { timestamps: true });

videoDailyLogSchema.index({ month: 1, dayOfMonth: 1 }, { unique: true });

// ─── Video Credit Monthly State ───────────────────────────────────────────────
const videoCreditStateSchema = new mongoose.Schema({
  yearMonth:              { type: String, required: true, unique: true, index: true }, // 'YYYY-MM'
  monthlyPoolTotal:       { type: Number, default: 1000 },
  monthlyPoolUsed:        { type: Number, default: 0 },
  totalClipsGenerated:    { type: Number, default: 0 },
  accountsCount:          { type: Number, default: 5 },   // 5 bonus accounts
  bonusCreditsPerAccount: { type: Number, default: 50 },  // 50 credits per account/day
  secondsPerClip:         { type: Number, default: 8 },   // 8 seconds per clip (10 credits)
  creditsPerClip:         { type: Number, default: 10 },  // 10 credits per clip
  targetClipsPerVideo:    { type: Number, default: 15 },  // 15 clips = 120s / 2m
  generalDriveUrl:        { type: String, default: '' },
}, { timestamps: true });

// ─── Collaborative Video Idea ─────────────────────────────────────────────────
const videoIdeaSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  concept:        { type: String, trim: true },
  targetClips:    { type: Number, default: 15 },
  status:         { type: String, enum: ['idea', 'scripting', 'generating', 'editing', 'ready', 'published'], default: 'idea', index: true },
  driveUrl:       { type: String, trim: true },
  promptTemplate: { type: String, trim: true },
  notes:          { type: String, trim: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  VideoDailyLog:    mongoose.model('VideoDailyLog',    videoDailyLogSchema),
  VideoCreditState: mongoose.model('VideoCreditState', videoCreditStateSchema),
  VideoIdea:        mongoose.model('VideoIdea',        videoIdeaSchema),
};
