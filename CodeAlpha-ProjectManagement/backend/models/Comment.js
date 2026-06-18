const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be longer than 1000 characters'],
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Comment must belong to a task'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must belong to a user'],
  },
}, {
  timestamps: true,
});

commentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'userId',
    select: 'name email avatar',
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;