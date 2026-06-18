const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  getProjectDashboard,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createProject)
  .get(protect, getProjects);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.get('/:id/dashboard', protect, getProjectDashboard);

module.exports = router;