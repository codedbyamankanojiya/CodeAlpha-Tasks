const jwt = require('jsonwebtoken');
const Card = require('../models/Card');
const mongoose = require('mongoose');

// ─── In-memory map of boardId → Set of active user info objects ──────────
// Shape: Map<boardId: string, Map<socketId: string, { userId, name, email, avatar }>>
const boardActiveUsers = new Map();

/**
 * Initializes all Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
const socketHandler = (io) => {
  // ─── Global JWT Authentication Middleware ─────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // attach decoded payload { id, iat, exp }
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] 🔌 Client connected: ${socket.id} | User: ${socket.user?.id}`);

    // ─── JOIN BOARD ────────────────────────────────────────────────────
    socket.on('join-board', ({ boardId, user }) => {
      if (!boardId) return;

      socket.join(boardId);
      socket.currentBoardId = boardId;

      // Register this user in the active-users map
      if (!boardActiveUsers.has(boardId)) {
        boardActiveUsers.set(boardId, new Map());
      }
      boardActiveUsers.get(boardId).set(socket.id, {
        socketId: socket.id,
        userId: user?._id || socket.user.id,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        avatar: user?.avatar || '',
      });

      const activeList = Array.from(boardActiveUsers.get(boardId).values());

      // Broadcast updated active users list to ALL sockets in the room (including caller)
      io.to(boardId).emit('active-users-update', { boardId, users: activeList });

      console.log(`[Socket.io] User ${user?.name} joined board ${boardId}. Active users: ${activeList.length}`);
    });

    // ─── LEAVE BOARD ──────────────────────────────────────────────────
    socket.on('leave-board', ({ boardId }) => {
      handleLeaveBoard(io, socket, boardId);
    });

    // ─── MOVE CARD (Drag and Drop) ────────────────────────────────────
    socket.on('move-card', async ({ cardId, sourceListId, targetListId, sourceIndex, targetIndex, boardId }) => {
      if (!cardId || !sourceListId || !targetListId || sourceIndex === undefined || targetIndex === undefined || !boardId) {
        socket.emit('move-card-error', { message: 'Invalid move-card payload.' });
        return;
      }

      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const card = await Card.findById(cardId).session(session);
          if (!card) {
            await session.abortTransaction();
            socket.emit('move-card-error', { message: 'Card not found.' });
            return;
          }

          const isSameList = sourceListId === targetListId;

          if (isSameList) {
            const cards = await Card.find({ listId: sourceListId }).sort({ order: 1 }).session(session);
            const reordered = cards.filter((c) => c._id.toString() !== cardId);
            reordered.splice(targetIndex, 0, card);

            const bulkOps = reordered.map((c, idx) => ({
              updateOne: { filter: { _id: c._id }, update: { $set: { order: idx } } },
            }));
            if (bulkOps.length > 0) await Card.bulkWrite(bulkOps, { session });
          } else {
            const sourceCards = await Card.find({ listId: sourceListId }).sort({ order: 1 }).session(session);
            const targetCards = await Card.find({ listId: targetListId }).sort({ order: 1 }).session(session);

            const newSourceCards = sourceCards.filter((c) => c._id.toString() !== cardId);
            card.listId = targetListId;
            targetCards.splice(targetIndex, 0, card);

            const sourceBulk = newSourceCards.map((c, idx) => ({
              updateOne: { filter: { _id: c._id }, update: { $set: { order: idx } } },
            }));
            const targetBulk = targetCards.map((c, idx) => ({
              updateOne: { filter: { _id: c._id }, update: { $set: { order: idx, listId: targetListId } } },
            }));

            const allOps = [...sourceBulk, ...targetBulk];
            if (allOps.length > 0) await Card.bulkWrite(allOps, { session });
          }

          await session.commitTransaction();

          const updatedCard = await Card.findById(cardId);

          // Broadcast to all OTHER users in the room (not the originator)
          socket.to(boardId).emit('card-moved-update', {
            cardId,
            sourceListId,
            targetListId,
            sourceIndex,
            targetIndex,
            boardId,
            updatedCard,
          });

          console.log(`[Socket.io] Card ${cardId} moved in board ${boardId}`);
        } catch (err) {
          await session.abortTransaction();
          throw err;
        } finally {
          session.endSession();
        }
      } catch (error) {
        console.error('[Socket.io move-card error]', error);
        socket.emit('move-card-error', { message: 'Server error while moving card.' });
      }
    });

    // ─── ADD CARD (broadcast to others) ──────────────────────────────
    socket.on('add-card', ({ card, boardId }) => {
      if (!card || !boardId) return;
      socket.to(boardId).emit('card-added', { card, boardId });
      console.log(`[Socket.io] Card added in board ${boardId}`);
    });

    // ─── UPDATE CARD ─────────────────────────────────────────────────
    socket.on('update-card', ({ card, boardId }) => {
      if (!card || !boardId) return;
      socket.to(boardId).emit('card-updated', { card, boardId });
    });

    // ─── DELETE CARD ─────────────────────────────────────────────────
    socket.on('delete-card', ({ cardId, listId, boardId }) => {
      if (!cardId || !boardId) return;
      socket.to(boardId).emit('card-deleted', { cardId, listId, boardId });
    });

    // ─── ADD LIST (Column) ────────────────────────────────────────────
    socket.on('add-list', ({ list, boardId }) => {
      if (!list || !boardId) return;
      socket.to(boardId).emit('list-added', { list, boardId });
    });

    // ─── DELETE LIST ──────────────────────────────────────────────────
    socket.on('delete-list', ({ listId, boardId }) => {
      if (!listId || !boardId) return;
      socket.to(boardId).emit('list-deleted', { listId, boardId });
    });

    // ─── UPDATE LIST ──────────────────────────────────────────────────
    socket.on('update-list', ({ list, boardId }) => {
      if (!list || !boardId) return;
      socket.to(boardId).emit('list-updated', { list, boardId });
    });

    // ─── USER TYPING INDICATOR ──────────────────────────────────────────
    socket.on('user-typing', ({ boardId, userId, name, isTyping }) => {
      if (!boardId || !userId) return;
      socket.to(boardId).emit('user-typing-update', { userId, name, isTyping });
    });

    // ─── WEBRTC VIDEO CALL EVENTS ───────────────────────────────────────
    socket.on('join-call', ({ boardId }) => {
      if (!boardId) return;
      const callRoom = `call-${boardId}`;
      socket.join(callRoom);
      socket.currentCallBoardId = boardId;

      socket.to(callRoom).emit('user-joined-call', {
        socketId: socket.id,
        userId: socket.user.id,
        name: socket.user.name,
      });
      console.log(`[Socket.io] Socket ${socket.id} joined call room ${callRoom}`);
    });

    socket.on('webrtc-signal', ({ targetId, signal }) => {
      io.to(targetId).emit('webrtc-signal', {
        senderId: socket.id,
        signal,
      });
    });

    socket.on('leave-call', ({ boardId }) => {
      handleLeaveCall(io, socket, boardId);
    });

    // ─── WHITEBOARD DRAWING SYNC EVENTS ─────────────────────────────────
    socket.on('whiteboard-draw', ({ boardId, drawData }) => {
      if (!boardId) return;
      socket.to(boardId).emit('whiteboard-draw', drawData);
    });

    socket.on('whiteboard-clear', ({ boardId }) => {
      if (!boardId) return;
      socket.to(boardId).emit('whiteboard-clear');
    });

    socket.on('whiteboard-request-state', ({ boardId }) => {
      if (!boardId) return;
      const room = io.sockets.adapter.rooms.get(boardId);
      if (room) {
        const otherSockets = Array.from(room).filter((id) => id !== socket.id);
        if (otherSockets.length > 0) {
          io.to(otherSockets[0]).emit('whiteboard-request-state', { requesterId: socket.id });
        }
      }
    });

    socket.on('whiteboard-send-state', ({ requesterId, canvasData }) => {
      if (!requesterId) return;
      io.to(requesterId).emit('whiteboard-send-state', { canvasData });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] ❌ Client disconnected: ${socket.id} | Reason: ${reason}`);

      if (socket.currentBoardId) {
        handleLeaveBoard(io, socket, socket.currentBoardId);
      }
      if (socket.currentCallBoardId) {
        handleLeaveCall(io, socket, socket.currentCallBoardId);
      }
    });
  });
};

/**
 * Removes a socket from a board room and broadcasts the updated user list.
 */
function handleLeaveBoard(io, socket, boardId) {
  socket.leave(boardId);

  if (boardActiveUsers.has(boardId)) {
    boardActiveUsers.get(boardId).delete(socket.id);

    if (boardActiveUsers.get(boardId).size === 0) {
      boardActiveUsers.delete(boardId);
    } else {
      const activeList = Array.from(boardActiveUsers.get(boardId).values());
      io.to(boardId).emit('active-users-update', { boardId, users: activeList });
    }
  }
}

/**
 * Removes a socket from a call room and notifies other call members.
 */
function handleLeaveCall(io, socket, boardId) {
  const callRoom = `call-${boardId}`;
  socket.leave(callRoom);
  socket.currentCallBoardId = null;
  io.to(callRoom).emit('user-left-call', { socketId: socket.id });
  console.log(`[Socket.io] Socket ${socket.id} left call room ${callRoom}`);
}

module.exports = socketHandler;
