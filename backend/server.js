require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { startCronJobs } = require('./services/cronService');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'StudyTrack API running ✅' }));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/dsa',      require('./routes/dsa'));
app.use('/api/roadmap',  require('./routes/roadmap'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/college',  require('./routes/college'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/admin',    require('./routes/admin'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
