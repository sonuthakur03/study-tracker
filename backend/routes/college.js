const { projectsRouter, collegeRouter } = require('./projects-college');

// Add global subjects endpoint to the college router
const { AdminSubject } = require('../models/adminModels');
const { auth } = require('../middleware/auth');

// GET /api/college/global-subjects — used by assignment dropdown
collegeRouter.get('/global-subjects', auth, async (req, res) => {
  try {
    const subjects = await AdminSubject.find().sort({ semester: 1, name: 1 }).select('name code semester color');
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = collegeRouter;
