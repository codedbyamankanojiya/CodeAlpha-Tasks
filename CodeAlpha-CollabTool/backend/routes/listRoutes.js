const express = require('express');
const router = express.Router();
const { createList, updateList, deleteList } = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createList);
router.patch('/:listId', updateList);
router.delete('/:listId', deleteList);

module.exports = router;
