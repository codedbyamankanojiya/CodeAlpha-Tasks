const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');


/**
 * GET /api/boards
 * Returns all boards where the user is owner OR a member.
 */
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
      isArchived: false,
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: boards.length, boards });
  } catch (error) {
    console.error('[boardController.getBoards]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch boards.' });
  }
};

/**
 * POST /api/boards
 * Creates a new board with the authenticated user as owner.
 */
const createBoard = async (req, res) => {
  try {
    const { title, description, coverColor } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Board title is required.' });
    }

    const board = await Board.create({
      title: title.trim(),
      description: description?.trim() || '',
      coverColor: coverColor || '#6366f1',
      owner: req.user._id,
      members: [],
    });

    await board.populate('owner', 'name email avatar');

    // Auto-create default starter lists
    const defaultLists = ['To Do', 'In Progress', 'Done'];
    await Promise.all(
      defaultLists.map((listTitle, index) =>
        List.create({ title: listTitle, boardId: board._id, order: index })
      )
    );

    res.status(201).json({ success: true, message: 'Board created successfully.', board });
  } catch (error) {
    console.error('[boardController.createBoard]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create board.' });
  }
};

/**
 * GET /api/boards/:boardId
 * Returns a single board with full list + card tree.
 */
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' });
    }

    // Authorization: must be owner or member
    const participantIds = [board.owner._id.toString(), ...board.members.map((m) => m._id.toString())];
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this board.' });
    }

    // Fetch all lists for this board, ordered
    const lists = await List.find({ boardId: board._id }).sort({ order: 1 });

    // Fetch all cards for this board, grouped by listId
    const cards = await Card.find({ boardId: board._id })
      .populate('assignees', 'name email avatar')
      .sort({ order: 1 });

    // Build a map: listId -> cards[]
    const cardsByList = {};
    lists.forEach((list) => {
      cardsByList[list._id.toString()] = [];
    });
    cards.forEach((card) => {
      const key = card.listId.toString();
      if (cardsByList[key]) {
        cardsByList[key].push(card);
      }
    });

    // Attach cards to each list
    const listsWithCards = lists.map((list) => ({
      ...list.toObject(),
      cards: cardsByList[list._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      board: {
        ...board.toObject(),
        lists: listsWithCards,
      },
    });
  } catch (error) {
    console.error('[boardController.getBoardById]', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid board ID format.' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch board.' });
  }
};

/**
 * PATCH /api/boards/:boardId
 * Updates board title, description, or coverColor.
 */
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the board owner can update settings.' });
    }

    const { title, description, coverColor } = req.body;
    if (title !== undefined) board.title = title.trim();
    if (description !== undefined) board.description = description.trim();
    if (coverColor !== undefined) board.coverColor = coverColor;

    await board.save();
    await board.populate('owner', 'name email avatar');
    await board.populate('members', 'name email avatar');

    res.status(200).json({ success: true, message: 'Board updated.', board });
  } catch (error) {
    console.error('[boardController.updateBoard]', error);
    res.status(500).json({ success: false, message: 'Failed to update board.' });
  }
};

/**
 * DELETE /api/boards/:boardId
 * Hard-deletes board, all its lists, and all its cards.
 */
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the board owner can delete it.' });
    }

    // Cascade delete: cards → lists → board
    await Card.deleteMany({ boardId: board._id });
    await List.deleteMany({ boardId: board._id });
    await Board.findByIdAndDelete(board._id);

    res.status(200).json({ success: true, message: 'Board and all its contents deleted successfully.' });
  } catch (error) {
    console.error('[boardController.deleteBoard]', error);
    res.status(500).json({ success: false, message: 'Failed to delete board.' });
  }
};

/**
 * POST /api/boards/:boardId/invite
 * Invites a user to a board by email.
 */
const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { boardId } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' });
    }

    // Authorization: only the board owner or existing members can invite
    const participantIds = [board.owner.toString(), ...board.members.map((m) => m.toString())];
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this board.' });
    }

    // Find the user by email
    const userToInvite = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToInvite) {
      return res.status(404).json({ success: false, message: 'User not found. They must register first.' });
    }

    const inviteeIdStr = userToInvite._id.toString();

    // Check if user is owner
    if (board.owner.toString() === inviteeIdStr) {
      return res.status(400).json({ success: false, message: 'User is the owner of this board.' });
    }

    // Check if user is already a member
    if (board.members.map(m => m.toString()).includes(inviteeIdStr)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this board.' });
    }

    board.members.push(userToInvite._id);
    await board.save();

    res.status(200).json({
      success: true,
      message: 'Member invited successfully.',
      member: {
        _id: userToInvite._id,
        name: userToInvite.name,
        email: userToInvite.email,
        avatar: userToInvite.avatar,
      },
    });
  } catch (error) {
    console.error('[boardController.inviteMember]', error);
    res.status(500).json({ success: false, message: 'Failed to invite member.' });
  }
};

/**
 * GET /api/boards/:boardId/stats
 * Returns statistics for the board.
 */
const getBoardStats = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found.' });
    }

    // Authorization check
    const participantIds = [board.owner.toString(), ...board.members.map((m) => m.toString())];
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get all lists
    const lists = await List.find({ boardId });
    // Get all cards
    const cards = await Card.find({ boardId });

    // Calculate stats
    const totalCards = cards.length;

    // Find the Done list(s)
    const doneListIds = lists
      .filter(l => l.title.toLowerCase() === 'done' || l.title.toLowerCase().includes('complete'))
      .map(l => l._id.toString());

    const completedCards = cards.filter(c => doneListIds.includes(c.listId.toString())).length;
    const completionPercentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

    const cardCountByList = lists.map(list => {
      const count = cards.filter(c => c.listId.toString() === list._id.toString()).length;
      return {
        listId: list._id,
        title: list.title,
        count
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalCards,
        completedCards,
        completionPercentage,
        cardCountByList
      }
    });
  } catch (error) {
    console.error('[boardController.getBoardStats]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats.' });
  }
};

module.exports = {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  getBoardStats,
};

