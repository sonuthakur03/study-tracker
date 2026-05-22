const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  notes:       { type: String },
  order:       { type: Number, default: 0 },
}, { _id: true });

const collegeSubjectSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true, trim: true }, // "Artificial Intelligence"
  code:     { type: String, trim: true },                 // "CSC-351"
  semester: { type: String, default: '5th' },
  color:    { type: String, default: '#6366F1' },
  topics:   [topicSchema],
}, { timestamps: true });

module.exports = mongoose.model('CollegeSubject', collegeSubjectSchema);
