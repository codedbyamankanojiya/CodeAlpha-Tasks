const express = require('express');
const { register, login, getMe, getAllUsers, updateProfile, changePassword, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/users', protect, getAllUsers);

module.exports = router;