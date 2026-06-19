const Whiteboard = require('../models/Whiteboard');
const Board = require('../models/Board');

/**
 * Helper: Check if user is a member of the board
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
 * GET /api/boards/:boardId/whiteboard
 * Get the current whiteboard drawing state for a board
 */
const getWhiteboard = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Authorization check
    const membership = await checkBoardMembership(boardId, req.user._id);
    if (membership.error) {
      return res.status(membership.status).json({ success: false, message: membership.error });
    }

    let whiteboard = await Whiteboard.findOne({ boardId });
    if (!whiteboard) {
      // Create a default empty whiteboard
      whiteboard = await Whiteboard.create({ boardId, canvasData: '' });
    }

    res.status(200).json({
      success: true,
      whiteboard,
    });
  } catch (error) {
    console.error('[whiteboardController.getWhiteboard]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve whiteboard drawing.' });
  }
};

/**
 * POST /api/boards/:boardId/whiteboard
 * Save/Update the whiteboard drawing state for a board
 */
const saveWhiteboard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { canvasData } = req.body;

    // Authorization check
    const membership = await checkBoardMembership(boardId, req.user._id);
    if (membership.error) {
      return res.status(membership.status).json({ success: false, message: membership.error });
    }

    const whiteboard = await Whiteboard.findOneAndUpdate(
      { boardId },
      { canvasData: canvasData || '' },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Whiteboard drawing saved successfully.',
      whiteboard,
    });
  } catch (error) {
    console.error('[whiteboardController.saveWhiteboard]', error);
    res.status(500).json({ success: false, message: 'Failed to save whiteboard drawing.' });
  }
};

module.exports = {
  getWhiteboard,
  saveWhiteboard,
};
