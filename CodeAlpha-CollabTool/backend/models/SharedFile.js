const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    iv: {
      type: String,
      required: [true, 'Initialization vector is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sharedFileSchema.index({ boardId: 1 });

module.exports = mongoose.model('SharedFile', sharedFileSchema);
