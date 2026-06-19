const Card = require('../models/Card');
const List = require('../models/List');
const mongoose = require('mongoose');

/**
 * POST /api/cards
 * Creates a new card in a specified list.
 */
const createCard = async (req, res) => {
  try {
    const { title, listId, boardId, description } = req.body;

    if (!title || !listId || !boardId) {
      return res.status(400).json({ success: false, message: 'Title, listId, and boardId are required.' });
    }

    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ success: false, message: 'List not found.' });

    // Determine next order
    const maxOrderCard = await Card.findOne({ listId }).sort({ order: -1 });
    const nextOrder = maxOrderCard ? maxOrderCard.order + 1 : 0;

    const card = await Card.create({
      title: title.trim(),
      description: description?.trim() || '',
      listId,
      boardId,
      order: nextOrder,
    });

    res.status(201).json({ success: true, card });
  } catch (error) {
    console.error('[cardController.createCard]', error);
    res.status(500).json({ success: false, message: 'Failed to create card.' });
  }
};

/**
 * PATCH /api/cards/:cardId
 * Updates card title, description, labels, dueDate, or coverColor.
 */
const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found.' });

    const allowedFields = ['title', 'description', 'labels', 'dueDate', 'coverColor'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        card[field] = req.body[field];
      }
    });

    await card.save();
    res.status(200).json({ success: true, card });
  } catch (error) {
    console.error('[cardController.updateCard]', error);
    res.status(500).json({ success: false, message: 'Failed to update card.' });
  }
};

/**
 * DELETE /api/cards/:cardId
 * Deletes a card by ID.
 */
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.cardId);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found.' });

    res.status(200).json({ success: true, message: 'Card deleted.', cardId: card._id });
  } catch (error) {
    console.error('[cardController.deleteCard]', error);
    res.status(500).json({ success: false, message: 'Failed to delete card.' });
  }
};

/**
 * PATCH /api/cards/:cardId/move
 * Moves a card to a new list and/or new position.
 * Uses a MongoDB session for atomic order updates.
 */
const moveCard = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardId } = req.params;
    const { sourceListId, targetListId, sourceIndex, targetIndex } = req.body;

    if (!sourceListId || !targetListId || sourceIndex === undefined || targetIndex === undefined) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'sourceListId, targetListId, sourceIndex, and targetIndex are required.' });
    }

    const card = await Card.findById(cardId).session(session);
    if (!card) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Card not found.' });
    }

    const isSameList = sourceListId === targetListId;

    if (isSameList) {
      // Reorder within the same list
      const cards = await Card.find({ listId: sourceListId }).sort({ order: 1 }).session(session);

      // Remove card from current position and insert at target
      const reordered = cards.filter((c) => c._id.toString() !== cardId);
      reordered.splice(targetIndex, 0, card);

      // Bulk update order values
      const bulkOps = reordered.map((c, idx) => ({
        updateOne: {
          filter: { _id: c._id },
          update: { $set: { order: idx } },
        },
      }));
      await Card.bulkWrite(bulkOps, { session });
    } else {
      // Moving across lists
      const sourceCards = await Card.find({ listId: sourceListId }).sort({ order: 1 }).session(session);
      const targetCards = await Card.find({ listId: targetListId }).sort({ order: 1 }).session(session);

      // Remove from source
      const newSourceCards = sourceCards.filter((c) => c._id.toString() !== cardId);

      // Update card's listId and insert into target
      card.listId = targetListId;
      targetCards.splice(targetIndex, 0, card);

      // Build bulk ops for source list reorder
      const sourceBulk = newSourceCards.map((c, idx) => ({
        updateOne: { filter: { _id: c._id }, update: { $set: { order: idx } } },
      }));

      // Build bulk ops for target list reorder (includes moved card with new listId)
      const targetBulk = targetCards.map((c, idx) => ({
        updateOne: {
          filter: { _id: c._id },
          update: { $set: { order: idx, listId: targetListId } },
        },
      }));

      const allOps = [...sourceBulk, ...targetBulk];
      if (allOps.length > 0) {
        await Card.bulkWrite(allOps, { session });
      }
    }

    await session.commitTransaction();

    // Return updated card for broadcast
    const updatedCard = await Card.findById(cardId);
    res.status(200).json({ success: true, card: updatedCard, sourceListId, targetListId });
  } catch (error) {
    await session.abortTransaction();
    console.error('[cardController.moveCard]', error);
    res.status(500).json({ success: false, message: 'Failed to move card.' });
  } finally {
    session.endSession();
  }
};

module.exports = { createCard, updateCard, deleteCard, moveCard };
