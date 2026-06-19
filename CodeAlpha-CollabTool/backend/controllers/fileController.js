const fs = require('fs');
const path = require('path');
const SharedFile = require('../models/SharedFile');
const Board = require('../models/Board');

/**
 * Helper: Check if user is a member of the board (owner or in members list)
 */
async function checkBoardMembership(boardId, userId) {
  const board = await Board.findById(boardId);
  if (!board) return { error: 'Board not found', status: 404 };

  const participantIds = [board.owner.toString(), ...board.members.map((m) => m.toString())];
  if (!participantIds.includes(userId.toString())) {
    return { error: 'Access denied. You are not a member of this board/room.', status: 403 };
  }

  return { board };
}

/**
 * Upload an encrypted file metadata and file binary
 */
const uploadFile = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { iv, originalName, mimeType, size } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    if (!iv) {
      // Cleanup uploaded file on error
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Initialization vector (iv) is required.' });
    }

    // Authorization check
    const membership = await checkBoardMembership(boardId, req.user._id);
    if (membership.error) {
      fs.unlinkSync(req.file.path);
      return res.status(membership.status).json({ success: false, message: membership.error });
    }

    const newFile = await SharedFile.create({
      boardId,
      uploadedBy: req.user._id,
      originalName: originalName || req.file.originalname,
      mimeType: mimeType || req.file.mimetype,
      size: Number(size) || req.file.size,
      filePath: req.file.path,
      iv,
    });

    await newFile.populate('uploadedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Encrypted file uploaded successfully.',
      file: newFile,
    });
  } catch (error) {
    console.error('[fileController.uploadFile]', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to upload file.' });
  }
};

/**
 * Get all files for a specific board
 */
const getBoardFiles = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Authorization check
    const membership = await checkBoardMembership(boardId, req.user._id);
    if (membership.error) {
      return res.status(membership.status).json({ success: false, message: membership.error });
    }

    const files = await SharedFile.find({ boardId })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error('[fileController.getBoardFiles]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve files.' });
  }
};

/**
 * Download a file by ID (Guarded by membership check)
 */
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await SharedFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Authorization check using board membership
    const membership = await checkBoardMembership(file.boardId, req.user._id);
    if (membership.error) {
      return res.status(membership.status).json({ success: false, message: membership.error });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk.' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);

    // Stream download
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[fileController.downloadFile]', error);
    res.status(500).json({ success: false, message: 'Failed to download file.' });
  }
};

/**
 * Delete a file (Only uploader or board owner can delete)
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await SharedFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const board = await Board.findById(file.boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Associated board not found.' });
    }

    // Check permissions: must be file uploader OR board owner
    const isUploader = file.uploadedBy.toString() === req.user._id.toString();
    const isBoardOwner = board.owner.toString() === req.user._id.toString();

    if (!isUploader && !isBoardOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the uploader or room owner can delete this file.',
      });
    }

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete database entry
    await SharedFile.findByIdAndDelete(fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    console.error('[fileController.deleteFile]', error);
    res.status(500).json({ success: false, message: 'Failed to delete file.' });
  }
};

module.exports = {
  uploadFile,
  getBoardFiles,
  downloadFile,
  deleteFile,
};
