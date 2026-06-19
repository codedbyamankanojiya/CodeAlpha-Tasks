const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
      unique: true,
    },
    canvasData: {
      type: String,
      default: '', // base64 representation or path list of drawing canvas
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
