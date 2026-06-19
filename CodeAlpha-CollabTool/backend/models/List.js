const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      minlength: [1, 'Title must not be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'List must belong to a board'],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: '#1e293b', // slate-800 default column color
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Index: Efficient per-board list ordering ───────────────────
listSchema.index({ boardId: 1, order: 1 });

const List = mongoose.model('List', listSchema);
module.exports = List;
