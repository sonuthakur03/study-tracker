const mongoose = require('mongoose');

// ─── Task ───────────────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type:        { type: String, enum: ['aiml', 'de', 'college', 'dsa', 'project', 'general'], default: 'general', index: true },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed:   { type: Boolean, default: false, index: true },
  completedAt: { type: Date },
  dueDate:     { type: Date },
  date:        { type: String, index: true },
}, { timestamps: true });

taskSchema.index({ user: 1, date: 1 });
taskSchema.index({ user: 1, completed: 1 });

// ─── DSA Question ────────────────────────────────────────────────────────────
const dsaQuestionSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
  topic:        { type: String, required: true, trim: true, index: true },
  description:  { type: String, trim: true },
  resourceUrl:  { type: String, trim: true },
  platform:     { type: String, enum: ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'Other'], default: 'LeetCode' },
  dayNumber:    { type: Number, index: true },
  hints:        [String],
  solution:     { type: String },
  completedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
}, { timestamps: true });

// ─── Roadmap Topic ───────────────────────────────────────────────────────────
const resourceSchema = new mongoose.Schema({
  name:         { type: String, trim: true },
  url:          { type: String, trim: true },
  resourceType: { type: String, trim: true }, // e.g. 'course', 'video', 'docs', 'book'
}, { _id: false });

const roadmapTopicSchema = new mongoose.Schema({
  path:         { type: String, enum: ['aiml', 'de'], required: true, index: true },
  phase:        { type: Number, required: true, index: true },
  phaseTitle:   { type: String, required: true, trim: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  resources:    [resourceSchema],
  weekTarget:   { type: String, trim: true },
  order:        { type: Number, default: 0 },
  completedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  tags:         [String],
}, { timestamps: true });

roadmapTopicSchema.index({ path: 1, phase: 1, order: 1 });

// ─── Project ──────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  status:       { type: String, enum: ['idea', 'in-progress', 'completed', 'paused'], default: 'idea', index: true },
  githubUrl:    { type: String, trim: true },
  liveUrl:      { type: String, trim: true },
  techStack:    [String],
  type:         { type: String, enum: ['aiml', 'de', 'college', 'personal'], default: 'personal', index: true },
  startDate:    { type: Date },
  endDate:      { type: Date },
  notes:        { type: String, trim: true },
}, { timestamps: true });

projectSchema.index({ user: 1, updatedAt: -1 });

// ─── Assignment ───────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject:      { type: String, required: true, trim: true, index: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  dueDate:      { type: Date, required: true, index: true },
  completed:    { type: Boolean, default: false, index: true },
  completedAt:  { type: Date },
  priority:     { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

assignmentSchema.index({ user: 1, dueDate: 1 });
assignmentSchema.index({ completed: 1, dueDate: 1 });

// ─── College Schedule ─────────────────────────────────────────────────────────
const scheduleSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  day:          { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true, index: true },
  subject:      { type: String, required: true, trim: true },
  startTime:    { type: String, required: true },
  endTime:      { type: String, required: true },
  room:         { type: String, trim: true },
  teacher:      { type: String, trim: true },
  type:         { type: String, enum: ['lecture', 'lab', 'tutorial'], default: 'lecture' },
}, { timestamps: true });

scheduleSchema.index({ user: 1, day: 1, startTime: 1 });

// ─── Announcement ─────────────────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  content:      { type: String, required: true, trim: true },
  type:         { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  sentEmail:    { type: Boolean, default: false },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });

const { VideoDailyLog, VideoCreditState, VideoIdea } = require('./VideoPlanner');

module.exports = {
  Task:             mongoose.model('Task',         taskSchema),
  DSAQuestion:      mongoose.model('DSAQuestion',  dsaQuestionSchema),
  RoadmapTopic:     mongoose.model('RoadmapTopic', roadmapTopicSchema),
  Project:          mongoose.model('Project',      projectSchema),
  Assignment:       mongoose.model('Assignment',   assignmentSchema),
  Schedule:         mongoose.model('Schedule',     scheduleSchema),
  Announcement:     mongoose.model('Announcement', announcementSchema),
  VideoDailyLog,
  VideoCreditState,
  VideoIdea,
};
