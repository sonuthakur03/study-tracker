const mongoose = require('mongoose');

// ─── Task ───────────────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String },
  type:        { type: String, enum: ['aiml', 'de', 'college', 'dsa', 'project', 'general'], default: 'general' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  dueDate:     { type: Date },
  date:        { type: String },
}, { timestamps: true });

// ─── DSA Question ────────────────────────────────────────────────────────────
const dsaQuestionSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic:        { type: String, required: true },
  description:  { type: String },
  resourceUrl:  { type: String },
  platform:     { type: String, enum: ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'Other'], default: 'LeetCode' },
  dayNumber:    { type: Number },
  hints:        [String],
  solution:     { type: String },
  completedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ─── Roadmap Topic ───────────────────────────────────────────────────────────
// NOTE: 'type' is a reserved Mongoose keyword inside schema objects.
//       We use 'resourceType' for the resource category field instead.
const resourceSchema = new mongoose.Schema({
  name:         { type: String },
  url:          { type: String },
  resourceType: { type: String }, // e.g. 'course', 'video', 'docs', 'book'
}, { _id: false });

const roadmapTopicSchema = new mongoose.Schema({
  path:         { type: String, enum: ['aiml', 'de'], required: true },
  phase:        { type: Number, required: true },
  phaseTitle:   { type: String, required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  resources:    [resourceSchema],
  weekTarget:   { type: String },
  order:        { type: Number, default: 0 },
  completedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags:         [String],
}, { timestamps: true });

// ─── Project ──────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  status:       { type: String, enum: ['idea', 'in-progress', 'completed', 'paused'], default: 'idea' },
  githubUrl:    { type: String },
  liveUrl:      { type: String },
  techStack:    [String],
  type:         { type: String, enum: ['aiml', 'de', 'college', 'personal'], default: 'personal' },
  startDate:    { type: Date },
  endDate:      { type: Date },
  notes:        { type: String },
}, { timestamps: true });

// ─── Assignment ───────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:      { type: String, required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  dueDate:      { type: Date, required: true },
  completed:    { type: Boolean, default: false },
  completedAt:  { type: Date },
  priority:     { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

// ─── College Schedule ─────────────────────────────────────────────────────────
const scheduleSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day:          { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  subject:      { type: String, required: true },
  startTime:    { type: String, required: true },
  endTime:      { type: String, required: true },
  room:         { type: String },
  teacher:      { type: String },
  type:         { type: String, enum: ['lecture', 'lab', 'tutorial'], default: 'lecture' },
}, { timestamps: true });

// ─── Announcement ─────────────────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  content:      { type: String, required: true },
  type:         { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  sentEmail:    { type: Boolean, default: false },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  Task:         mongoose.model('Task',         taskSchema),
  DSAQuestion:  mongoose.model('DSAQuestion',  dsaQuestionSchema),
  RoadmapTopic: mongoose.model('RoadmapTopic', roadmapTopicSchema),
  Project:      mongoose.model('Project',      projectSchema),
  Assignment:   mongoose.model('Assignment',   assignmentSchema),
  Schedule:     mongoose.model('Schedule',     scheduleSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
};
