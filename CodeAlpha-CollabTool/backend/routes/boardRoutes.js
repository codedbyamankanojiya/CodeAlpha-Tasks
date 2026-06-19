const express = require('express');
const router = express.Router();
const {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  getBoardStats,
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All board routes require authentication

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoardById);
router.patch('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);
router.post('/:boardId/invite', inviteMember);
router.get('/:boardId/stats', getBoardStats);

module.exports = router;

