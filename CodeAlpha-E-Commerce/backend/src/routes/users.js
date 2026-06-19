const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    res.json({ user: req.user.toProfile() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, avatar, gender, dateOfBirth, bio, storeName, storeDescription, businessEmail, businessPhone } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (bio !== undefined) user.bio = bio;
    if (user.role === 'SELLER') {
      if (storeName) user.storeName = storeName;
      if (storeDescription !== undefined) user.storeDescription = storeDescription;
      if (businessEmail !== undefined) user.businessEmail = businessEmail;
      if (businessPhone !== undefined) user.businessPhone = businessPhone;
    }
    await user.save();
    res.json({ user: user.toProfile() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/addresses
router.put('/addresses', protect, async (req, res, next) => {
  try {
    const { addresses } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Explicitly marking addresses field as changed so Sequelize updates JSONB correctly
    user.addresses = addresses || [];
    user.changed('addresses', true);
    
    await user.save();
    res.json({ user: user.toProfile() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});

// GET /api/users (Admin only)
router.get('/', protect, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users.map(u => u.toProfile()));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id (Admin only)
router.delete('/:id', protect, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete an admin user' });
    }
    
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/role (Admin only)
router.patch('/:id/role', protect, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!['CUSTOMER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    user.role = role;
    await user.save();
    res.json({ user: user.toProfile() });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/verification (Admin only)
router.patch('/:id/verification', protect, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { verificationStatus } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }
    
    user.verificationStatus = verificationStatus;
    await user.save();
    res.json({ user: user.toProfile() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
