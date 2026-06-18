const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Sequelize findOne where clause
    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      phone: phone || null,
      role: role || 'CUSTOMER',
    });
    
    const token = generateToken(user.id);
    res.status(201).json({ message: 'Account created', user: user.toProfile(), token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Sequelize findOne where clause
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = generateToken(user.id);
    res.json({ message: 'Login successful', user: user.toProfile(), token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toProfile() });
});

module.exports = router;
