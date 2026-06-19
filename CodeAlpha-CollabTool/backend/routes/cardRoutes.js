const express = require('express');
const router = express.Router();
const { createCard, updateCard, deleteCard, moveCard } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createCard);
router.patch('/:cardId', updateCard);
router.patch('/:cardId/move', moveCard);
router.delete('/:cardId', deleteCard);

module.exports = router;
