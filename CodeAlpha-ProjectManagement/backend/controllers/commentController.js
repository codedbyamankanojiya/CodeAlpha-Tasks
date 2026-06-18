const Comment = require('../models/Comment');
const Task = require('../models/Task');

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { text, taskId } = req.body;

    // Verify the task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      text,
      taskId,
      userId: req.user._id,
    });

    // Populate user info
    await comment.populate('userId', 'name email avatar');

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit('commentCreated', { comment, taskId });
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    console.error('[commentController.createComment]:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

// Get all comments for a task
exports.getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('[commentController.getCommentsByTask]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only allow owner to update
    if (comment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this comment' });
    }

    comment.text = text;
    await comment.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('commentUpdated', { comment, taskId: comment.taskId });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    console.error('[commentController.updateComment]:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only allow owner to delete
    if (comment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(id);

    // Emit socket event
    if (req.io) {
      req.io.emit('commentDeleted', { commentId: id, taskId: comment.taskId });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('[commentController.deleteComment]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};