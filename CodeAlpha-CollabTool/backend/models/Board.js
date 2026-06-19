const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      minlength: [1, 'Title must not be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    coverColor: {
      type: String,
      default: '#6366f1', // indigo accent
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board must have an owner'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    encryptionKey: {
      type: String,
      default: () => require('crypto').randomBytes(32).toString('base64'),
    },
  },
  {
    timestamps: true,
  }
);

// ─── Index: Fast lookups by owner and member ──────────────────────────────
boardSchema.index({ owner: 1 });
boardSchema.index({ members: 1 });

// ─── Virtual: combined participant list (owner + members, deduplicated) ───
boardSchema.virtual('participants').get(function () {
  const ids = [this.owner.toString(), ...this.members.map((m) => m.toString())];
  return [...new Set(ids)];
});

const Board = mongoose.model('Board', boardSchema);
module.exports = Board;
