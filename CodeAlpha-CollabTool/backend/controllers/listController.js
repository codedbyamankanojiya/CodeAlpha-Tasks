const List = require('../models/List');
const Board = require('../models/Board');
const Card = require('../models/Card');

/**
 * POST /api/lists
 * Creates a new list (column) for a board.
 */
const createList = async (req, res) => {
  try {
    const { title, boardId } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({ success: false, message: 'Title and boardId are required.' });
    }

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found.' });

    const participantIds = [board.owner.toString(), ...board.members.map((m) => m.toString())];
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Determine next order value
    const maxOrderList = await List.findOne({ boardId }).sort({ order: -1 });
    const nextOrder = maxOrderList ? maxOrderList.order + 1 : 0;

    const list = await List.create({ title: title.trim(), boardId, order: nextOrder });

    res.status(201).json({ success: true, list: { ...list.toObject(), cards: [] } });
  } catch (error) {
    console.error('[listController.createList]', error);
    res.status(500).json({ success: false, message: 'Failed to create list.' });
  }
};

/**
 * PATCH /api/lists/:listId
 * Updates a list's title.
 */
const updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ success: false, message: 'List not found.' });

    if (req.body.title !== undefined) list.title = req.body.title.trim();
    await list.save();

    res.status(200).json({ success: true, list });
  } catch (error) {
    console.error('[listController.updateList]', error);
    res.status(500).json({ success: false, message: 'Failed to update list.' });
  }
};

/**
 * DELETE /api/lists/:listId
 * Deletes a list and all its cards.
 */
const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ success: false, message: 'List not found.' });

    await Card.deleteMany({ listId: list._id });
    await List.findByIdAndDelete(list._id);

    res.status(200).json({ success: true, message: 'List and its cards deleted.', listId: list._id });
  } catch (error) {
    console.error('[listController.deleteList]', error);
    res.status(500).json({ success: false, message: 'Failed to delete list.' });
  }
};

module.exports = { createList, updateList, deleteList };
