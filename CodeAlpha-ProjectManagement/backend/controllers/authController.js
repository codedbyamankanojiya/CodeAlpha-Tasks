const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('[authController.register]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('[authController.login]', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user.toPublicProfile() });
  } catch (error) {
    console.error('[authController.getMe]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('[authController.getAllUsers]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, displayName, bio, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required.' });
      }
      user.name = name.trim();
    }

    if (displayName !== undefined) {
      user.displayName = displayName ? displayName.trim() : '';
    }
    if (bio !== undefined) {
      user.bio = bio ? bio.trim() : '';
    }
    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : '';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('[authController.updateProfile]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new avatar path
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      user: user.toPublicProfile(),
      avatarUrl: user.avatar,
    });
  } catch (error) {
    console.error('[authController.uploadAvatar]', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('[authController.changePassword]', error);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = { register, login, getMe, getAllUsers, updateProfile, changePassword, uploadAvatar };