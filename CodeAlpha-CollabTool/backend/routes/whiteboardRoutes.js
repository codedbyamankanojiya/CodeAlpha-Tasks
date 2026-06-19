const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getWhiteboard, saveWhiteboard } = require('../controllers/whiteboardController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/:boardId/whiteboard', getWhiteboard);
router.post('/:boardId/whiteboard', saveWhiteboard);

module.exports = router;
