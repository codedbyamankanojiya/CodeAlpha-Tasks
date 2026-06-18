const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

const router = express.Router();

router.route('/')
  .post(protect, createComment);

router.route('/task/:taskId')
  .get(protect, getCommentsByTask);

router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;