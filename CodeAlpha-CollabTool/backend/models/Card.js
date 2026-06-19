const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      minlength: [1, 'Title must not be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: [true, 'Card must belong to a list'],
      index: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Card must belong to a board'],
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    labels: [
      {
        type: String,
        enum: ['bug', 'feature', 'design', 'backend', 'frontend', 'urgent', 'review'],
      },
    ],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    coverColor: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes for fast per-list and per-board ordering ────────────
cardSchema.index({ listId: 1, order: 1 });

const Card = mongoose.model('Card', cardSchema);
module.exports = Card;
